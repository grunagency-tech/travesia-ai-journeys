import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import logoFull from '@/assets/logo-full.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/translations';

const COUNTRIES = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'OTHER', name: 'Otro', flag: '🌍' },
];

const Register = () => {
  const isMobile = useIsMobile();
  const { user, signUpWithEmail, loading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = (key: string) => getTranslation(`register.${key}`, language);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: t('passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: t('passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUpWithEmail(email, password, firstName, lastName, country);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('checkEmail'),
        description: t('confirmationSent'),
      });
      navigate('/auth');
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logoFull} alt="travesIA" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-full max-w-md shadow-elegant relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={() => navigate('/')}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoFull} alt="travesIA" className="h-16" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('country')}</Label>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger id="country" className="bg-background">
                  <SelectValue placeholder={t('selectCountry')} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        {isMobile && <span>{c.flag}</span>}
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? t('submitting') : t('submit')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              {t('signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
