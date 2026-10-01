import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { FooterBreadcrumb } from './FooterBreadcrumb';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import {
  Mail, Phone, MapPin, Heart, ShieldCheck, Scale,
  Users, GraduationCap, Gamepad2, ShoppingBag, Globe, Video,
  Sparkles, Music, Radio, HeartHandshake
} from 'lucide-react';

// ─── Particle system types ──────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  alphaTarget: number;
}

// ─── Canvas Constellation Component ─────────────────────────────────────────
function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const shouldReduceMotion = useReducedMotion();

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 10000);
    const goldColor = '199,157,63';
    const blueColor = '99,129,246';
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.6 + 0.6,
      color: Math.random() > 0.6 ? goldColor : blueColor,
      alpha: Math.random() * 0.5 + 0.2,
      alphaTarget: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener('mouseleave', onMouseLeave);

    const maxDist = 100;
    const mouseDist = 140;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Softly randomize alpha for twinkle
      for (const p of particles) {
        if (Math.random() < 0.005) {
          p.alphaTarget = Math.random() * 0.55 + 0.15;
        }
        p.alpha += (p.alphaTarget - p.alpha) * 0.04;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${a.color},${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles + mouse repulsion
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Mouse attraction/repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseDist) {
          const force = (1 - dist / mouseDist) * 0.6;
          p.vx += (dx / dist) * force * 0.07;
          p.vy += (dy / dist) * force * 0.07;
        }

        // Velocity damping
        p.vx *= 0.97;
        p.vy *= 0.97;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        // Glow halo for gold particles
        if (p.color === '199,157,63' && p.radius > 1.4) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
          grad.addColorStop(0, `rgba(199,157,63,${p.alpha * 0.4})`);
          grad.addColorStop(1, 'rgba(199,157,63,0)');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [shouldReduceMotion, initParticles]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.85 }}
    />
  );
}

// ─── Animated SVG "JERUSALÉN" wordmark ──────────────────────────────────────
function AnimatedWordmark() {
  const ref = useRef<SVGTextElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || shouldReduceMotion) return;
    const length = el.getComputedTextLength();
    el.style.strokeDasharray = String(length);
    el.style.strokeDashoffset = isInView ? '0' : String(length);
    el.style.transition = isInView
      ? 'stroke-dashoffset 2.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s, fill-opacity 0.9s ease 1.8s'
      : 'none';
    if (isInView) {
      el.style.fillOpacity = '1';
    } else {
      el.style.fillOpacity = '0';
    }
  }, [isInView, shouldReduceMotion]);

  return (
    <div ref={containerRef} className="overflow-hidden py-2">
      <svg
        viewBox="0 0 900 120"
        className="w-full max-w-3xl mx-auto select-none"
        aria-label="Jerusalén"
        role="img"
      >
        <defs>
          <linearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C79D3F" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFD679" stopOpacity="1" />
            <stop offset="100%" stopColor="#C79D3F" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <text
          ref={ref}
          x="50%"
          textAnchor="middle"
          y="96"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="108"
          fontWeight="900"
          letterSpacing="-2"
          stroke="url(#wordmarkGrad)"
          strokeWidth="1"
          fill="url(#wordmarkGrad)"
          style={{
            fillOpacity: shouldReduceMotion ? 1 : 0,
            strokeDasharray: shouldReduceMotion ? 'none' : 0,
            strokeDashoffset: shouldReduceMotion ? 'none' : 0,
          }}
        >
          JERUSALÉN
        </text>
      </svg>
    </div>
  );
}

