import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, ChevronDown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logoFull from '@/assets/logo-full.svg';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { currency, setCurrency, currencySymbol } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="travesIA" className="h-8" />
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/mis-viajes">
                <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                  Mis viajes
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
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
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors">
                      <span className="text-sm font-medium">{currencySymbol}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    <DropdownMenuItem onClick={() => setCurrency('USD')}>
                      $ USD
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('EUR')}>
                      € EUR
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('MXN')}>
                      $ MXN
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('ARS')}>
                      $ ARS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrency('BRL')}>
                      R$ BRL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground/80 hover:text-foreground transition-colors">
                      <span className="text-lg">{language === 'ES' ? '🇪🇸' : '🇬🇧'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background z-50">
                    <DropdownMenuItem onClick={() => setLanguage('ES')}>
                      🇪🇸 Español
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('EN')}>
                      🇬🇧 English
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                <User className="w-5 h-5 text-foreground/60" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
