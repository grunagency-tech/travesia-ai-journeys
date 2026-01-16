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
  const [elapsedTime, setElapsedTime] = useState(0);

  // Estimated total time in seconds (based on typical generation time)
  const estimatedTotalTime = 90; // ~1.5 minutes

  const steps = [
    { icon: Plane, text: 'Buscando los mejores vuelos...', textEn: 'Finding the best flights...' },
    { icon: MapPin, text: 'Seleccionando actividades únicas...', textEn: 'Selecting unique activities...' },
    { icon: Luggage, text: 'Comparando opciones de hospedaje...', textEn: 'Comparing accommodation options...' },
    { icon: Compass, text: 'Optimizando tu ruta de viaje...', textEn: 'Optimizing your travel route...' },
  ];

  useEffect(() => {
    // Elapsed time counter
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Progress based on elapsed time with realistic curve
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Logarithmic progression that slows down as it approaches 95%
        const timeProgress = Math.min((elapsedTime / estimatedTotalTime) * 100, 95);
        const smoothProgress = prev + (timeProgress - prev) * 0.1;
        return Math.min(smoothProgress, 95);
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [elapsedTime]);

  // Calculate remaining time estimate
  const getRemainingTime = () => {
    const remaining = Math.max(0, estimatedTotalTime - elapsedTime);
    if (remaining <= 0) return 'Finalizando...';
    if (remaining < 60) return `~${remaining}s restantes`;
    const minutes = Math.ceil(remaining / 60);
    return `~${minutes} min restantes`;
  };

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
        <div className="mb-6 relative">
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-orange-400/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <img src={logoIcon} alt="travesIA" className="w-12 h-12 brightness-0 invert" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="bg-orange-400 shadow-lg rounded-full p-1.5 animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-urbanist font-bold mb-1 text-white">
          {t('itineraryOnWay')}
        </h3>

        {/* Destination badge */}
        {destination && (
          <div className="mb-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-3 py-1">
            <MapPin className="w-3.5 h-3.5 text-orange-300" />
            <span className="text-white/90 text-sm font-medium">{destination}</span>
          </div>
        )}

        {/* Brand tagline */}
        <p className="text-white/80 text-sm mb-4">Planea menos. Viaja más.</p>

        {/* Main Progress Bar - Prominent like reference image */}
        <div className="w-full max-w-md mb-4 px-4">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          
          {/* Progress info */}
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-white/70">{Math.round(progress)}% completado</span>
            <span className="text-orange-300 font-medium">{getRemainingTime()}</span>
          </div>
        </div>

        {/* Animated step indicator */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 mb-4 transition-all duration-500">
          <CurrentIcon className="w-4 h-4 text-orange-300 animate-pulse" />
          <span className="text-white/90 text-sm font-medium">
            {steps[currentStep].text}
          </span>
        </div>

        {/* Info text */}
        <p className="text-blue-100/70 text-xs max-w-sm mx-auto leading-relaxed">
          {t('preparingPlan')}
        </p>

        {/* Step indicators */}
        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'bg-orange-400 scale-125'
                  : i < currentStep
                  ? 'bg-orange-400/50'
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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingItinerary;
