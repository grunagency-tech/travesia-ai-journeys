import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import logoFull from '@/assets/logo-full.svg';

export const Navbar = () => {
  const { user, signOut } = useAuth();
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
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="travesIA" className="h-8" />
        </Link>
        
        <div className="flex items-center gap-8">
          {user ? (
            <>
              <Link to="/mis-viajes">
                <Button variant="ghost">Mis viajes</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                ¿Cómo funciona?
              </button>
              <Link to="/auth">
                <Button variant="ghost">Iniciar sesión</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90">
                  Regístrate Gratis
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
