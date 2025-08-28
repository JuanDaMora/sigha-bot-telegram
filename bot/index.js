import { Telegraf } from "telegraf";
import { loadUsers } from "./userStore.js";
import { registerUserCommands } from "./modules/users.js";
import { registerAcademicCommands } from "./modules/academic.js";
import { registerSystemCommands } from "./modules/system.js";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
let data = loadUsers();

// Pasamos el bot y data a cada módulo
registerUserCommands(bot, data);
registerAcademicCommands(bot);
registerSystemCommands(bot);

// ------------------ Inicio ------------------ //
bot.catch((err) => console.error("Bot error:", err));
bot.launch().then(() =>
  console.log("✅ Bot SIGHA corriendo con módulos separados...")
);
