import { saveUsers, getRoleName } from "../userStore.js";
import { query } from "../db.js";

export function registerUserCommands(bot, data) {
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
  bot.command("aprobar", (ctx) => { /* ... */ });
  bot.command("bloquear", (ctx) => { /* ... */ });
  bot.command("eliminar", (ctx) => { /* ... */ });
  bot.command("promover", (ctx) => { /* ... */ });
  bot.command("revocar", (ctx) => { /* ... */ });
  bot.command("listar", (ctx) => { /* ... */ });

  // ------------------ Consultar usuario por documento ------------------ //
  bot.command("usuario", async (ctx) => { /* ... */ });
}

// 👉 export de comandos para el menú
export const userCommands = [
  { command: "start", description: "Iniciar y ver tu rol" },
  { command: "aprobar", description: "Aprobar usuario (Creador)" },
  { command: "bloquear", description: "Bloquear usuario (Creador)" },
  { command: "eliminar", description: "Eliminar usuario (Creador)" },
  { command: "promover", description: "Promover a admin (Creador)" },
  { command: "revocar", description: "Revocar admin (Creador)" },
  { command: "listar", description: "Listar usuarios (Creador)" },
  { command: "usuario", description: "Consultar usuario por documento" }
];
