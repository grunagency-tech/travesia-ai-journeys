// Fetch real destination images from Wikimedia Commons API

interface WikimediaImage {
  title: string;
  url: string;
  thumbUrl: string;
}

// Cache for destination images
const imageCache: Map<string, string> = new Map();

export async function getDestinationImage(destination: string): Promise<string> {
  // Check cache first
  const cached = imageCache.get(destination.toLowerCase());
  if (cached) return cached;

  try {
    // Search Wikimedia Commons for images of the destination
    const searchQuery = encodeURIComponent(`${destination} city landmark`);
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${searchQuery}&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json&origin=*`
    );

    if (!response.ok) throw new Error('Wikimedia API error');

    const data = await response.json();
    const pages = data.query?.pages;

    if (pages) {
      // Filter for actual photos (exclude SVG, icons, maps)
      const images = Object.values(pages)
        .filter((page: any) => {
          const title = page.title?.toLowerCase() || '';
          const isPhoto = !title.includes('.svg') && 
                         !title.includes('icon') && 
                         !title.includes('logo') &&
                         !title.includes('map') &&
                         !title.includes('flag') &&
                         !title.includes('coat of arms');
          return isPhoto && page.imageinfo?.[0]?.thumburl;
        })
        .map((page: any) => page.imageinfo[0].thumburl);

      if (images.length > 0) {
        // Pick a random image from results
        const imageUrl = images[Math.floor(Math.random() * images.length)] as string;
        imageCache.set(destination.toLowerCase(), imageUrl);
        return imageUrl;
      }
    }

    // Fallback to a generic search
    return await getFallbackImage(destination);
  } catch (error) {
    console.error('Error fetching destination image:', error);
    return getFallbackImageSync(destination);
  }
}

async function getFallbackImage(destination: string): Promise<string> {
  try {
    // Try a broader search with just the destination name
    const searchQuery = encodeURIComponent(destination);
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${searchQuery}&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`
    );

    if (!response.ok) throw new Error('Wikimedia API error');

    const data = await response.json();
    const pages = data.query?.pages;

    if (pages) {
      const images = Object.values(pages)
        .filter((page: any) => {
          const title = page.title?.toLowerCase() || '';
          return !title.includes('.svg') && 
                 !title.includes('icon') && 
                 page.imageinfo?.[0]?.thumburl;
        })
        .map((page: any) => page.imageinfo[0].thumburl);

      if (images.length > 0) {
        const imageUrl = images[0] as string;
        imageCache.set(destination.toLowerCase(), imageUrl);
        return imageUrl;
      }
    }
  } catch (error) {
    console.error('Fallback image fetch failed:', error);
  }

  return getFallbackImageSync(destination);
}

// Deterministic fallback with static images
function getFallbackImageSync(destination: string): string {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=400&fit=crop',
  ];

  // Deterministic selection based on destination name
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    const char = destination.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return fallbackImages[Math.abs(hash) % fallbackImages.length];
}

// Preload image to check if it loads correctly
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
