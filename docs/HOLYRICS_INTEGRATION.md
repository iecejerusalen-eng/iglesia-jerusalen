# Integración Holyrics

## 1. API por Internet

La Edge Function `holyrics-api` usa las variables secretas:

- `HOLYRICS_API_KEY`
- `HOLYRICS_API_TOKEN`

Configúralas en Supabase Edge Functions > Secrets. También puedes hacerlo con el CLI:

```powershell
npx supabase secrets set HOLYRICS_API_KEY="TU_API_KEY" HOLYRICS_API_TOKEN="TU_TOKEN"
npx supabase functions deploy holyrics-api
```

La página **Administración > Tiempo de Culto** prueba la conexión mediante `GetVersion` usando `request`, que espera respuesta de Holyrics.

## 2. API local

En Holyrics activa el API Server desde **Archivo > Configuración > API Server** y crea un token con los permisos necesarios.

En la computadora que tendrá acceso al API local:

```powershell
$env:HOLYRICS_LOCAL_API_URL = 'http://IP_DEL_COMPUTADOR:PUERTO/api'
$env:HOLYRICS_LOCAL_TOKEN = 'TOKEN_DE_HOLYRICS'
$env:HOLYRICS_BRIDGE_ALLOWED_ORIGINS = 'https://tu-dominio.com,http://localhost:5173'
cd tools/holyrics-bridge
npm start
```

El puente escucha en `http://127.0.0.1:4892`. La interfaz incluye el botón **Probar local**. Si falla, revisa el firewall de Windows, la IP del computador Holyrics y que el API Server acepte conexiones de la red.

## 3. Seguridad

El frontend nunca recibe la API key ni el token. La integración por Internet se autentica con la sesión del usuario y exige permisos de administrador, pastor o líder. La integración local deja el token únicamente en el proceso del puente.

## 4. Alcance de la primera fase

La página ya permite planificar cultos, generar reglas para primer/tercer domingo, vincular eventos, asignar varias personas por función, visualizar mes/semana/día/tabla y preparar la conexión Holyrics. La sincronización completa de playlists, letras, anuncios y stage se conecta sobre `worship_service_items` y `worship_sync_links` en la siguiente iteración.

## 5. Estado público del culto

`live_service_production_state` es el contrato común entre Holyrics, ProPresenter y `/comunidad/culto-en-vivo`. Puede publicar la letra o texto actual, anuncio, diapositiva, enlaces de pantalla, vista de escenario y cámaras HTTPS.

ProPresenter ya actualiza este estado automáticamente desde el puente local cuando cambia la diapositiva, se avanza, se retrocede o se limpia la salida. Holyrics conserva sus acciones protegidas por API Server; su sincronización automática debe usar un token de puente separado y nunca exponerse en el navegador.

El panel de **Control de Culto en Vivo** permite revisar o corregir manualmente el estado mientras se termina de configurar el puente autenticado de Holyrics.
