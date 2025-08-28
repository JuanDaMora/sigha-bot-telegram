import { Telegraf } from "telegraf";
import { loadUsers } from "./userStore.js";
import { registerUserCommands, userCommands } from "./modules/users.js";
import { registerAcademicCommands, academicCommands } from "./modules/academic.js";
import { registerSystemCommands, systemCommands } from "./modules/system.js";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
let data = loadUsers();

// Registrar comandos de cada módulo
registerUserCommands(bot, data);
registerAcademicCommands(bot);
registerSystemCommands(bot);

// Unir los comandos para el menú de Telegram
bot.telegram.setMyCommands([
  ...userCommands,
  ...academicCommands,
  ...systemCommands
]);

// ------------------ Inicio ------------------ //
bot.catch((err) => console.error("Bot error:", err));
bot.launch().then(() =>
  console.log("✅ Bot SIGHA corriendo con módulos y comandos separados...")
);
