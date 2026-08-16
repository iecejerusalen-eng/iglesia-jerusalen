# Puente local de Holyrics

Este proceso mantiene el token de Holyrics fuera del navegador y realiza las llamadas a la API local en la misma computadora o red.

Variables:

- `HOLYRICS_LOCAL_API_URL`: URL base del API Server local, por ejemplo `http://192.168.1.50:50001/api`.
- `HOLYRICS_LOCAL_TOKEN`: token creado en Holyrics > Archivo > Configuración > API Server.
- `HOLYRICS_BRIDGE_PORT`: puerto local del puente, por defecto `4892`.
- `HOLYRICS_BRIDGE_ALLOWED_ORIGINS`: orígenes permitidos separados por coma; por defecto permite los puertos locales de Vite.

Ejemplo en PowerShell:

```powershell
$env:HOLYRICS_LOCAL_API_URL = 'http://192.168.1.50:50001/api'
$env:HOLYRICS_LOCAL_TOKEN = 'TOKEN_DE_HOLYRICS'
npm start
```

Prueba de salud: `GET http://127.0.0.1:4892/health`.

Prueba de API: `POST http://127.0.0.1:4892/holyrics` con `{ "action": "GetVersion", "payload": {} }`.
