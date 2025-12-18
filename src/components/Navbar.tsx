import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProfileMenu } from '@/components/ProfileMenu';
import logoFull from '@/assets/logo-full.svg';
import { languages, getTranslation, getFlagUrl } from '@/lib/translations';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      
      // Hide navbar when scrolled past hero section
      setIsVisible(scrollPosition < heroHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className={`fixed top-2 md:top-4 left-1/2 -translate-x-1/2 bg-white shadow-md rounded-lg z-50 w-[calc(100%-1rem)] md:w-[75vw] max-w-[1400px] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="px-4 md:px-8 py-5 md:py-6 md:h-[95px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="travesIA" className="h-10 md:h-12" />
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop and Tablet menu */}
        <div className="hidden lg:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/mis-viajes">
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  {getTranslation('navbar.myTrips', language)}
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                    <span className="text-sm font-medium">{currencySymbol}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50 min-w-[100px]">
                  <DropdownMenuItem onClick={() => setCurrency('USD')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> USD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('EUR')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">€</span> EUR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('MXN')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> MXN
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('ARS')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> ARS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('BRL')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">R$</span> BRL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('PEN')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">S/</span> PEN
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                    <img src={getFlagUrl(languages[language].flag)} alt={language} className="w-5 h-4 object-cover rounded-sm" />
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                  {Object.entries(languages).map(([code, lang]) => (
                    <DropdownMenuItem 
                      key={code} 
                      onClick={() => setLanguage(code as any)} 
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <img src={getFlagUrl(lang.flag)} alt={code} className="w-5 h-4 object-cover rounded-sm" />
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ProfileMenu />
            </>
          ) : (
            <>
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                {getTranslation('navbar.howItWorks', language)}
              </button>
              <Link to="/auth">
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  {getTranslation('navbar.login', language)}
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 uppercase font-bold">
                  {getTranslation('navbar.register', language).toUpperCase()}
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                    <span className="text-sm font-medium">{currencySymbol}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50 min-w-[100px]">
                  <DropdownMenuItem onClick={() => setCurrency('USD')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> USD
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('EUR')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">€</span> EUR
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('MXN')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> MXN
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('ARS')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">$</span> ARS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('BRL')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">R$</span> BRL
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrency('PEN')} className="cursor-pointer">
                    <span className="inline-block w-6 text-right mr-1">S/</span> PEN
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                    <img src={getFlagUrl(languages[language].flag)} alt={language} className="w-5 h-4 object-cover rounded-sm" />
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                  {Object.entries(languages).map(([code, lang]) => (
                    <DropdownMenuItem 
                      key={code} 
                      onClick={() => setLanguage(code as any)} 
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <img src={getFlagUrl(lang.flag)} alt={code} className="w-5 h-4 object-cover rounded-sm" />
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white rounded-b-lg">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <>
                <Link 
                  to="/perfil" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Mi Perfil
                </Link>
                <Link 
                  to="/mis-viajes" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Mis Viajes
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-between">
                      <span>Moneda</span>
                      <span className="flex items-center gap-1">
                        <span className="font-normal">{currencySymbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50 min-w-[100px]">
                    <DropdownMenuItem onClick={() => setCurrency('USD')}><span className="inline-block w-6 text-right mr-1">$</span> USD</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('EUR')}><span className="inline-block w-6 text-right mr-1">€</span> EUR</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('MXN')}><span className="inline-block w-6 text-right mr-1">$</span> MXN</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('ARS')}><span className="inline-block w-6 text-right mr-1">$</span> ARS</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('BRL')}><span className="inline-block w-6 text-right mr-1">R$</span> BRL</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('PEN')}><span className="inline-block w-6 text-right mr-1">S/</span> PEN</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-between">
                      <span>Idioma</span>
                      <span className="flex items-center gap-1">
                        <img src={getFlagUrl(languages[language].flag)} alt={language} className="w-5 h-4 object-cover rounded-sm" />
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    {Object.entries(languages).map(([code, lang]) => (
                      <DropdownMenuItem 
                        key={code} 
                        onClick={() => setLanguage(code as any)}
                        className="flex items-center gap-2"
                      >
                        <img src={getFlagUrl(lang.flag)} alt={code} className="w-5 h-4 object-cover rounded-sm" />
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => scrollToSection('como-funciona')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  ¿Cómo funciona?
                </button>
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white uppercase">
                    REGÍSTRATE GRATIS
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-between">
                      <span>Moneda</span>
                      <span className="flex items-center gap-1">
                        <span className="font-normal">{currencySymbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50 min-w-[100px]">
                    <DropdownMenuItem onClick={() => setCurrency('USD')}><span className="inline-block w-6 text-right mr-1">$</span> USD</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('EUR')}><span className="inline-block w-6 text-right mr-1">€</span> EUR</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('MXN')}><span className="inline-block w-6 text-right mr-1">$</span> MXN</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('ARS')}><span className="inline-block w-6 text-right mr-1">$</span> ARS</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('BRL')}><span className="inline-block w-6 text-right mr-1">R$</span> BRL</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('PEN')}><span className="inline-block w-6 text-right mr-1">S/</span> PEN</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-between">
                      <span>Idioma</span>
                      <span className="flex items-center gap-1">
                        <img src={getFlagUrl(languages[language].flag)} alt={language} className="w-5 h-4 object-cover rounded-sm" />
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    {Object.entries(languages).map(([code, lang]) => (
                      <DropdownMenuItem 
                        key={code} 
                        onClick={() => setLanguage(code as any)}
                        className="flex items-center gap-2"
                      >
                        <img src={getFlagUrl(lang.flag)} alt={code} className="w-5 h-4 object-cover rounded-sm" />
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
