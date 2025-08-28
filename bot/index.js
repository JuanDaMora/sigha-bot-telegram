import { Telegraf } from "telegraf";
import { loadUsers, saveUsers, getRoleName } from "./userStore.js";
import { healthcheck, query } from "./db.js";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
let data = loadUsers();

// ------------------ Helpers ------------------ //
function isCreator(ctx) {
  return ctx.from.id.toString() === data.creator.toString();
}
function isAdmin(ctx) {
  const id = ctx.from.id.toString();
  return isCreator(ctx) || data.users[id]?.role === "admin";
}
function deny(ctx) {
  return ctx.reply("❌ No tienes permisos para usar este comando.");
}

// ------------------ /start ------------------ //
bot.start((ctx) => {
  const id = ctx.from.id.toString();

  if (isCreator(ctx)) {
    return ctx.reply(
      `👑 Bienvenido Creador.\nTu chat.id es: ${id}\nRol: Creador`
    );
  }

  if (!data.users[id]) {
    data.users[id] = { role: "pending" };
    saveUsers(data);

    ctx.reply(
      `👋 Hola! Tu chat.id es: ${id}\nRol actual: PENDIENTE.\nEspera aprobación del Creador.`
    );

    bot.telegram.sendMessage(
      data.creator,
      `🚨 Nuevo usuario detectado\nID: ${id}\nEstado: pendiente`
    );
  } else {
    const role = data.users[id].role;
    ctx.reply(
      `✅ Ya estás registrado.\nTu chat.id es: ${id}\nRol actual: ${getRoleName(
        role
      )}`
    );
  }
});

// ------------------ Gestión de usuarios ------------------ //
bot.command("aprobar", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /aprobar <id>");
  data.users[id] = { role: "approved" };
  saveUsers(data);
  ctx.reply(`✅ Usuario ${id} aprobado.`);
  bot.telegram.sendMessage(id, "🎉 Has sido aprobado, ya puedes usar el bot.");
});

bot.command("bloquear", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /bloquear <id>");
  data.users[id] = { role: "blocked" };
  saveUsers(data);
  ctx.reply(`⛔ Usuario ${id} bloqueado.`);
  bot.telegram.sendMessage(id, "❌ Has sido bloqueado.");
});

bot.command("eliminar", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /eliminar <id>");
  delete data.users[id];
  saveUsers(data);
  ctx.reply(`🗑️ Usuario ${id} eliminado.`);
});

bot.command("promover", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /promover <id>");
  data.users[id] = { role: "admin" };
  saveUsers(data);
  ctx.reply(`⭐ Usuario ${id} promovido a Administrador.`);
  bot.telegram.sendMessage(id, "⭐ Has sido promovido a Administrador.");
});

bot.command("revocar", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /revocar <id>");
  data.users[id] = { role: "approved" };
  saveUsers(data);
  ctx.reply(`🔄 Usuario ${id} ya no es Administrador.`);
  bot.telegram.sendMessage(id, "🔄 Se revocó tu rol de Administrador.");
});

bot.command("listar", (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  let mensaje = "📋 Lista de usuarios:\n\n";
  Object.entries(data.users).forEach(([id, info]) => {
    mensaje += `👤 ID: ${id} → Rol: ${info.role}\n`;
  });
  ctx.reply(mensaje);
});

// ------------------ Consultar usuario por documento ------------------ //
bot.command("usuario", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);
  const documento = ctx.message.text.split(" ")[1];
  if (!documento) return ctx.reply("Uso: /usuario <documento>");

  try {
    const sql = `
      SELECT u.id, u.email, u.documento, u.first_name, u.last_name, u.active,
             u.creation_date, u.update_date, ac.last_login
      FROM sigha."user" u
      LEFT JOIN sigha.access_control ac ON ac.id_user = u.id
      WHERE u.documento = $1
      ORDER BY ac.last_login DESC
      LIMIT 1;
    `;
    const res = await query(sql, [documento]);
    if (!res.rows.length) return ctx.reply("📭 No se encontró.");
    const u = res.rows[0];
    return ctx.reply(`👤 Usuario:
- Documento: ${u.documento}
- Nombre: ${u.first_name ?? ""} ${u.last_name ?? ""}
- Email: ${u.email ?? "(sin email)"}
- Activo: ${u.active ? "✅" : "❌"}
- Última sesión: ${u.last_login ?? "❌ Nunca"}`);
  } catch (e) {
    return ctx.reply(`❌ Error: ${e.message}`);
  }
});

// ------------------ Consultar áreas y asignaturas ------------------ //
bot.command("areas", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);

  try {
    const sql = `
      SELECT a.id   AS area_id,
             a.description AS area,
             s.codigo,
             s.name AS asignatura
      FROM sigha.area a
      LEFT JOIN sigha.subject s ON s.id_area = a.id
      ORDER BY a.description, s.name;
    `;
    const res = await query(sql);

    if (!res.rows.length) {
      return ctx.reply("📭 No se encontraron áreas ni asignaturas.");
    }

    // Agrupamos por área
    const grouped = {};
    res.rows.forEach((row) => {
      if (!grouped[row.area]) grouped[row.area] = [];
      if (row.asignatura) {
        grouped[row.area].push(`${row.codigo}: ${row.asignatura}`);
      }
    });

    // Construimos el mensaje
    let mensaje = "📚 Áreas y asignaturas:\n\n";
    Object.entries(grouped).forEach(([area, asignaturas]) => {
      mensaje += `🔹 ${area}\n`;
      if (asignaturas.length > 0) {
        asignaturas.forEach((asig) => (mensaje += `   - ${asig}\n`));
      } else {
        mensaje += "   (sin asignaturas)\n";
      }
      mensaje += "\n";
    });

    return ctx.reply(mensaje);
  } catch (e) {
    console.error("/areas error", e);
    return ctx.reply(`❌ Error al consultar áreas: ${e.message}`);
  }
});

// ------------------ DB & Test ------------------ //
bot.command("db", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);
  const ok = await healthcheck();
  if (!ok) return ctx.reply("❌ DB no respondió.");
  return ctx.reply("✅ DB OK");
});

bot.command("test", async (ctx) => {
  if (!isCreator(ctx)) return deny(ctx);
  const res = await query(
    `SELECT documento FROM sigha."user" ORDER BY creation_date DESC LIMIT 10`
  );
  if (!res.rows.length) return ctx.reply("📭 Sin resultados.");
  return ctx.reply(res.rows.map((r, i) => `${i + 1}. ${r.documento}`).join("\n"));
});

// ------------------ Menú comandos ------------------ //
bot.telegram.setMyCommands([
  { command: "start", description: "Iniciar y ver tu rol" },
  { command: "aprobar", description: "Aprobar usuario (Creador)" },
  { command: "bloquear", description: "Bloquear usuario (Creador)" },
  { command: "eliminar", description: "Eliminar usuario (Creador)" },
  { command: "promover", description: "Promover a admin (Creador)" },
  { command: "revocar", description: "Revocar admin (Creador)" },
  { command: "listar", description: "Listar usuarios (Creador)" },
  { command: "usuario", description: "Consultar usuario por documento" },
  { command: "areas", description: "Listar áreas y sus asignaturas" },
  { command: "db", description: "Probar conexión DB" },
  { command: "test", description: "Últimos 10 documentos (Creador)" },
]);

// ------------------ Inicio ------------------ //
bot.catch((err) => console.error("Bot error:", err));
bot.launch().then(() =>
  console.log("✅ Bot SIGHA corriendo con comandos de gestión y áreas/asignaturas...")
);
