# Biblioteca de Errores y Lecciones Aprendidas (Iglesia Jerusalén)

Este documento sirve como bitácora para documentar errores técnicos comunes que hemos enfrentado en el desarrollo del proyecto de Iglesia Jerusalén, con el fin de evitar que se repitan en futuras iteraciones.

## 1. Errores de Base de Datos y Supabase

### 1.1 `ERROR: 42P01: relation "public.users" does not exist`
- **Contexto:** Al crear políticas de seguridad (RLS) en Supabase, es común asumir que la tabla de usuarios se llama `public.users` o interactuar directamente con `auth.users`.
- **Causa:** En este proyecto, la tabla que maneja los datos públicos y los roles de los usuarios se llama **`public.profiles`**.
- **Solución:** Siempre que se necesite consultar el rol o datos del usuario en RLS u otras tablas, se debe hacer el `JOIN` o la subconsulta utilizando `public.profiles`.
  ```sql
  -- CORRECTO
  SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  
  -- INCORRECTO
  SELECT 1 FROM public.users WHERE users.id = auth.uid()
  ```

### 1.2 `ERROR: 22P02: invalid input value for enum user_role: "superadmin"`
- **Contexto:** Al intentar asignar o verificar un rol con un valor incorrecto en la base de datos o en RLS.
- **Causa:** La base de datos tiene un ENUM llamado `user_role` que no incluye el valor `superadmin`.
- **Solución:** Utilizar exclusivamente los roles válidos según lo definido en la aplicación (`src/types/index.ts`):
  `'admin' | 'pastor' | 'editor' | 'secretary' | 'secretaria' | 'leader' | 'member' | 'guest' | 'apoyo' | 'multimedia' | 'maestro' | 'docente' | 'estudiante' | 'student' | 'musico'`
- *Nota: En este proyecto el rol de mayor jerarquía es simplemente `admin`.*

### 1.3 `ERROR: 42883: function public.handle_updated_at() does not exist`
- **Contexto:** Al crear un trigger `BEFORE UPDATE` para actualizar la columna `updated_at`, es común utilizar una función como `handle_updated_at()`.
- **Causa:** La base de datos no tiene definida por defecto dicha función (quizás depende de otra extensión o no ha sido creada globalmente en el proyecto).
- **Solución:** Siempre declarar y asegurar que la función del trigger existe antes de crear el trigger. O utilizar la función global que ya existe en el proyecto si aplica (ej. `increment_version_and_updated_at()`), o simplemente crear la función en el archivo de migración actual si es necesario:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
  END;
  $$ language 'plpgsql';
  ```

## 2. Errores de Tipado / Frontend

*(Espacio para agregar futuros errores relacionados con React, Vite, TS)*
