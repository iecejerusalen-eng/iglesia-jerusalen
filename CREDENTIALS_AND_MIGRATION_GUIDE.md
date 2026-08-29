# 🔐 Guía de Credenciales y Migración de Proyecto - Iglesia Jerusalén

Este documento contiene **todas las credenciales, variables de entorno y configuraciones** necesarias para migrar y continuar el desarrollo de este proyecto en otra computadora sin perder ninguna funcionalidad.

---

## 1. 📋 Resumen del Repositorio y Proyecto

* **Repositorio Git**: `https://github.com/iecejerusalen-eng/iglesia-jerusalen.git`
* **Token de Acceso GitHub (PAT)**: `[REDACTED_SECRET_ROTATE_IMMEDIATELY]`
* **URL remota completa (HTTPS con Token)**: `https://[TOKEN_REDACTED]@github.com/iecejerusalen-eng/iglesia-jerusalen.git`
* **Proyecto en Vercel**: `iglesia-jerusalen`
  * **Project ID**: `prj_lfZTGdyhTr2iAJtPvSyUkAyuiCTX`
  * **Org / Team ID**: `team_jsQqpQ1NqjiM4pfy5nq6EKhA`

---

## 2. ⚡ Archivo `.env.local` (Variables de Entorno)

En la nueva computadora, crea un archivo llamado `.env.local` en la raíz del proyecto (`g:\CODE\Iglesia Jerusalén\.env.local` o tu nueva ruta) y configura el contenido utilizando las variables de entorno de tu entorno seguro:

```env
# Supabase (Backend & Base de Datos)
VITE_SUPABASE_URL=https://gqtatqekfrswvplemknc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_qByEe2fjQaWn3v-gPoY8EQ_gPbYxjtJ
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SECRET_ROTATE_IMMEDIATELY]

# Cloudinary (Gestión de Multimedia / Imágenes)
VITE_CLOUDINARY_CLOUD_NAME=degrlmvsq
VITE_CLOUDINARY_UPLOAD_PRESET=iglesia_jerusalen_web
CLOUDINARY_API_KEY=461627949548491
CLOUDINARY_API_SECRET=[REDACTED_SECRET_ROTATE_IMMEDIATELY]

# Vercel AI Gateway
AI_GATEWAY_API_KEY=[REDACTED_SECRET_ROTATE_IMMEDIATELY]

# GitHub Token (para automatización y scripts)
GITHUB_TOKEN=[REDACTED_SECRET_ROTATE_IMMEDIATELY]

# Web Push Notifications (VAPID)
VITE_VAPID_PUBLIC_KEY=BMT7ZY5zAo0b8u5OL7VyFg8rNwB7pKKyEzy9I8W4j2oX2gkbXPYTOiyzPdS9jxgapHXXI0A5RDC5Zqa3bfXliwA
VAPID_PRIVATE_KEY=[REDACTED_SECRET_ROTATE_IMMEDIATELY]
VAPID_SUBJECT=mailto:admin@iglesiajerusalen.com
```

---

## 3. 🚀 Configuración de Vercel (`.vercel/project.json`)

Si pasas la carpeta completa incluyendo la subcarpeta `.vercel/`, Vercel ya estará vinculado. De lo contrario, crea la carpeta `.vercel` en la raíz y dentro el archivo `project.json` con:

```json
{
  "projectId": "prj_lfZTGdyhTr2iAJtPvSyUkAyuiCTX",
  "orgId": "team_jsQqpQ1NqjiM4pfy5nq6EKhA",
  "projectName": "iglesia-jerusalen"
}
```

---

## 4. 🛠️ Pasos para Iniciar en la Nueva Computadora

1. **Copiar los archivos o clonar el repositorio**:
   * Si clonas mediante git:
     ```bash
     git clone https://github.com/iecejerusalen-eng/iglesia-jerusalen.git
     ```
   * Si copias la carpeta manualmente por pendrive/disco, simplemente abre la carpeta en VS Code.

2. **Crear el archivo `.env.local`**:
   * Asegúrate de crear el archivo `.env.local` en la raíz con el contenido exacto de la Sección 2.

3. **Instalar Dependencias**:
   ```bash
   npm install
   ```

4. **Verificar que Git Remote esté correcto**:
   ```bash
   git remote set-url origin https://github.com/iecejerusalen-eng/iglesia-jerusalen.git
   ```

5. **Ejecutar el Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```

6. **Probar Build (Opcional)**:
   ```bash
   npm run build
   ```

---

> ⚠️ **Nota de Seguridad**: Guarde este documento en un lugar seguro (por ejemplo, tu drive personal o gestor de contraseñas) y **no lo subas a repositorios públicos**.
