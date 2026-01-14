// Destination images mapped by city/country keywords
import parisImg from '@/assets/destinations/paris.jpg';
import romaImg from '@/assets/destinations/roma.jpg';
import tokyoImg from '@/assets/destinations/tokyo.jpg';
import nuevaYorkImg from '@/assets/destinations/nueva-york.jpg';
import barcelonaImg from '@/assets/destinations/barcelona.jpg';
import londresImg from '@/assets/destinations/londres.jpg';
import cancunImg from '@/assets/destinations/cancun.jpg';
import dubaiImg from '@/assets/destinations/dubai.jpg';
import peruImg from '@/assets/destinations/peru.jpg';
import sydneyImg from '@/assets/destinations/sydney.jpg';
import lisboaImg from '@/assets/destinations/lisboa.jpg';

// Map of destination keywords to images
const destinationMap: Record<string, string> = {
  // France
  'paris': parisImg,
  'francia': parisImg,
  'france': parisImg,
  
  // Italy
  'roma': romaImg,
  'rome': romaImg,
  'italia': romaImg,
  'italy': romaImg,
  'venecia': romaImg,
  'venice': romaImg,
  'florencia': romaImg,
  'florence': romaImg,
  'milán': romaImg,
  'milan': romaImg,
  
  // Japan
  'tokyo': tokyoImg,
  'tokio': tokyoImg,
  'japón': tokyoImg,
  'japan': tokyoImg,
  'kyoto': tokyoImg,
  'osaka': tokyoImg,
  
  // USA
  'nueva york': nuevaYorkImg,
  'new york': nuevaYorkImg,
  'estados unidos': nuevaYorkImg,
  'usa': nuevaYorkImg,
  'miami': nuevaYorkImg,
  'los angeles': nuevaYorkImg,
  'los ángeles': nuevaYorkImg,
  'chicago': nuevaYorkImg,
  'san francisco': nuevaYorkImg,
  'las vegas': nuevaYorkImg,
  
  // Spain
  'barcelona': barcelonaImg,
  'españa': barcelonaImg,
  'spain': barcelonaImg,
  'madrid': barcelonaImg,
  'sevilla': barcelonaImg,
  'valencia': barcelonaImg,
  
  // UK
  'londres': londresImg,
  'london': londresImg,
  'reino unido': londresImg,
  'uk': londresImg,
  'england': londresImg,
  'inglaterra': londresImg,
  
  // Portugal
  'lisboa': lisboaImg,
  'lisbon': lisboaImg,
  'portugal': lisboaImg,

  // Mexico
  'cancún': cancunImg,
  'cancun': cancunImg,
  'méxico': cancunImg,
  'mexico': cancunImg,
  'playa del carmen': cancunImg,
  'tulum': cancunImg,
  'riviera maya': cancunImg,
  'cdmx': cancunImg,
  'ciudad de méxico': cancunImg,
  
  // UAE
  'dubai': dubaiImg,
  'dubái': dubaiImg,
  'emiratos': dubaiImg,
  'abu dhabi': dubaiImg,
  
  // Peru
  'perú': peruImg,
  'peru': peruImg,
  'lima': peruImg,
  'cusco': peruImg,
  'machu picchu': peruImg,
  
  // Australia
  'sydney': sydneyImg,
  'sídney': sydneyImg,
  'australia': sydneyImg,
  'melbourne': sydneyImg,
};

// Fallback images array for destinations not in the map
const fallbackImages = [
  parisImg,
  romaImg,
  tokyoImg,
  nuevaYorkImg,
  barcelonaImg,
  londresImg,
  lisboaImg,
  cancunImg,
  dubaiImg,
  peruImg,
  sydneyImg,
];

/**
 * Get destination image based on destination name
 * Matches against known cities/countries and returns appropriate image
 */
export function getDestinationImage(destination: string): string {
  if (!destination) {
    return fallbackImages[0];
  }
  
  const normalizedDest = destination.toLowerCase().trim();
  
  // Check for exact or partial matches
  for (const [keyword, image] of Object.entries(destinationMap)) {
    if (normalizedDest.includes(keyword) || keyword.includes(normalizedDest)) {
      return image;
    }
  }
  
  // Return deterministic fallback based on destination string
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    const char = destination.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % fallbackImages.length;
  return fallbackImages[index];
}

/**
 * Preload an image URL to check if it can be loaded
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
