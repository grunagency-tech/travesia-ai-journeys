import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50 flex justify-center">
      <div className="mx-auto px-6 flex items-center justify-between" style={{ width: '1228px', height: '79px' }}>
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="travesIA" className="h-8" />
        </Link>
        
        <div className="flex items-center gap-6">
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
    </nav>
  );
};
