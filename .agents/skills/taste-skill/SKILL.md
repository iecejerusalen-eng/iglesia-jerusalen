---
name: taste-skill
description: Methodology for high-aesthetic web design based on GPT-Taste and the Ultimate Web Designer toolkit. Enforces a mandatory design_plan block before coding, mathematical hero layout sizing, strict typographic pairings, GSAP/Framer Motion animation paradigms, 3D WebGL integration, and anti-cliché design rules.
---

# Taste-Skill & Ultimate Web Designer Workflow

Esta habilidad establece el estándar de diseño visual de alto nivel (High-Aesthetic UI/UX) para el proyecto, combinando las metodologías de **GPT-Taste**, **UI/UX Pro Max**, **21st.dev Magic** y **WebGL/3D**.

---

## 1. El Flujo de 4 Pasos Obligatorio

Antes de escribir cualquier componente o página web:

1. **Definir y Planificar (`design_plan`)**: Analizar la intención, industria, tipografía, paleta HSL y layout matemático.
2. **Referencia Visual / Mockup**: Utilizar referencias de alta estética (NanoBanana/Stitch/Gemini o wireframes mentales claros).
3. **Componentes y Composición**: Utilizar componentes premium (21st.dev, Magic UI, Tailwind CSS, Radix).
4. **Validación de Criterios de Calidad**: Pasar la lista de verificación (contraste WCAG AA, densidad de rejilla, responsive sin overflow, cero clichés).

---

## 2. Bloque Obligatorio `design_plan`

Al diseñar una nueva página, vista o sección hero, emite un bloque estructurado antes del código:

```markdown
### 🎨 Design Plan

- **Estilo Visual**: [Ej. Glassmorphism Orgánico / Minimalismo Editorial / Dark Luxury]
- **Matemática del Layout**:
  - Hero container: [Ancho máx., ej. `max-w-7xl`, proporciones `1fr 1fr` o `1.2fr 0.8fr`]
  - Altura y espaciado: [Flujo natural flex/grid con `py-16 sm:py-24`, sin clamps verticales rígidos que corten contenido]
- **Paleta de Color (HSL / Tokens)**:
  - Primario: `#1E3A8A` (Azul Institucional)
  - Acento: `#C79D3F` / `#FFD679` (Dorado Jerusalén)
  - Superficie: `#FAFAFA` (Claro) / `#030817` (Oscuro)
- **Pila Tipográfica**:
  - Títulos: Playfair Display (Serif con personalidad y tracking óptimo)
  - Textos / UI: Inter (Sans-serif limpia y legible)
- **Paradigmas de Animación (Framer Motion / CSS)**:
  - Entrada: Reveal stagger (`y: 16 -> 0`, `opacity: 0 -> 1`, cubic-bezier `[0.16, 1, 0.3, 1]`)
  - Interacción: 3D Tilt suave (`<= 4deg`) con `pointer-events` controlados y fallback para `prefers-reduced-motion`.
- **Integración 3D / WebGL**: [Canvas Cobe 3D, Three.js, partículas sutiles o Glass Cards elevadas]
- **Checklist Prevención de Errores**:
  - [x] Sin anidamiento excesivo de cajas (Anti Card-ception)
  - [x] Contraste mínimo WCAG AA (4.5:1 texto normal)
  - [x] Textos dinámicos protegidos contra colisión o truncado
```

---

## 3. Reglas de Oro de Estética y Composición (Anti-Cliché)

1. **Evitar el *Card-Ception***: Nunca anides una tarjeta dentro de otra tarjeta dentro de un marco girado. Una sola tarjeta protagonista bien estructurada genera un impacto 10x superior.
2. **Matemática de Layout y Flujo Natural**:
   - Nunca uses alturas fijas (`h-[30rem]`) con `overflow: hidden` si el contenido interior contiene textos de longitud variable o títulos grandes.
   - Usa `min-h` o deja que el contenedor respire con `gap` y `padding` calculados.
3. **Tipografía con Intención**:
   - Máximo 2 familias tipográficas (una con carácter para `h1`/`h2`, una ultra-legible para cuerpo y UI).
   - Siempre ajusta `line-height` y `letter-spacing` (`tracking-tight` para títulos grandes, `tracking-wide` para micro-labels uppercase).
4. **Espaciado y Densidad**:
   - Dale aire al contenido. El espacio en blanco (whitespace) es un elemento activo de diseño.
5. **Micro-interacciones y Animaciones**:
   - Las animaciones deben durar entre 200ms y 500ms para acciones del usuario (hover, focus, click).
   - Las animaciones ambientales (glows, ambient drift) deben ser suaves (12s - 25s) y sutiles (opacidad <= 25%).
