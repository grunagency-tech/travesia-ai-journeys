// Helper to get static placeholder images by category
// Uses local images instead of external APIs for reliability

// Import static activity images
import museoImg from '@/assets/activities/museo.jpg';
import aventuraImg from '@/assets/activities/aventura.jpg';
import gastronomiaImg from '@/assets/activities/gastronomia.jpg';
import playaImg from '@/assets/activities/playa.jpg';
import historicoImg from '@/assets/activities/historico.jpg';
import naturalezaImg from '@/assets/activities/naturaleza.jpg';
import tourImg from '@/assets/activities/tour.jpg';
import nocturnoImg from '@/assets/activities/nocturno.jpg';
import comprasImg from '@/assets/activities/compras.jpg';
import relaxImg from '@/assets/activities/relax.jpg';
import deportesImg from '@/assets/activities/deportes.jpg';
import culturalImg from '@/assets/activities/cultural.jpg';
import defaultImg from '@/assets/activities/default.jpg';
import hotelImg from '@/assets/activities/hotel.jpg';

// Map activity types to their corresponding images
const activityImages: Record<string, string> = {
  // Museums and art
  'museo': museoImg,
  'museos': museoImg,
  'museum': museoImg,
  'arte': museoImg,
  'art': museoImg,
  'galeria': museoImg,
  'gallery': museoImg,
  
  // Adventure and outdoor
  'aventura': aventuraImg,
  'adventure': aventuraImg,
  'outdoor': aventuraImg,
  'hiking': aventuraImg,
  'senderismo': aventuraImg,
  'trekking': aventuraImg,
  'excursion': aventuraImg,
  'montaña': aventuraImg,
  'mountain': aventuraImg,
  
  // Food and gastronomy
  'gastronomia': gastronomiaImg,
  'gastronomía': gastronomiaImg,
  'food': gastronomiaImg,
  'comida': gastronomiaImg,
  'restaurante': gastronomiaImg,
  'restaurant': gastronomiaImg,
  'dining': gastronomiaImg,
  'cuisine': gastronomiaImg,
  'cena': gastronomiaImg,
  'almuerzo': gastronomiaImg,
  'desayuno': gastronomiaImg,
  
  // Beach
  'playa': playaImg,
  'beach': playaImg,
  'costa': playaImg,
  'mar': playaImg,
  'ocean': playaImg,
  'tropical': playaImg,
  
  // Historic
  'historico': historicoImg,
  'histórico': historicoImg,
  'historic': historicoImg,
  'history': historicoImg,
  'historia': historicoImg,
  'monumento': historicoImg,
  'monument': historicoImg,
  'ruinas': historicoImg,
  'ruins': historicoImg,
  'patrimonio': historicoImg,
  'heritage': historicoImg,
  
  // Nature
  'naturaleza': naturalezaImg,
  'nature': naturalezaImg,
  'parque': naturalezaImg,
  'park': naturalezaImg,
  'bosque': naturalezaImg,
  'forest': naturalezaImg,
  'cascada': naturalezaImg,
  'waterfall': naturalezaImg,
  'jardín': naturalezaImg,
  'jardin': naturalezaImg,
  'garden': naturalezaImg,
  
  // Tours
  'tour': tourImg,
  'tours': tourImg,
  'guiado': tourImg,
  'guided': tourImg,
  'recorrido': tourImg,
  'walking': tourImg,
  'city tour': tourImg,
  'sightseeing': tourImg,
  
  // Nightlife
  'nocturno': nocturnoImg,
  'night': nocturnoImg,
  'nightlife': nocturnoImg,
  'noche': nocturnoImg,
  'bar': nocturnoImg,
  'club': nocturnoImg,
  'fiesta': nocturnoImg,
  'party': nocturnoImg,
  
  // Shopping
  'compras': comprasImg,
  'shopping': comprasImg,
  'mercado': comprasImg,
  'market': comprasImg,
  'tienda': comprasImg,
  'shop': comprasImg,
  'bazaar': comprasImg,
  
  // Relaxation
  'relax': relaxImg,
  'spa': relaxImg,
  'wellness': relaxImg,
  'bienestar': relaxImg,
  'masaje': relaxImg,
  'massage': relaxImg,
  'descanso': relaxImg,
  
  // Sports
  'deportes': deportesImg,
  'deporte': deportesImg,
  'sports': deportesImg,
  'sport': deportesImg,
  'kayak': deportesImg,
  'ciclismo': deportesImg,
  'cycling': deportesImg,
  'surf': deportesImg,
  'buceo': deportesImg,
  'diving': deportesImg,
  'snorkel': deportesImg,
  
  // Cultural
  'cultural': culturalImg,
  'cultura': culturalImg,
  'culture': culturalImg,
  'tradicion': culturalImg,
  'tradition': culturalImg,
  'folklore': culturalImg,
  'festival': culturalImg,
  'ceremonia': culturalImg,
  'ceremony': culturalImg,
};

// Normalize text for matching
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Get activity image based on type or name keywords
export const getActivityImage = (activityName: string, activityType?: string): string => {
  const searchText = normalizeText(`${activityType || ''} ${activityName}`);
  
  // First try to find an exact type match
  if (activityType) {
    const normalizedType = normalizeText(activityType);
    if (activityImages[normalizedType]) {
      return activityImages[normalizedType];
    }
  }
  
  // Then search through all keywords
  for (const [keyword, image] of Object.entries(activityImages)) {
    if (searchText.includes(normalizeText(keyword))) {
      return image;
    }
  }
  
  // Return default image
  return defaultImg;
};

// Get hotel image - always returns the static hotel image
export const getHotelImage = (): string => {
  return hotelImg;
};

// Cache for loaded images (kept for compatibility but not really needed with static imports)
const imageCache = new Map<string, string>();

export const getCachedImage = (key: string, generator: () => string): string => {
  if (!imageCache.has(key)) {
    imageCache.set(key, generator());
  }
  return imageCache.get(key)!;
};
