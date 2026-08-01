import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FooterBreadcrumb } from './FooterBreadcrumb';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import { 
  Mail, Phone, MapPin, Heart, ShieldCheck, Scale
} from 'lucide-react';

const Footer = () => {
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

  const quickLinks = [
    { name: 'Quiénes Somos', path: '/nosotros' },
    { name: 'Ministerios', path: '/ministerios' },
    { name: 'Sermones', path: '/predicas' },
    { name: 'Tienda', path: '/tienda' },
    { name: 'Juegos', path: '/recursos/juegos' },
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-24 md:pb-12 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 lg:gap-12 mb-12">
          
          {/* Brand & Identity (Col Span 5) */}
          <div className="md:col-span-5 flex flex-col space-y-6">
            <Link to="/" className="inline-block group focus-visible:outline-none rounded-lg max-w-max">
              <div className="flex items-center gap-4">
                <img loading="lazy" src={soloLogoColorido} alt="Logo Jerusalén" className="h-12 w-auto drop-shadow-md" />
                <div>
                  <span className="font-serif text-2xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block leading-tight">
                    Jerusalén
                  </span>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-600 dark:text-indigo-400/80 block mt-0.5">
                    Iglesia del Evangelio Cuadrangular
                  </p>
                </div>
              </div>
            </Link>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm italic border-l-2 border-indigo-200 dark:border-indigo-900/50 pl-4">
              "Jesucristo es el mismo ayer, hoy y por los siglos."
              <span className="block not-italic font-semibold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">— Hebreos 13:8</span>
            </p>

            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-10 h-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all duration-300 shadow-sm ${social.color}`}
                  title={social.name}
                >
                  {social.iconRenderer()}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Enlaces Rápidos (Col Span 3) */}
          <div className="md:col-span-3">
            <h4 className="font-serif font-bold text-slate-900 dark:text-white mb-6 text-lg">Explorar</h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto & Legal (Col Span 4) */}
          <div className="md:col-span-4 flex flex-col space-y-8">
            <div>
              <h4 className="font-serif font-bold text-slate-900 dark:text-white mb-6 text-lg">Contacto</h4>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                  <address className="not-italic leading-relaxed">
                    Baquerizo Moreno entre Av. Colón y Tulcán<br />
                    Milagro, Ecuador
                  </address>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-indigo-500 shrink-0" />
                  <a href="tel:+593985263122" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    +593 98 526 3122
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-indigo-500 shrink-0" />
                  <a href="mailto:iece_jerusalen@hotmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all">
                    iece_jerusalen@hotmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/50 dark:border-white/10">
              <ul className="space-y-3">
                {legalLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200 flex items-center gap-2"
                      >
                        <Icon size={14} className="opacity-70" />
                        {link.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Developer Note */}
        <div className="border-t border-slate-200/80 dark:border-white/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left text-xs text-slate-500 dark:text-slate-500">
          <p className="font-medium">
            &copy; {currentYear} Iglesia Jerusalén. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1.5 font-medium px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
            <span>Desarrollado con</span>
            <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse mx-0.5" /> 
            <span>por</span>
            <span className="font-bold text-slate-800 dark:text-slate-300 ml-0.5">
              Esteban Nicola
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
