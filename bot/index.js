import { Telegraf } from "telegraf";
import { loadUsers, saveUsers, getRoleName } from "./userStore.js";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
let data = loadUsers();

// ------------------ Comandos por rol ------------------ //
function getCommandsByRole(role) {
  switch (role) {
    case "creator":
      return [
        "/aprobar <id>",
        "/bloquear <id>",
        "/eliminar <id>",
        "/promover <id>",
        "/revocar <id>",
      ];
    case "admin":
      return ["(sin comandos disponibles todavía)"];
    case "approved":
      return ["(sin comandos disponibles todavía)"];
    case "blocked":
      return ["❌ Ninguno, estás bloqueado."];
    case "pending":
      return ["❌ Ninguno, espera aprobación."];
    default:
      return ["❌ No tienes permisos."];
  }
}

// ------------------ Middleware ------------------ //
function checkAccess(ctx, next) {
  const id = ctx.from.id.toString();
  const role =
    id === data.creator.toString()
      ? "creator"
      : data.users[id]?.role || "pending";

  if (role === "creator" || role === "admin" || role === "approved") {
    return next();
  }

  return ctx.reply("❌ No tienes permisos para usar este bot.");
}

// ------------------ /start ------------------ //
bot.start((ctx) => {
  const id = ctx.from.id.toString();

  if (id === data.creator.toString()) {
    const commands = getCommandsByRole("creator").join("\n");
    return ctx.reply(
      `👑 Bienvenido Creador.\nTu chat.id es: ${id}\n\nTu rol: ${getRoleName(
        "creator"
      )}\n\nComandos disponibles:\n${commands}`
    );
  }

  if (!data.users[id]) {
    data.users[id] = { role: "pending" };
    saveUsers(data);

    ctx.reply(
      `👋 Hola! Tu chat.id es: ${id}\n\nTu rol actual: ${getRoleName(
        "pending"
      )}\nTu solicitud está pendiente de aprobación.\nContacta al Creador para que te apruebe.\n\nComandos disponibles:\n${getCommandsByRole(
        "pending"
      ).join("\n")}`
    );

    bot.telegram.sendMessage(
      data.creator,
      `🚨 Nuevo usuario detectado\nID: ${id}\nEstado: pendiente`
    );
  } else {
    const role = data.users[id].role;
    const commands = getCommandsByRole(role).join("\n");
    ctx.reply(
      `✅ Ya estás registrado.\nTu chat.id es: ${id}\nTu rol actual: ${getRoleName(
        role
      )}\n\nComandos disponibles:\n${commands}`
    );
  }
});

// ------------------ Comandos de gestión (solo Creador) ------------------ //
bot.command("aprobar", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString())
    return ctx.reply("❌ Solo el Creador puede gestionar usuarios.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /aprobar <id>");

  data.users[id] = { role: "approved" };
  saveUsers(data);
  ctx.reply(`✅ Usuario ${id} aprobado.`);
  bot.telegram.sendMessage(id, "🎉 Has sido aprobado, ya puedes usar el bot.");
});

bot.command("bloquear", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString())
    return ctx.reply("❌ Solo el Creador puede gestionar usuarios.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /bloquear <id>");

  data.users[id] = { role: "blocked" };
  saveUsers(data);
  ctx.reply(`⛔ Usuario ${id} bloqueado.`);
  bot.telegram.sendMessage(id, "❌ Has sido bloqueado.");
});

bot.command("eliminar", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString())
    return ctx.reply("❌ Solo el Creador puede gestionar usuarios.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /eliminar <id>");

  delete data.users[id];
  saveUsers(data);
  ctx.reply(`🗑️ Usuario ${id} eliminado.`);
});

bot.command("promover", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString())
    return ctx.reply("❌ Solo el Creador puede gestionar usuarios.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /promover <id>");

  data.users[id] = { role: "admin" };
  saveUsers(data);
  ctx.reply(`⭐ Usuario ${id} promovido a Administrador.`);
  bot.telegram.sendMessage(id, "⭐ Has sido promovido a Administrador.");
});

bot.command("revocar", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString())
    return ctx.reply("❌ Solo el Creador puede gestionar usuarios.");

  const id = ctx.message.text.split(" ")[1];
  if (!id) return ctx.reply("Uso: /revocar <id>");

  data.users[id] = { role: "approved" };
  saveUsers(data);
  ctx.reply(`🔄 Usuario ${id} ya no es Administrador.`);
  bot.telegram.sendMessage(id, "🔄 Se revocó tu rol de Administrador.");
});

// ------------------ Menú de comandos sugeridos ------------------ //
bot.telegram.setMyCommands([
  { command: "start", description: "Iniciar y ver tu ID y rol" },
  { command: "aprobar", description: "Aprobar usuario (solo Creador)" },
  { command: "bloquear", description: "Bloquear usuario (solo Creador)" },
  { command: "eliminar", description: "Eliminar usuario (solo Creador)" },
  { command: "promover", description: "Promover a administrador (solo Creador)" },
  { command: "revocar", description: "Revocar rol de administrador (solo Creador)" },
  { command: "listar", description: "Listar usuarios y sus roles (solo Creador)" }
]);

// ------------------ Inicio ------------------ //
bot.catch((err) => console.error("Bot error:", err));
bot.launch().then(() =>
  console.log("✅ Bot de Telegram con roles corriendo con menú de comandos sugeridos...")
);
// ------------------ Listar usuarios (solo Creador) ------------------ //
bot.command("listar", (ctx) => {
  if (ctx.from.id.toString() !== data.creator.toString()) {
    return ctx.reply("❌ Solo el Creador puede listar usuarios.");
  }

  const usuarios = Object.entries(data.users);

  if (usuarios.length === 0) {
    return ctx.reply("📭 No hay usuarios registrados todavía.");
  }

  let mensaje = "📋 Lista de usuarios:\n\n";
  usuarios.forEach(([id, info]) => {
    mensaje += `👤 ID: ${id} → Rol: ${info.role}\n`;
  });

  ctx.reply(mensaje);
});

