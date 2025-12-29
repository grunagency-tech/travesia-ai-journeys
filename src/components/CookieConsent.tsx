import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X, Settings2, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const translations = {
  title: {
    ES: '🍪 Usamos cookies',
    EN: '🍪 We use cookies',
    DE: '🍪 Wir verwenden Cookies',
    PT: '🍪 Usamos cookies',
    IT: '🍪 Utilizziamo i cookie',
  },
  description: {
    ES: 'Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.',
    EN: 'We use cookies to improve your experience, analyze traffic, and personalize content.',
    DE: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Verkehr zu analysieren und Inhalte zu personalisieren.',
    PT: 'Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar o conteúdo.',
    IT: 'Utilizziamo i cookie per migliorare la tua esperienza, analizzare il traffico e personalizzare i contenuti.',
  },
  acceptAll: {
    ES: 'Aceptar todo',
    EN: 'Accept all',
    DE: 'Alle akzeptieren',
    PT: 'Aceitar tudo',
    IT: 'Accetta tutto',
  },
  rejectAll: {
    ES: 'Rechazar',
    EN: 'Reject all',
    DE: 'Alle ablehnen',
    PT: 'Rejeitar tudo',
    IT: 'Rifiuta tutto',
  },
  customize: {
    ES: 'Personalizar',
    EN: 'Customize',
    DE: 'Anpassen',
    PT: 'Personalizar',
    IT: 'Personalizza',
  },
  necessary: {
    ES: 'Esenciales',
    EN: 'Essential',
    DE: 'Notwendig',
    PT: 'Essenciais',
    IT: 'Essenziali',
  },
  necessaryDesc: {
    ES: 'Necesarias para el funcionamiento básico del sitio. Siempre activas.',
    EN: 'Required for basic site functionality. Always active.',
    DE: 'Erforderlich für die grundlegende Funktionalität der Website. Immer aktiv.',
    PT: 'Necessárias para a funcionalidade básica do site. Sempre ativas.',
    IT: 'Necessari per la funzionalità di base del sito. Sempre attivi.',
  },
  analytics: {
    ES: 'Analíticas',
    EN: 'Analytics',
    DE: 'Analytik',
    PT: 'Analíticas',
    IT: 'Analisi',
  },
  analyticsDesc: {
    ES: 'Nos ayudan a entender cómo usas el sitio para mejorarlo.',
    EN: 'Help us understand how you use the site to improve it.',
    DE: 'Helfen uns zu verstehen, wie Sie die Website nutzen, um sie zu verbessern.',
    PT: 'Nos ajudam a entender como você usa o site para melhorá-lo.',
    IT: 'Ci aiutano a capire come utilizzi il sito per migliorarlo.',
  },
  marketing: {
    ES: 'Marketing',
    EN: 'Marketing',
    DE: 'Marketing',
    PT: 'Marketing',
    IT: 'Marketing',
  },
  marketingDesc: {
    ES: 'Permiten mostrarte anuncios relevantes en otros sitios.',
    EN: 'Allow us to show you relevant ads on other sites.',
    DE: 'Ermöglichen es uns, Ihnen relevante Anzeigen auf anderen Websites zu zeigen.',
    PT: 'Permitem mostrar anúncios relevantes em outros sites.',
    IT: 'Ci permettono di mostrarti annunci pertinenti su altri siti.',
  },
  savePreferences: {
    ES: 'Guardar preferencias',
    EN: 'Save preferences',
    DE: 'Einstellungen speichern',
    PT: 'Salvar preferências',
    IT: 'Salva preferenze',
  },
  privacyPolicy: {
    ES: 'Política de privacidad',
    EN: 'Privacy policy',
    DE: 'Datenschutzrichtlinie',
    PT: 'Política de privacidade',
    IT: 'Informativa sulla privacy',
  },
};

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'travesia_cookie_consent';

export function CookieConsent() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  const t = (key: keyof typeof translations) => {
    return translations[key][language as keyof typeof translations.title] || translations[key].ES;
  };

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 p-4 transform transition-all duration-700 ease-out"
        style={{
          animation: 'slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Icon & Text */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Cookie className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-urbanist font-bold text-lg text-foreground">
                    {t('title')}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('description')}{' '}
                  <button 
                    onClick={() => {}}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('privacyPolicy')}
                  </button>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-muted-foreground hover:text-foreground order-3 sm:order-1"
                >
                  <Settings2 className="w-4 h-4 mr-1.5" />
                  {t('customize')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="order-2"
                >
                  {t('rejectAll')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-primary hover:bg-primary/90 text-white order-1 sm:order-3"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {t('acceptAll')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              {t('customize')}
            </DialogTitle>
            <DialogDescription>
              {t('description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essential */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/50">
              <div className="flex-1">
                <Label className="font-semibold text-foreground">{t('necessary')}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t('necessaryDesc')}</p>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-primary" />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/50">
              <div className="flex-1">
                <Label className="font-semibold text-foreground">{t('analytics')}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t('analyticsDesc')}</p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/50">
              <div className="flex-1">
                <Label className="font-semibold text-foreground">{t('marketing')}</Label>
                <p className="text-xs text-muted-foreground mt-1">{t('marketingDesc')}</p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4 mr-1.5" />
              {t('rejectAll')}
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleSavePreferences}>
              <Check className="w-4 h-4 mr-1.5" />
              {t('savePreferences')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
