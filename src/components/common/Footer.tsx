import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FooterBreadcrumb } from './FooterBreadcrumb';
import logoHorizontal from '../../assets/Jerusalén/nueva-identidad/logo-iglesia-jerusalen-horizontal.svg';
import { 
  Mail, Phone, MapPin, Heart, ShieldCheck, Scale,
  Users, GraduationCap, Gamepad2, ShoppingBag, Globe, Video,
  Sparkles, Music, Radio, HeartHandshake
} from 'lucide-react';
import { isPublicPathVisible } from '../../config/publicLaunchVisibility';
import { useSiteFeatureVisibilityStore } from '../../store/useSiteFeatureVisibilityStore';

const Footer = () => {
  const featureVisibility = useSiteFeatureVisibilityStore((state) => state.visibility);
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com/jerusalen.cuadrangular', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      ),
      color: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]'
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
      color: 'hover:bg-[#E4405F] hover:text-white hover:border-[#E4405F]'
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/channel/UCgzlmsop3KSLpyzz92WQ2Mw', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]'
    }
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
      ]
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
      ]
    }
  ];

  const legalLinks = [
    { name: 'Términos y Condiciones', path: '/terminos', icon: Scale },
    { name: 'Políticas de Privacidad', path: '/privacidad', icon: ShieldCheck },
  ];

  return (
    <footer className="relative bg-white/5 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-300 mt-auto overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />
      
      {/* Breadcrumbs Component */}
      <FooterBreadcrumb />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-24 md:pt-12 md:pb-12 relative z-10"
      >
        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-7 mb-8 md:grid-cols-12 md:gap-8 md:mb-12 lg:gap-12">
          
          {/* Brand & Identity (Col Span 4) */}
          <div className="md:col-span-4 flex flex-col space-y-4 md:space-y-6">
            <Link to="/" className="inline-block group focus-visible:outline-none rounded-lg max-w-max">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-4"
              >
                <img loading="eager" decoding="async" width="3961" height="738" src={logoHorizontal} alt="Iglesia Jerusalén — Posesión de Paz" className="block h-auto w-[15rem] max-w-full shrink-0 rounded-xl bg-[#0b1530] px-3 py-2 shadow-sm ring-1 ring-slate-900/10 transition-transform duration-300 group-hover:scale-[1.02] md:w-[18rem]" />
              </motion.div>
            </Link>
            
            <p className="max-w-sm border-l-2 border-indigo-200 pl-4 text-[13px] leading-6 text-slate-600 dark:border-indigo-900/50 dark:text-slate-400 md:text-sm md:leading-relaxed italic">
              "Jesucristo es el mismo ayer, hoy y por los siglos."
              <span className="block not-italic font-semibold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">— Hebreos 13:8</span>
            </p>

            <div className="flex gap-2 pt-1 md:gap-3 md:pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 ${social.color}`}
                  title={social.name}
                  aria-label={`Seguir a Iglesia Jerusalén en ${social.name}`}
                >
                  {social.iconRenderer()}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Explorar Inteligente (Col Span 5) */}
          <div className="hidden md:col-span-5 md:block">
            <h4 className="font-serif font-bold text-slate-900 dark:text-white mb-6 text-lg tracking-tight">Explorar</h4>
            <div className="grid grid-cols-2 gap-6">
              {exploreCategories.map((category) => (
                <div key={category.title}>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-indigo-500/80 dark:text-indigo-400/80 mb-4">{category.title}</h5>
                  <ul className="space-y-4">
                    {category.links.filter((link) => isPublicPathVisible(link.path, featureVisibility)).map((link) => {
                      const Icon = link.icon;
                      return (
                        <li key={link.path}>
                          <Link 
                            to={link.path} 
                            className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 flex items-center gap-2.5 group"
                          >
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-200 shadow-2xs">
                              <Icon size={14} />
                            </span>
                            <span className="transition-transform duration-200 group-hover:translate-x-1">
                              {link.name}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Contacto & Legal (Col Span 3) */}
          <div className="md:col-span-3 flex flex-col space-y-6 md:space-y-8">
            <div>
              <h4 className="mb-4 font-serif text-lg font-bold tracking-tight text-slate-900 dark:text-white md:mb-6">Contacto</h4>
              <div className="space-y-3 text-[13px] text-slate-600 dark:text-slate-400 md:space-y-4 md:text-sm">
                <div className="flex items-start gap-3 group">
                  <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                  <address className="not-italic leading-relaxed">
                    Baquerizo Moreno entre Av. Colón y Tulcán<br />
                    Milagro, Ecuador
                  </address>
                </div>
                <div className="flex items-center gap-3 group">
                  <Phone size={18} className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <a href="tel:+593985263122" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    +593 98 526 3122
                  </a>
                </div>
                <div className="flex items-center gap-3 group">
                  <Mail size={18} className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform duration-200" />
                  <a href="mailto:iece_jerusalen@hotmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all">
                    iece_jerusalen@hotmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/50 pt-4 dark:border-white/10 md:pt-6">
              <ul className="space-y-3">
                {legalLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <Icon size={14} className="opacity-70 group-hover:opacity-100 group-hover:text-indigo-500 transition-all duration-200" />
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                          {link.name}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Developer Note */}
        <div className="mt-4 flex flex-col items-center gap-4 border-t border-slate-200/80 pt-6 text-center text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-500 md:mt-4 md:flex-row md:justify-between md:gap-6 md:pt-8 md:text-left md:text-xs">
          <p className="font-medium">
            &copy; {currentYear} Iglesia Jerusalén. Todos los derechos reservados.
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium shadow-sm cursor-default select-none dark:border-white/10 dark:bg-white/5 md:px-4 md:py-2"
          >
            <span>Desarrollado con</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse mx-0.5" /> 
            <span>por</span>
            <span className="font-bold text-slate-800 dark:text-slate-300 ml-0.5">
              Esteban Nicola
            </span>
          </motion.div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
