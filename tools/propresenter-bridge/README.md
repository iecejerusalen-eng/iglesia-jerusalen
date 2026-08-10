# Conector local de ProPresenter

Este conector mantiene una conexión saliente con la función `propresenter-device`, consulta la cola de órdenes y ejecuta las acciones compatibles en ProPresenter 7 mediante su API local.

## Requisitos

- Node.js 20 o superior.
- ProPresenter abierto con la API habilitada en `Settings → Network`.
- La migración `20260810210000_propresenter_control_center.sql` aplicada.
- La función `propresenter-device` desplegada.

## Primer emparejamiento

Desde el panel `/admin/propresenter`, registra la computadora y copia el código generado. Después ejecuta:

```powershell
$env:SUPABASE_FUNCTION_URL="https://TU_PROYECTO.supabase.co/functions/v1/propresenter-device"
$env:PROPRESENTER_CONNECTION_ID="ID_DE_LA_CONEXION"
$env:PROPRESENTER_PAIRING_CODE="JER-XXXXX"
$env:PROPRESENTER_URL="http://127.0.0.1:50001"
npm install
npm start
```

El token se guarda localmente en `.iglesia-jerusalen/propresenter-device.json` con permisos restringidos y el código de emparejamiento deja de ser válido después del primer uso.

## Overlay

Las órdenes de letras requieren un motor de overlay local. Configura `OVERLAY_URL` cuando esté disponible; el bridge enviará allí `lyrics`, `lyrics-chords`, `clear` y `sync-service`. Las órdenes de prueba, siguiente y anterior usan directamente la API oficial de ProPresenter.
