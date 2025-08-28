import { healthcheck } from "../db.js";

export function registerSystemCommands(bot) {
  function deny(ctx) {
    return ctx.reply("❌ No tienes permisos para usar este comando.");
  }

  bot.command("db", async (ctx) => {
    const ok = await healthcheck();
    if (!ok) return ctx.reply("❌ DB no respondió.");
    return ctx.reply("✅ DB OK");
  });
}
