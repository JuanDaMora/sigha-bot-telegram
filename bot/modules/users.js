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
  bot.command("aprobar", (ctx) => { /* ... igual que antes */ });
  bot.command("bloquear", (ctx) => { /* ... */ });
  bot.command("eliminar", (ctx) => { /* ... */ });
  bot.command("promover", (ctx) => { /* ... */ });
  bot.command("revocar", (ctx) => { /* ... */ });
  bot.command("listar", (ctx) => { /* ... */ });

  // ------------------ Consultar usuario por documento ------------------ //
  bot.command("usuario", async (ctx) => { /* ... */ });
}
