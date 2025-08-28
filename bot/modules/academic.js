import { query } from "../db.js";

export function registerAcademicCommands(bot) {
  function deny(ctx) {
    return ctx.reply("❌ No tienes permisos para usar este comando.");
  }

  // /areas
  bot.command("areas", async (ctx) => {
    // ... tu lógica actual ...
  });

  // /semestres
  bot.command("semestres", async (ctx) => {
    // ... tu lógica actual ...
  });

  // /grupos_sin_docente + callback
  bot.command("grupos_sin_docente", async (ctx) => {
    // ... tu lógica actual ...
  });

  bot.on("callback_query", async (ctx) => {
    // ... tu lógica actual ...
  });
}

// 👉 este export sí es válido
export const academicCommands = [
  { command: "areas", description: "Listar áreas y asignaturas" },
  { command: "semestres", description: "Ver semestres con resumen" },
  { command: "grupos_sin_docente", description: "Grupos sin docente (elige semestre)" }
];
