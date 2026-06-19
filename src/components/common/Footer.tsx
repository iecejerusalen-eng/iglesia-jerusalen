import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import { 
  Mail, Phone, MapPin, Clock, Heart, MessageCircle
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { 
      name: 'Facebook', 
      url: 'https://facebook.com', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      ),
      color: 'hover:bg-blue-600 hover:text-white hover:border-blue-600'
    },
    { 
      name: 'Instagram', 
      url: 'https://instagram.com', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      color: 'hover:bg-pink-600 hover:text-white hover:border-pink-600'
    },
    { 
      name: 'YouTube', 
      url: 'https://youtube.com', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: 'hover:bg-red-600 hover:text-white hover:border-red-600'
    },
    { 
      name: 'WhatsApp', 
      url: 'https://wa.me/593987654321', 
      iconRenderer: () => <MessageCircle size={16} />,
      color: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
    }
  ];

  const quickLinks = [
    { name: 'Quiénes Somos', path: '/nosotros' },
    { name: 'Ministerios', path: '/ministerios' },
    { name: 'Prédicas Dominicales', path: '/predicas' },
    { name: 'Escuela Dominical', path: '/escuela-dominical' },
    { name: 'Plan de Lectura', path: '/plan-lectura' },
    { name: 'Diezmos y Ofrendas', path: '/donaciones' },
    { name: 'Tienda de Recursos', path: '/tienda' }
  ];

  return (
    <footer className="relative bg-gradient-to-b from-primary to-[#0d1e4e] text-white overflow-hidden border-t-4 border-gold/75 mt-auto">
      {/* Decorative background light rays */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Church Identity */}
          <div className="space-y-6">
            <Link to="/" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg p-1">
              <div className="flex items-center gap-3">
                <img src={soloLogoColorido} alt="Logo" className="h-10 w-auto" />
                <div className="text-left">
                  <span className="font-serif text-2xl font-bold text-white tracking-tight group-hover:text-gold transition-colors block leading-tight">
                    Jerusalén
                  </span>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-gold/90 block">
                    Iglesia del Evangelio Cuadrangular
                  </p>
                </div>
              </div>
            </Link>
            
            <p className="text-xs text-gray-300 leading-relaxed max-w-sm italic">
              "Jesucristo es el mismo ayer, hoy y por los siglos."
              <span className="block text-gray-400 not-italic font-semibold text-[10px] mt-1.5">— Hebreos 13:8</span>
            </p>

            {/* Social media icons with micro-animations */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 transition-all duration-300 shadow-sm ${social.color}`}
                  title={social.name}
                >
                  {social.iconRenderer()}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Column 2: Navigation links */}
          <div>
            <h4 className="font-serif font-bold text-base text-white border-b border-white/10 pb-3 mb-6 tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Enlaces Rápidos
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-xs text-gray-300 font-medium">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="hover:text-gold hover:translate-x-1.5 flex items-center gap-1.5 transition-all duration-200"
                  >
                    <span className="text-[9px] text-gold/60">➔</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="font-serif font-bold text-base text-white border-b border-white/10 pb-3 mb-6 tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Contacto
            </h4>
            <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-medium">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gold shrink-0 mt-0.5" />
                <address className="not-italic">
                  E25 y Av. 17 de Septiembre<br />
                  Milagro, Ecuador
                </address>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gold shrink-0" />
                <a href="tel:+593987654321" className="hover:text-gold transition-colors">
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gold shrink-0" />
                <a href="mailto:contacto@iglesiajerusalen.com" className="hover:text-gold transition-colors">
                  contacto@iglesiajerusalen.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Services Schedules */}
          <div>
            <h4 className="font-serif font-bold text-base text-white border-b border-white/10 pb-3 mb-6 tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full" />
              Horarios de Reunión
            </h4>
            <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed font-medium bg-white/5 border border-white/10 p-4 rounded-2xl shadow-inner">
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Culto Dominical</p>
                  <p className="mt-0.5 text-gray-300">Domingos 9:00 AM y 6:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border-t border-white/10 pt-3">
                <Clock size={16} className="text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Células en Hogares</p>
                  <p className="mt-0.5 text-gray-300">Sábados 7:30 PM</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Developer Note */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs text-gray-400">
          <p className="font-medium">
            &copy; {currentYear} Iglesia del Evangelio Cuadrangular Jerusalén. Todos los derechos reservados.
          </p>
          <div className="flex flex-col items-center md:items-end text-[10px] text-gray-500">
            <p className="flex items-center gap-1.5 font-medium">
              Desarrollado y creado con 
              <Heart size={10} className="text-accent-red fill-accent-red animate-pulse" /> 
              por
            </p>
            <span className="font-bold text-gray-400 hover:text-gold transition-colors duration-200 text-xs mt-0.5 tracking-wide">
              Esteban Nicola
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
