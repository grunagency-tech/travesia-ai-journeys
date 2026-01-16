import { ItineraryData } from "@/components/itinerary/types";

export type ConversationItineraryCache = {
  itineraryData: ItineraryData | null;
  htmlContent: string | null;
  conversationTitle: string | null;
  tripDestination: string | null;
  tripOrigin: string | null;
  tripDate: string | null;
  tripEndDate: string | null;
  tripTravelers: number | null;
  tripBudget: number | null;
  tripImage: string | null;
  updatedAt: string;
};

const keyFor = (conversationId: string) => `travesia:itinerary-cache:v1:${conversationId}`;

export const loadConversationItineraryCache = (
  conversationId: string
): ConversationItineraryCache | null => {
  try {
    const raw = localStorage.getItem(keyFor(conversationId));
    if (!raw) return null;
    return JSON.parse(raw) as ConversationItineraryCache;
  } catch {
    return null;
  }
};

export const saveConversationItineraryCache = (
  conversationId: string,
  cache: Omit<ConversationItineraryCache, "updatedAt">
) => {
  try {
    const payload: ConversationItineraryCache = {
      ...cache,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(keyFor(conversationId), JSON.stringify(payload));
  } catch {
    // ignore (storage full / blocked)
  }
};

export const clearConversationItineraryCache = (conversationId: string) => {
  try {
    localStorage.removeItem(keyFor(conversationId));
  } catch {
    // ignore
  }
};
