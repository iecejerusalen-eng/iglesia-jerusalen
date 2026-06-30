<div align="center">
  <img src="public/favicon.ico" alt="Logo Iglesia Jerusalén" width="100" height="100" />
  <h1>Iglesia Jerusalén Web Platform 🕊️</h1>
  <p>
    <em>Plataforma integral de gestión comunitaria, aprendizaje y e-commerce.</em>
  </p>
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge)
</div>

---

## 🌟 Resumen del Proyecto

La plataforma web de la **Iglesia Jerusalén** es una solución robusta y escalable diseñada para administrar de forma centralizada y unificada todos los ministerios y actividades de la congregación. Combina una arquitectura moderna con un diseño premium utilizando la tendencia del *glassmorphism* y micro-animaciones dinámicas para una experiencia de usuario increíble.

## 🚀 Características Principales

### 👥 1. CRM y Gestión de Membresía
- Sistema avanzado de perfiles con roles personalizados y jerarquía.
- Definición de permisos granulares por módulo.
- Gestión de acceso a ministerios y suspensión de usuarios (`banned`).
- Sincronización en tiempo real.

### 🎓 2. LMS (Aula Virtual)
- Creación y seguimiento de cursos y currículas de discipulado.
- **Progreso en tiempo real**: Algoritmos que calculan el avance basado en módulos y lecciones completadas.
- Sistema de **gamificación** con insignias de logros.
- Dashboard interactivo para el estudiante.

### 🛒 3. E-commerce (Tienda Jerusalén)
- Venta de productos físicos (libros, ropa) y digitales (descargables).
- Sistema de carrito persistente soportado por **Zustand** (Offline First).
- Soporte para **variantes** de productos (tallas, colores) con ajustes de precios dinámicos.

### 🎮 4. Centro de Juegos Educativos
- Módulo **Biblionario** interactivo con soporte de niveles de dificultad (1 al 15).
- Editor de preguntas con soporte embebido de emojis e imágenes (vía Cloudinary).
- Leaderboard global para fomentar la competencia sana.

## 🛠️ Tecnologías Utilizadas

- **Frontend Core**: React.js (v18+), Vite, TypeScript.
- **Estado Global**: Zustand (con soporte de persistencia local).
- **Estilos y UI**: Tailwind CSS, Framer Motion (animaciones), Lucide Icons.
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime).
- **Almacenamiento de Multimedia**: Cloudinary y Supabase Storage.
- **Despliegue**: Vercel.

## 📁 Arquitectura y Estructura

```text
src/
├── components/    # Componentes reutilizables, UI premium, animaciones
├── config/        # Configuración de variables de entorno, módulos admin
├── features/      # Lógica acoplada por dominio (ej. Auth)
├── pages/
│   ├── public/    # Vistas abiertas (Landing, Tienda, Presentación)
│   ├── admin/     # Panel de Administración, CRM, Gestión de Juegos
│   └── lms/       # Aula Virtual y Dashboards de estudiantes
├── store/         # Manejo de Estado (Zustand) - useAuthStore, useCartStore
├── types/         # Definiciones globales de interfaces TypeScript
└── lib/           # Utilidades y servicios externos (Cloudinary, etc.)
```

## ⚙️ Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/iglesia-jerusalen.git
   cd iglesia-jerusalen
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Copia el archivo `.env.example` a `.env` y configura tus credenciales de Supabase y Cloudinary.
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_key
   VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
   ```

4. **Levantar servidor en desarrollo:**
   ```bash
   npm run dev
   ```

## 🛡️ Reglas de Contribución y Código

- **Tipado estricto**: No usar `any` salvo excepciones de fuerza mayor. 
- **Componentes ligeros**: Evitar los *re-renders* innecesarios, aprovechar el selector en Zustand.
- **Estética premium**: Seguir el estándar de la paleta de colores, sombras suaves y transiciones de Framer Motion indicados en el documento de arquitectura del proyecto (`AGENTS.md`).

---
<div align="center">
  Hecho con ❤️ para la comunidad
</div>
