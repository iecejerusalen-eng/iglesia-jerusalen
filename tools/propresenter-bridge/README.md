# Conector local de ProPresenter

El conector vincula el Panel ProPresenter de Iglesia Jerusalén con ProPresenter 7 sin publicar el puerto local en Internet. Recibe órdenes autorizadas, conserva la versión exacta de cada alabanza y ofrece dos formas de mostrar letras:

- **Mensaje de ProPresenter (recomendado):** actualiza el token de un mensaje nativo mediante la API oficial.
- **Página web local:** sirve un overlay transparente en `http://127.0.0.1:43177/overlay` para añadirlo como Web Page.

Alpha/Key-Fill y NDI son salidas que se configuran dentro de ProPresenter. Cualquiera de las dos puede transportar el mensaje o la página web preparados por este conector.

## Requisitos

- Node.js 20 o superior.
- ProPresenter 7 abierto, con la API habilitada en `Settings → Network`.
- Migraciones de ProPresenter aplicadas en Supabase.
- Función `propresenter-device` desplegada.

## Primer emparejamiento

En `/admin/propresenter`, registra la computadora y copia los dos valores que muestra el panel. Después ejecuta desde esta carpeta:

```powershell
$env:SUPABASE_FUNCTION_URL="https://TU_PROYECTO.supabase.co/functions/v1/propresenter-device"
$env:PROPRESENTER_CONNECTION_ID="ID_DE_LA_CONEXION"
$env:PROPRESENTER_PAIRING_CODE="JER-XXXX-XXXX-XXXX-XXXX"
$env:PROPRESENTER_URL="http://127.0.0.1:50001"
npm install
npm start
```

El token definitivo se guarda en `.iglesia-jerusalen/propresenter-device.json`. El código inicial caduca a los 15 minutos y solo funciona una vez.

## Opción A · Mensaje nativo de ProPresenter

1. Crea un mensaje en ProPresenter con un token de texto llamado `text`.
2. Obtén el identificador del mensaje desde la API de ProPresenter.
3. Antes de iniciar el conector, define:

```powershell
$env:PROPRESENTER_MESSAGE_ID="ID_DEL_MENSAJE"
$env:PROPRESENTER_MESSAGE_TOKEN="text"
npm start
```

El panel sustituirá el token al avanzar y limpiará el mensaje cuando pulses **Limpiar salida**.

## Opción B · Página web transparente

Añade una Web Page en ProPresenter con esta URL:

```text
http://127.0.0.1:43177/overlay
```

Para una previsualización con fondo de diagnóstico usa `http://127.0.0.1:43177/overlay?debug=1`. El puerto puede cambiarse con `OVERLAY_PORT`.

## Variables opcionales

| Variable | Predeterminado | Uso |
| --- | --- | --- |
| `PROPRESENTER_URL` | `http://127.0.0.1:50001` | API local de ProPresenter |
| `OVERLAY_PORT` | `43177` | Página web local |
| `IDLE_POLL_MS` | `5000` | Frecuencia cuando no hay actividad |
| `ACTIVE_POLL_MS` | `800` | Frecuencia durante control en vivo |

El endpoint `http://127.0.0.1:43177/health` permite comprobar que el conector está activo.
