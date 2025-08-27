# 🤖 Telegram Bot con Sistema de Roles

Un bot de Telegram con sistema de gestión de usuarios y roles implementado en Node.js usando Telegraf.

## 📋 Características

- **Sistema de Roles**: Creador, Administrador, Usuario Aprobado, Pendiente, Bloqueado
- **Gestión de Usuarios**: Aprobar, bloquear, eliminar, promover y revocar usuarios
- **Persistencia de Datos**: Almacenamiento local en JSON
- **Dockerizado**: Fácil despliegue con Docker Compose
- **Comandos Intuitivos**: Menú de comandos sugeridos en Telegram

## 🏗️ Arquitectura

```
telegram-bot/
├── bot/
│   ├── index.js          # Lógica principal del bot
│   ├── userStore.js      # Gestión de usuarios y persistencia
│   ├── users.json        # Base de datos de usuarios
│   ├── package.json      # Dependencias del proyecto
│   └── Dockerfile        # Configuración de Docker
├── docker-compose.yml    # Orquestación de servicios
└── README.md            # Este archivo
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 20 o superior)
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- Un bot de Telegram (creado con [@BotFather](https://t.me/botfather))

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Token de tu bot de Telegram
TELEGRAM_TOKEN=tu_token_aqui

# ID del creador (tu ID de Telegram)
CREATOR_ID=tu_id_aqui
```

### 2. Obtener el Token del Bot

1. Ve a [@BotFather](https://t.me/botfather) en Telegram
2. Envía `/newbot` y sigue las instrucciones
3. Copia el token que te proporciona

### 3. Obtener tu ID de Usuario

1. Envía `/start` a [@userinfobot](https://t.me/userinfobot)
2. Copia tu ID numérico

### 4. Desplegar con Docker

```bash
# Construir y ejecutar el bot
docker-compose up -d

# Ver logs
docker-compose logs -f telegram-bot

# Detener el bot
docker-compose down
```

### 5. Desplegar sin Docker (Desarrollo)

```bash
# Instalar dependencias
cd bot
npm install

# Ejecutar el bot
node index.js
```

## 📱 Comandos Disponibles

### Para Todos los Usuarios
- `/start` - Iniciar el bot y ver tu ID y rol actual

### Solo para el Creador
- `/aprobar <id>` - Aprobar un usuario pendiente
- `/bloquear <id>` - Bloquear un usuario
- `/eliminar <id>` - Eliminar un usuario del sistema
- `/promover <id>` - Promover un usuario a Administrador
- `/revocar <id>` - Revocar el rol de Administrador
- `/listar` - Listar todos los usuarios y sus roles

## 👥 Sistema de Roles

### 🏆 Creador
- Control total sobre el bot
- Puede gestionar todos los usuarios
- Acceso a todos los comandos administrativos

### ⭐ Administrador
- Rol intermedio (preparado para futuras funcionalidades)
- Actualmente sin comandos específicos

### ✅ Usuario Aprobado
- Usuario con acceso básico al bot
- Preparado para futuras funcionalidades

### ⏳ Pendiente
- Usuario que aún no ha sido aprobado
- No puede usar funcionalidades del bot
- El Creador recibe notificación de nuevos usuarios

### ❌ Bloqueado
- Usuario bloqueado por el Creador
- No puede usar ninguna funcionalidad

## 🔧 Configuración Avanzada

### Personalizar Roles

Puedes modificar los roles y sus nombres en `bot/userStore.js`:

```javascript
export function getRoleName(role) {
  switch (role) {
    case "creator":
      return "Creador";
    case "admin":
      return "Administrador";
    // ... más roles
  }
}
```

### Agregar Nuevos Comandos

Para agregar nuevos comandos, edita `bot/index.js` y sigue el patrón existente:

```javascript
bot.command("nuevo_comando", (ctx) => {
  // Tu lógica aquí
});
```

## 📊 Persistencia de Datos

Los datos de usuarios se almacenan en `bot/users.json` con la siguiente estructura:

```json
{
  "creator": 123456789,
  "users": {
    "987654321": {
      "role": "approved"
    }
  }
}
```

## 🐳 Docker

### Construir Imagen Manualmente

```bash
cd bot
docker build -t telegram-bot .
```

### Variables de Entorno en Docker

Puedes configurar las variables de entorno directamente en `docker-compose.yml`:

```yaml
services:
  telegram-bot:
    environment:
      - TELEGRAM_TOKEN=tu_token
      - CREATOR_ID=tu_id
```

## 🔍 Troubleshooting

### El bot no responde
1. Verifica que el token sea correcto
2. Revisa los logs: `docker-compose logs telegram-bot`
3. Asegúrate de que el bot esté activo en Telegram

### Error de permisos
1. Verifica que tu ID esté configurado correctamente
2. Asegúrate de que seas el Creador del bot

### Problemas con Docker
1. Reconstruye la imagen: `docker-compose build --no-cache`
2. Elimina contenedores: `docker-compose down -v`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de troubleshooting
2. Abre un issue en el repositorio
3. Contacta al desarrollador

---

**¡Disfruta usando tu bot de Telegram! 🎉**
