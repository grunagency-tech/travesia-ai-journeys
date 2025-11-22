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
      className={`fixed top-2 md:top-4 left-1/2 -translate-x-1/2 bg-white shadow-md rounded-lg z-50 w-[calc(100%-1rem)] md:w-auto max-w-[1228px] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="px-4 md:px-6 py-4 md:h-[79px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="travesIA" className="h-6 md:h-8" />
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/mis-viajes">
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Mis viajes
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                      <span className="text-sm font-medium">{currencySymbol}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    <DropdownMenuItem onClick={() => setCurrency('USD')} className="cursor-pointer">
                      $ USD
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('EUR')} className="cursor-pointer">
                      € EUR
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('MXN')} className="cursor-pointer">
                      $ MXN
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('ARS')} className="cursor-pointer">
                      $ ARS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('BRL')} className="cursor-pointer">
                      R$ BRL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                      <span className="text-lg">{language === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    <DropdownMenuItem onClick={() => setLanguage('ES')} className="cursor-pointer">
                      🇪🇸 Español
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('EN')} className="cursor-pointer">
                      🇬🇧 English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ProfileMenu />
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                ¿Cómo funciona?
              </button>
              <Link to="/auth">
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground text-sm font-medium">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6">
                  Regístrate Gratis
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                      <span className="text-sm font-medium">{currencySymbol}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    <DropdownMenuItem onClick={() => setCurrency('USD')} className="cursor-pointer">
                      $ USD
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('EUR')} className="cursor-pointer">
                      € EUR
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('MXN')} className="cursor-pointer">
                      $ MXN
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('ARS')} className="cursor-pointer">
                      $ ARS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('BRL')} className="cursor-pointer">
                      R$ BRL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors focus:outline-none">
                      <span className="text-lg">{language === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border rounded-lg z-50">
                    <DropdownMenuItem onClick={() => setLanguage('ES')} className="cursor-pointer">
                      🇪🇸 Español
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('EN')} className="cursor-pointer">
                      🇬🇧 English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white rounded-b-lg">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <>
                <Link to="/mis-viajes" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Mis viajes
                  </Button>
                </Link>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Moneda:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1">
                        <span className="text-sm font-medium">{currencySymbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCurrency('USD')}>$ USD</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('EUR')}>€ EUR</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('MXN')}>$ MXN</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('ARS')}>$ ARS</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('BRL')}>R$ BRL</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Idioma:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1">
                        <span className="text-lg">{language === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLanguage('ES')}>🇪🇸 Español</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('EN')}>🇬🇧 English</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Regístrate Gratis
                  </Button>
                </Link>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Moneda:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1">
                        <span className="text-sm font-medium">{currencySymbol}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setCurrency('USD')}>$ USD</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('EUR')}>€ EUR</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('MXN')}>$ MXN</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('ARS')}>$ ARS</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCurrency('BRL')}>R$ BRL</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Idioma:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1">
                        <span className="text-lg">{language === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLanguage('ES')}>🇪🇸 Español</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('EN')}>🇬🇧 English</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