// ─── Main Footer component ───────────────────────────────────────────────────
const Footer = () => {
  const currentYear = new Date().getFullYear();
  const shouldReduceMotion = useReducedMotion();

  const stagger = {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
    },
    item: {
      hidden: shouldReduceMotion ? {} : { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
      },
    },
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/jerusalen.cuadrangular',
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      ),
      color: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/jerusalen_iece/',
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      color: 'hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]',
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UCgzlmsop3KSLpyzz92WQ2Mw',
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    },
  ];

  const exploreCategories = [
    {
      title: 'La Iglesia',
      links: [
        { name: 'Planifica tu Visita', path: '/visita', icon: Sparkles },
        { name: 'Quiénes Somos', path: '/nosotros', icon: Users },
        { name: 'Ministerios', path: '/ministerios', icon: Heart },
        { name: 'Misiones', path: '/misiones', icon: Globe },
        { name: 'Generosidad & Ofrendas', path: '/donaciones', icon: HeartHandshake },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Sermones', path: '/predicas', icon: Video },
        { name: 'Podcast', path: '/podcast', icon: Radio },
        { name: 'Himnario & Alabanzas', path: '/recursos/alabanzas', icon: Music },
        { name: 'Aula Virtual', path: '/aula-virtual', icon: GraduationCap },
        { name: 'Juegos', path: '/recursos/juegos', icon: Gamepad2 },
        { name: 'Tienda', path: '/tienda', icon: ShoppingBag },
      ],
    },
  ];

  const legalLinks = [
    { name: 'Términos y Condiciones', path: '/terminos', icon: Scale },
    { name: 'Políticas de Privacidad', path: '/privacidad', icon: ShieldCheck },
  ];

  return (
    <footer className="relative bg-[#060c1a] border-t border-white/5 text-slate-300 mt-auto overflow-hidden">

      {/* ── Canvas constellation (ambient, interactive) ── */}
      <div className="absolute inset-0 pointer-events-none">
        <ConstellationCanvas />
      </div>

      {/* ── Radial ambient glows ── */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 0%, rgba(37,99,235,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 10%, rgba(199,157,63,0.09) 0%, transparent 55%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(199,157,63,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Breadcrumb ── */}
      <FooterBreadcrumb />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-24 md:pb-14">

        {/* ── Big animated wordmark "JERUSALÉN" ── */}
        <div className="mb-14 opacity-90">
          <AnimatedWordmark />
          <p className="text-center text-xs uppercase tracking-[0.28em] text-[#C79D3F]/60 mt-2 font-bold">
            Iglesia Evangélica Cuadrangular · Milagro, Ecuador
          </p>
        </div>

        {/* ── Thin gold divider ── */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C79D3F]/30 to-transparent mb-14" />

        {/* ── Main grid ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12 mb-14"
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Brand & Identity (4 cols) */}
          <motion.div variants={stagger.item} className="md:col-span-4 flex flex-col space-y-6">
            <Link to="/" className="inline-block group focus-visible:outline-none rounded-lg max-w-max">
              <div className="flex items-center gap-4">
                <img
                  loading="lazy"
                  src={soloLogoColorido}
                  alt="Logo Jerusalén"
                  className="h-12 w-auto drop-shadow-lg group-hover:drop-shadow-[0_0_12px_rgba(199,157,63,0.6)] transition-all duration-500"
                />
                <div>
                  <span className="font-serif text-2xl font-bold text-white tracking-tight group-hover:text-[#C79D3F] transition-colors duration-300 block leading-tight">
                    Jerusalén
                  </span>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C79D3F]/70 block mt-0.5">
                    Iglesia del Evangelio Cuadrangular
                  </p>
                </div>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm italic border-l-2 border-[#C79D3F]/30 pl-4">
              "Jesucristo es el mismo ayer, hoy y por los siglos."
              <span className="block not-italic font-semibold text-[10px] uppercase tracking-wider text-slate-500 mt-2">
                — Hebreos 13:8
              </span>
            </p>

            {/* Social links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  className={`w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 transition-all duration-300 shadow-sm ${social.color}`}
                  title={social.name}
                  aria-label={`Seguir a Iglesia Jerusalén en ${social.name}`}
                >
                  {social.iconRenderer()}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Explore (5 cols) */}
          <motion.div variants={stagger.item} className="md:col-span-5">
            <h4 className="font-serif font-bold text-white mb-6 text-lg">Explorar</h4>
            <div className="grid grid-cols-2 gap-6">
              {exploreCategories.map((category) => (
                <div key={category.title}>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#C79D3F]/70 mb-4">
                    {category.title}
                  </h5>
                  <ul className="space-y-4">
                    {category.links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <li key={link.path}>
                          <Link
                            to={link.path}
                            className="text-sm text-slate-400 hover:text-[#C79D3F] transition-colors duration-200 flex items-center gap-2.5 group"
                          >
                            <span className="p-1.5 rounded-lg bg-white/5 text-slate-500 group-hover:bg-[#C79D3F]/10 group-hover:text-[#C79D3F] transition-colors">
                              <Icon size={14} />
                            </span>
                            {link.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact & Legal (3 cols) */}
          <motion.div variants={stagger.item} className="md:col-span-3 flex flex-col space-y-8">
            <div>
              <h4 className="font-serif font-bold text-white mb-6 text-lg">Contacto</h4>
              <div className="space-y-4 text-sm text-slate-400">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#C79D3F] shrink-0 mt-0.5" />
                  <address className="not-italic leading-relaxed">
                    Baquerizo Moreno entre Av. Colón y Tulcán<br />
                    Milagro, Ecuador
                  </address>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-[#C79D3F] shrink-0" />
                  <a href="tel:+593985263122" className="hover:text-[#C79D3F] transition-colors">
                    +593 98 526 3122
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-[#C79D3F] shrink-0" />
                  <a href="mailto:notificaciones@iecejerusalen.com" className="hover:text-[#C79D3F] transition-colors break-all">
                    notificaciones@iecejerusalen.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/8">
              <ul className="space-y-3">
                {legalLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="text-xs text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-2"
                      >
                        <Icon size={14} className="opacity-60" />
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left text-xs text-slate-500">
          <p className="font-medium">
            &copy; {currentYear} Iglesia Jerusalén. Todos los derechos reservados.
          </p>
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex items-center gap-1.5 font-medium px-4 py-2 bg-white/5 rounded-full border border-white/10 shadow-sm cursor-default"
          >
            <span>Desarrollado con</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse mx-0.5" />
            <span>por</span>
            <span className="font-bold text-slate-300 ml-0.5">Esteban Nicola</span>
          </motion.div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
