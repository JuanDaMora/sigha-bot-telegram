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
    return ctx.reply(`👑 Bienvenido Creador.\nTu chat.id es: ${id}\nRol: Creador`);
  }

  if (!data.users[id]) {
    data.users[id] = { role: "pending" };
    saveUsers(data);

    ctx.reply(`👋 Hola! Tu chat.id es: ${id}\nRol actual: PENDIENTE.\nEspera aprobación del Creador.`);

    bot.telegram.sendMessage(
      data.creator,
      `🚨 Nuevo usuario detectado\nID: ${id}\nEstado: pendiente`
    );
  } else {
    const role = data.users[id].role;
    ctx.reply(`✅ Ya estás registrado.\nTu chat.id es: ${id}\nRol actual: ${getRoleName(role)}`);
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

    const grouped = {};
    res.rows.forEach((row) => {
      if (!grouped[row.area]) grouped[row.area] = [];
      if (row.asignatura) {
        grouped[row.area].push(`${row.codigo}: ${row.asignatura}`);
      }
    });

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

// ------------------ Consultar semestres y resumen de grupos ------------------ //
bot.command("semestres", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);

  try {
    const sql = `
      SELECT s.id,
             s.description,
             COUNT(g.id) AS total_grupos,
             COUNT(*) FILTER (WHERE g.id_user IS NOT NULL) AS con_docente,
             COUNT(*) FILTER (WHERE g.id_user IS NULL) AS sin_docente
      FROM sigha.semester s
      LEFT JOIN sigha."group" g ON g.id_semester = s.id
      GROUP BY s.id, s.description
      ORDER BY s.start_date DESC;
    `;
    const res = await query(sql);

    if (!res.rows.length) {
      return ctx.reply("📭 No hay semestres registrados.");
    }

    let mensaje = "📅 Semestres:\n\n";
    res.rows.forEach((s, i) => {
      mensaje += `${i + 1}. ${s.description} → Total grupos: ${s.total_grupos} (✅ ${s.con_docente} con docente, ❌ ${s.sin_docente} sin docente)\n`;
    });

    return ctx.reply(mensaje);
  } catch (e) {
    console.error("/semestres error", e);
    return ctx.reply(`❌ Error al consultar semestres: ${e.message}`);
  }
});

// ------------------ Grupos sin docente (interactivo con botones) ------------------ //
bot.command("grupos_sin_docente", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);

  try {
    const sql = `
      SELECT id, description
      FROM sigha.semester
      ORDER BY start_date DESC;
    `;
    const res = await query(sql);

    if (!res.rows.length) {
      return ctx.reply("📭 No hay semestres registrados.");
    }

    const buttons = res.rows.map((s) => [
      { text: s.description, callback_data: `grupos_sin_docente:${s.id}:${s.description}` },
    ]);

    return ctx.reply("📅 Elige un semestre:", {
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (e) {
    console.error("/grupos_sin_docente error", e);
    return ctx.reply(`❌ Error al consultar semestres: ${e.message}`);
  }
});

// ------------------ Callback para mostrar grupos sin docente ------------------ //
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("grupos_sin_docente:")) {
    const [, idSemestre, description] = data.split(":");

    try {
      const sql = `
        SELECT g.code,
               s.name AS asignatura
        FROM sigha."group" g
        JOIN sigha.subject s ON s.id = g.id_subject
        WHERE g.id_semester = $1
          AND g.id_user IS NULL
        ORDER BY g.code;
      `;
      const res = await query(sql, [idSemestre]);

      if (!res.rows.length) {
        await ctx.reply(`📭 No hay grupos sin docente en el semestre ${description}.`);
      } else {
        let mensaje = `📋 Grupos sin docente en semestre ${description}:\n\n`;
        res.rows.forEach((g) => {
          mensaje += `- ${g.code}: ${g.asignatura}\n`;
        });
        await ctx.reply(mensaje);
      }
    } catch (e) {
      console.error("callback grupos_sin_docente error", e);
      await ctx.reply(`❌ Error al consultar grupos: ${e.message}`);
    }
  }

  ctx.answerCbQuery();
});

// ------------------ DB ------------------ //
bot.command("db", async (ctx) => {
  if (!isAdmin(ctx)) return deny(ctx);
  const ok = await healthcheck();
  if (!ok) return ctx.reply("❌ DB no respondió.");
  return ctx.reply("✅ DB OK");
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
  { command: "areas", description: "Listar áreas y asignaturas" },
  { command: "semestres", description: "Listar semestres con resumen de grupos" },
  { command: "grupos_sin_docente", description: "Grupos sin docente (elige semestre)" },
  { command: "db", description: "Probar conexión DB" }
]);

// ------------------ Inicio ------------------ //
bot.catch((err) => console.error("Bot error:", err));
bot.launch().then(() =>
  console.log("✅ Bot SIGHA corriendo con gestión, áreas, semestres y grupos sin docente...")
);
