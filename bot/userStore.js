import fs from "fs";

const USERS_FILE = "./users.json";

export function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return { creator: parseInt(process.env.CREATOR_ID), users: {} };
  }
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

export function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export function getRoleName(role) {
  switch (role) {
    case "creator":
      return "Creador";
    case "admin":
      return "Administrador";
    case "approved":
      return "Usuario aprobado";
    case "pending":
      return "Pendiente de aprobación";
    case "blocked":
      return "Bloqueado";
    default:
      return "Desconocido";
  }
}

