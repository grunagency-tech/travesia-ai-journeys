import { User, HelpCircle, LogOut, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const ProfileMenu = () => {
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = (key: string) => getTranslation(`profileMenu.${key}`, language);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-secondary text-foreground/60 text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border border-border rounded-2xl shadow-lg p-2 z-50">
        <DropdownMenuItem 
          onClick={() => navigate('/perfil')}
          className="cursor-pointer rounded-lg px-4 py-3 hover:bg-secondary/50 focus:bg-secondary/50"
        >
          <User className="mr-3 h-4 w-4 text-foreground/60" />
          <span className="text-sm font-medium">{t('myProfile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate('/mis-viajes')}
          className="cursor-pointer rounded-lg px-4 py-3 hover:bg-secondary/50 focus:bg-secondary/50"
        >
          <Plane className="mr-3 h-4 w-4 text-foreground/60" />
          <span className="text-sm font-medium">{t('myTrips')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate('/ayuda')}
          className="cursor-pointer rounded-lg px-4 py-3 hover:bg-secondary/50 focus:bg-secondary/50"
        >
          <HelpCircle className="mr-3 h-4 w-4 text-foreground/60" />
          <span className="text-sm font-medium">{t('helpCenter')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2 bg-border" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer rounded-lg px-4 py-3 hover:bg-destructive/10 focus:bg-destructive/10 text-destructive"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-sm font-medium">{t('signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
