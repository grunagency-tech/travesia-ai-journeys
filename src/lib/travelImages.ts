// Collection of beautiful travel images for trip cards
export const travelImages = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', // Travel road
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // Beach paradise
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', // Lake mountains
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80', // Travel adventure
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', // Nature landscape
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', // Paris Eiffel
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80', // Venice Italy
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', // Dubai skyline
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80', // Paris streets
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', // Tropical beach
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
