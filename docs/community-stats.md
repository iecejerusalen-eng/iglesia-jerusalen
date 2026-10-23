# Cifras de comunidad — Cada vida cuenta

La sección del Inicio conserva los datos recibidos por useHomeData. Usa una composición editorial azul noche, papel cálido y dorado, con enlace a /visita. Los totales no se presentan como incrementos. Las etiquetas de niños y jóvenes describen pertenencia por edad, sin atribuir formación o compromiso.

Implementación: src/features/home/components/StatsSection.tsx, AnimatedCounter.tsx y communityStats.css. Se reutilizan React Router, Lucide y Framer Motion existentes; no se añaden dependencias. El contador se activa una vez al entrar en pantalla, actualiza el nodo de texto sin renderizar React por fotograma y cancela la animación al desmontar. Los lectores de pantalla reciben el valor final. El foco es visible y prefers-reduced-motion desactiva el movimiento. Se conservan carga y estado vacío.

QA de componente: e2e/community-stats.spec.ts y su fixture aislada, sin escrituras ni datos del CRM. Cubre 390/768/1440 px en claro/oscuro y 320 px con valores largos, teclado, enlace, foco, interacción de puntero, carga, vacío y movimiento reducido. La fixture no acredita el contenido de producción.
