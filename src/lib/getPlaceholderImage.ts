// Helper to generate placeholder images from Unsplash based on keywords

const UNSPLASH_BASE = "https://source.unsplash.com/featured";

// Generate a hotel image URL based on the hotel name or type
export const getHotelImage = (hotelName: string, index: number = 0): string => {
  const keywords = ["luxury hotel", "hotel room", "resort", "boutique hotel", "hotel lobby"];
  const keyword = keywords[index % keywords.length];
  // Add hotel name context and unique seed
  const seed = encodeURIComponent(`${hotelName}-${index}`);
  return `${UNSPLASH_BASE}/400x300?hotel,${encodeURIComponent(keyword)}&sig=${seed}`;
};

// Generate an activity image URL based on the activity name and type
export const getActivityImage = (activityName: string, activityType?: string, index: number = 0): string => {
  // Use activity type or fallback to generic travel keywords
  const typeKeywords: Record<string, string> = {
    "cultural": "museum culture art",
    "gastronomía": "food restaurant cuisine",
    "gastronomia": "food restaurant cuisine",
    "aventura": "adventure outdoor hiking",
    "naturaleza": "nature landscape scenic",
    "playa": "beach ocean tropical",
    "histórico": "historic monument ancient",
    "historico": "historic monument ancient",
    "museo": "museum art gallery",
    "tour": "tour guide sightseeing",
    "nocturno": "nightlife city lights",
    "compras": "shopping market bazaar",
    "relax": "spa wellness relaxation",
    "deportes": "sports activity outdoor"
  };

  const keyword = activityType 
    ? typeKeywords[activityType.toLowerCase()] || activityType
    : "travel sightseeing";
  
  const seed = encodeURIComponent(`${activityName}-${index}`);
  return `${UNSPLASH_BASE}/400x300?${encodeURIComponent(keyword)}&sig=${seed}`;
};

// Cache for loaded images to avoid re-fetching
const imageCache = new Map<string, string>();

export const getCachedImage = (key: string, generator: () => string): string => {
  if (!imageCache.has(key)) {
    imageCache.set(key, generator());
  }
  return imageCache.get(key)!;
};
