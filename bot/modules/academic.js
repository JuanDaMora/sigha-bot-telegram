import { query } from "../db.js";

export function registerAcademicCommands(bot) {
  function deny(ctx) {
    return ctx.reply("❌ No tienes permisos para usar este comando.");
  }

  // /areas
  bot.command("areas", async (ctx) => { /* ... */ });

  // /semestres
  bot.command("semestres", async (ctx) => { /* ... */ });

  // /grupos_sin_docente + callback
  bot.command("grupos_sin_docente", async (ctx) => { /* ... */ });

  bot.on("callback_query", async (ctx) => { /* ... */ });
}
