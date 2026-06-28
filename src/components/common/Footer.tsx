import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import soloLogoColorido from '../../assets/Jerusalén/solo logo colorido.svg';
import { 
  Mail, Phone, MapPin, Clock, Heart, MessageCircle, ChevronDown
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionName: string) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
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
      color: 'hover:bg-blue-600 hover:text-white hover:border-blue-600'
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
      color: 'hover:bg-pink-600 hover:text-white hover:border-pink-600'
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/channel/UCgzlmsop3KSLpyzz92WQ2Mw', 
      iconRenderer: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.53 3.545 12 3.545 12 3.545s-7.53 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.017 0 12 0 12s0 3.982.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.858.507 9.388.507 9.388.507s7.53 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.982 24 12 24 12s0-3.982-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: 'hover:bg-red-600 hover:text-white hover:border-red-600'
    },
    { 
      name: 'WhatsApp', 
      url: 'https://wa.me/593985263122', 
      iconRenderer: () => <MessageCircle size={16} />,
      color: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
    }
  ];

  const churchLinks = [
    { name: 'Quiénes Somos', path: '/nosotros' },
    { name: 'Nuestros Ministerios', path: '/ministerios' },
    { name: 'Prédicas Dominicales', path: '/predicas' },
    { name: 'Escuela Dominical', path: '/escuela-dominical' },
    { name: 'Diezmos y Ofrendas', path: '/donaciones' }
  ];

  const resourceLinks = [
    { name: 'La Santa Biblia', path: '/recursos/biblia' },
    { name: 'Alabanzas e Himnos', path: '/recursos/alabanzas' },
    { name: 'Plan de Lectura', path: '/plan-lectura' },
    { name: 'Tienda de Recursos', path: '/tienda' },
    { name: 'Aula Virtual', path: '/aula-virtual' }
  ];

  return (
    <footer className="relative bg-gradient-to-b from-primary to-[#0d1e4e] text-white overflow-hidden border-t-4 border-gold/75 mt-auto">
      {/* Decorative background light rays */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-28 md:pb-8 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Church Identity */}
          <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg p-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <img loading="lazy" src={soloLogoColorido} alt="Logo" className="h-10 w-auto" />
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

          {/* Column 2: Nuestra Iglesia */}
          <div className="border-b border-white/10 md:border-b-0 pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('iglesia')}
              className="w-full flex justify-between items-center text-left font-serif font-bold text-base text-white border-b border-white/10 md:border-b-0 pb-3 mb-4 md:mb-6 tracking-wide focus:outline-none md:pointer-events-none cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Nuestra Iglesia
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gold transition-transform duration-300 md:hidden ${openSection === 'iglesia' ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`md:block transition-all duration-300 overflow-hidden ${openSection === 'iglesia' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
              <ul className="space-y-3 text-xs text-gray-300 font-medium pl-3.5 md:pl-0">
                {churchLinks.map((link) => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="hover:text-gold hover:translate-x-1.5 flex items-center gap-1.5 transition-all duration-200 py-1 md:py-0"
                    >
                      <span className="text-[9px] text-gold/60">➔</span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Recursos Bíblicos */}
          <div className="border-b border-white/10 md:border-b-0 pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('recursos')}
              className="w-full flex justify-between items-center text-left font-serif font-bold text-base text-white border-b border-white/10 md:border-b-0 pb-3 mb-4 md:mb-6 tracking-wide focus:outline-none md:pointer-events-none cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Recursos Bíblicos
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gold transition-transform duration-300 md:hidden ${openSection === 'recursos' ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`md:block transition-all duration-300 overflow-hidden ${openSection === 'recursos' ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
              <ul className="space-y-3 text-xs text-gray-300 font-medium pl-3.5 md:pl-0">
                {resourceLinks.map((link) => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="hover:text-gold hover:translate-x-1.5 flex items-center gap-1.5 transition-all duration-200 py-1 md:py-0"
                    >
                      <span className="text-[9px] text-gold/60">➔</span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Contact & Schedules */}
          <div className="pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('contacto')}
              className="w-full flex justify-between items-center text-left font-serif font-bold text-base text-white border-b border-white/10 md:border-b-0 pb-3 mb-4 md:mb-6 tracking-wide focus:outline-none md:pointer-events-none cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full" />
                Contacto y Horarios
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gold transition-transform duration-300 md:hidden ${openSection === 'contacto' ? 'rotate-180' : ''}`} 
              />
            </button>
            <div className={`md:block transition-all duration-300 overflow-hidden ${openSection === 'contacto' ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}>
              <div className="space-y-6 pl-3.5 md:pl-0 pt-2 md:pt-0">
                <div>
                  <h5 className="hidden md:flex font-serif font-bold text-sm text-white/90 mb-3 tracking-wide items-center gap-1.5">
                    Contacto
                  </h5>
                  <div className="space-y-3 text-xs text-gray-300 leading-relaxed font-medium">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gold shrink-0 mt-0.5" />
                      <address className="not-italic">
                        Baquerizo Moreno entre Av. Colón y Tulcán<br />
                        Milagro, Ecuador
                      </address>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gold shrink-0" />
                      <a href="tel:+593985263122" className="hover:text-gold transition-colors">
                        +593 98 526 3122
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gold shrink-0" />
                      <a href="mailto:iece_jerusalen@hotmail.com" className="hover:text-gold transition-colors">
                        iece_jerusalen@hotmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="hidden md:flex font-serif font-bold text-sm text-white/90 mb-3 tracking-wide items-center gap-1.5">
                    Horarios de Reunión
                  </h5>
                  <div className="space-y-2 text-xs text-gray-300 leading-relaxed font-medium bg-white/5 border border-white/10 p-3.5 rounded-2xl shadow-inner max-w-sm md:max-w-none">
                    <div className="flex items-start gap-2.5">
                      <Clock size={16} className="text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider">Culto Dominical</p>
                        <p className="mt-0.5 text-gray-300">Domingos 9:00 AM y 6:30 PM</p>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2.5 mt-2.5 flex items-start gap-2.5">
                      <Clock size={16} className="text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider">Células en Hogares</p>
                        <p className="mt-0.5 text-gray-300">Sábados 7:30 PM</p>
                      </div>
                    </div>
                  </div>
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
