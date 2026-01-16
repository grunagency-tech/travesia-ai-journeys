import { useState, useEffect } from 'react';
import { Plane, MapPin, Cloud, Sparkles, Compass, Luggage } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.svg';
import logoFull from '@/assets/logo-full.svg';

interface LoadingItineraryProps {
  destination?: string;
  t: (key: string) => string;
}

const LoadingItinerary = ({ destination, t }: LoadingItineraryProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Plane, text: 'Buscando los mejores vuelos...', textEn: 'Finding the best flights...' },
    { icon: MapPin, text: 'Seleccionando actividades únicas...', textEn: 'Selecting unique activities...' },
    { icon: Luggage, text: 'Comparando opciones de hospedaje...', textEn: 'Comparing accommodation options...' },
    { icon: Compass, text: 'Optimizando tu ruta de viaje...', textEn: 'Optimizing your travel route...' },
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 3;
      });
    }, 500);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700">
      {/* Animated clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <Cloud
            key={i}
            className="absolute text-white/10 animate-cloud"
            style={{
              width: `${60 + i * 20}px`,
              height: `${40 + i * 15}px`,
              top: `${10 + i * 15}%`,
              left: '-100px',
              animationDelay: `${i * 2}s`,
              animationDuration: `${15 + i * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Flying airplane with trail */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="airplane-container">
          <div className="airplane-trail" />
          <Plane className="airplane-icon w-8 h-8 text-white" />
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
        {/* Logo with glow effect */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-orange-400/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-28 h-28 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <img src={logoIcon} alt="travesIA" className="w-16 h-16 brightness-0 invert" />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            <div className="bg-orange-400 shadow-lg rounded-full p-2 animate-bounce">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-urbanist font-bold mb-2 text-white">
          {t('itineraryOnWay')}
        </h3>

        {/* Destination badge */}
        {destination && (
          <div className="mb-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5">
            <MapPin className="w-4 h-4 text-orange-300" />
            <span className="text-white/90 font-medium">{destination}</span>
          </div>
        )}

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
          <img src={logoFull} alt="travesIA" className="h-5 brightness-0 invert" />
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mb-6">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-300 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Animated step indicator */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-5 py-3 mb-6 transition-all duration-500">
          <CurrentIcon className="w-5 h-5 text-orange-300 animate-pulse" />
          <span className="text-white/90 text-sm font-medium">
            {steps[currentStep].text}
          </span>
        </div>

        {/* Info text */}
        <p className="text-blue-100/80 text-sm max-w-sm mx-auto leading-relaxed">
          {t('preparingPlan')}
        </p>

        {/* Step indicators */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'bg-orange-400 scale-125'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes cloud-float {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }
        
        @keyframes airplane-fly {
          0% {
            transform: translate(-50px, 100px) rotate(-15deg);
          }
          25% {
            transform: translate(25vw, 50px) rotate(-5deg);
          }
          50% {
            transform: translate(50vw, 80px) rotate(5deg);
          }
          75% {
            transform: translate(75vw, 30px) rotate(-10deg);
          }
          100% {
            transform: translate(calc(100vw + 50px), 60px) rotate(-5deg);
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-30px) scale(1.5);
          }
        }
        
        @keyframes trail-fade {
          0% { opacity: 0.6; width: 0; }
          50% { opacity: 0.4; width: 80px; }
          100% { opacity: 0; width: 120px; }
        }
        
        .animate-cloud {
          animation: cloud-float linear infinite;
        }
        
        .airplane-container {
          position: absolute;
          top: 20%;
          animation: airplane-fly 8s ease-in-out infinite;
        }
        
        .airplane-icon {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
          transform: rotate(-15deg);
        }
        
        .airplane-trail {
          position: absolute;
          right: 100%;
          top: 50%;
          height: 2px;
          background: linear-gradient(to left, rgba(255,255,255,0.6), transparent);
          animation: trail-fade 2s ease-out infinite;
          transform: translateY(-50%);
        }
        
        .animate-float-particle {
          animation: float-particle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingItinerary;
