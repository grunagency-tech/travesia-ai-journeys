// Re-export from destinationImages for backward compatibility
import { getDestinationImage } from './destinationImages';

// Collection of beautiful travel images for trip cards - now using local destination images
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

export const travelImages = [
  parisImg,
  romaImg,
  tokyoImg,
  nuevaYorkImg,
  barcelonaImg,
  londresImg,
  cancunImg,
  dubaiImg,
  peruImg,
  sydneyImg,
];

// Get a deterministic "random" image based on trip id
export const getTravelImage = (tripId: string): string => {
  // Use the trip ID to generate a consistent index
  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    const char = tripId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % travelImages.length;
  return travelImages[index];
};

// Get image by destination name (preferred method)
export const getImageByDestination = getDestinationImage;
