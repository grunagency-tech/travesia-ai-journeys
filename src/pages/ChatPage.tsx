import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, X, Save, Lock, CreditCard, Mic, Paperclip, Loader2, Sparkles, Menu, MessageCircle, PanelLeftClose, PanelLeft } from "lucide-react";
import LoadingItinerary from "@/components/LoadingItinerary";
import { ItineraryHeader } from "@/components/itinerary";
import ItineraryPanel from "@/components/ItineraryPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserLocation } from "@/contexts/LocationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { ConversationList } from "@/components/ConversationList";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import logoFull from "@/assets/logo-full.svg";
import logoIcon from "@/assets/logo-icon.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  htmlContent?: string;
}

// Using types from the itinerary components
import { ItineraryData } from "@/components/itinerary/types";

const generateItineraryHtml = (data: ItineraryData): string => {
  const { destino, resumen, transporte, alojamiento, itinerario, comentarios } = data;
  
  const getHoraLabel = (hora?: string) => {
    if (!hora) return '';
    switch (hora) {
      case 'morning': return '🌅 Mañana';
      case 'afternoon': return '☀️ Tarde';
      case 'evening': return '🌙 Noche';
      default: return `🕐 ${hora}`;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const duracionDias = itinerario?.length || resumen?.duracion || 0;
  const titulo = resumen?.titulo || `Viaje a ${destino || 'tu destino'}`;

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%; color: #1a1a2e;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">${titulo}</h1>
        ${destino ? `<p style="margin: 0 0 8px 0; opacity: 0.9; font-size: 16px;">📍 ${destino}</p>` : ''}
        ${resumen?.descripcion ? `<p style="margin: 0; opacity: 0.9; font-size: 16px;">${resumen.descripcion}</p>` : ''}
        <div style="display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap;">
          ${duracionDias > 0 ? `<span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px;">📅 ${duracionDias} días</span>` : ''}
          ${resumen?.presupuestoEstimado ? `<span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px;">💰 ~$${resumen.presupuestoEstimado.toLocaleString()} MXN</span>` : ''}
        </div>
      </div>

      <!-- Highlights -->
      ${resumen?.highlights?.length ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #667eea;">✨ Highlights del viaje</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${resumen.highlights.map(h => `<li style="margin-bottom: 6px;">${h}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Transporte -->
      ${transporte?.vuelos?.length ? `
        <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px;">✈️ Opciones de vuelo</h3>
          ${transporte.vuelos.map(v => `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 600;">${v.aerolinea}</div>
              ${v.origen && v.destino ? `<div style="font-size: 14px; color: #666;">${v.origen} → ${v.destino}</div>` : ''}
              ${v.precio ? `<div style="font-size: 14px; color: #667eea; font-weight: 600;">$${v.precio.toLocaleString()} MXN</div>` : ''}
            </div>
          `).join('')}
          ${transporte.transporteLocal ? `<p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">🚇 ${transporte.transporteLocal}</p>` : ''}
        </div>
      ` : ''}

      <!-- Alojamiento -->
      ${alojamiento?.recomendacion ? `
        <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px;">🏨 Alojamiento</h3>
          <div style="font-weight: 600; font-size: 16px;">${alojamiento.recomendacion}</div>
          ${alojamiento.zona ? `<div style="font-size: 14px; color: #666; margin-top: 4px;">📍 ${alojamiento.zona}</div>` : ''}
          ${alojamiento.costoPorNoche ? `<div style="font-size: 14px; color: #667eea; margin-top: 4px;">$${alojamiento.costoPorNoche}/noche</div>` : ''}
          ${alojamiento.opciones?.length ? `
            <div style="margin-top: 12px;">
              <span style="font-size: 13px; color: #888;">Otras opciones: ${alojamiento.opciones.map(o => typeof o === 'string' ? o : o.nombre).join(', ')}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Itinerario -->
      ${itinerario?.length ? `
        <h2 style="font-size: 22px; margin: 32px 0 16px 0;">📋 Itinerario día a día</h2>
        ${itinerario.map(day => `
          <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px;">
              <div style="font-weight: 700; font-size: 18px;">Día ${day.dia}</div>
              ${day.fecha ? `<div style="font-size: 14px; opacity: 0.9;">${formatDate(day.fecha)}</div>` : ''}
              ${day.resumenDia ? `<div style="font-size: 14px; margin-top: 4px; opacity: 0.8;">${day.resumenDia}</div>` : ''}
            </div>
            <div style="padding: 16px;">
              ${day.actividades?.map(act => `
                <div style="border-left: 3px solid #667eea; padding-left: 16px; margin-bottom: 16px;">
                  <div style="font-size: 12px; color: #888; margin-bottom: 4px;">${getHoraLabel(act.hora)}</div>
                  <div style="font-weight: 600; font-size: 16px;">${act.titulo || ''}</div>
                  ${act.descripcion ? `<div style="font-size: 14px; color: #666; margin-top: 4px;">${act.descripcion}</div>` : ''}
                  <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 13px; color: #888;">
                    ${act.ubicacion ? `<span>📍 ${act.ubicacion}</span>` : ''}
                    ${act.costoAprox && act.costoAprox > 0 ? `<span>💰 $${act.costoAprox} MXN</span>` : '<span>🆓 Gratis</span>'}
                  </div>
                </div>
              `).join('') || '<p style="color: #888;">Sin actividades programadas</p>'}
            </div>
          </div>
        `).join('')}
      ` : ''}

      <!-- Comentarios -->
      ${comentarios ? `
        <div style="margin-top: 32px;">
          ${comentarios.consejos?.length ? `
            <div style="background: #e8f5e9; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #2e7d32;">💡 Consejos</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${comentarios.consejos.map(c => `<li style="margin-bottom: 6px;">${c}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${comentarios.advertencias?.length ? `
            <div style="background: #fff3e0; padding: 20px; border-radius: 12px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #e65100;">⚠️ Advertencias</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${comentarios.advertencias.map(a => `<li style="margin-bottom: 6px;">${a}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${comentarios.mejorEpoca ? `
            <div style="background: #e3f2fd; padding: 20px; border-radius: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1565c0;">🗓️ Mejor época</h3>
              <p style="margin: 0;">${comentarios.mejorEpoca}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
};

const MAX_SAVED_TRIPS = 5;

// Extract clean destination name from title (e.g., "París Estratégico: Cultura" -> "París")
const extractDestinationFromTitle = (title: string): string | null => {
  // Common city names to look for
  const knownCities = [
    'París', 'Paris', 'Roma', 'Rome', 'Londres', 'London', 'Madrid', 'Barcelona',
    'Nueva York', 'New York', 'Tokyo', 'Tokio', 'Dubai', 'Dubái', 'Amsterdam', 
    'Ámsterdam', 'Berlin', 'Berlín', 'Viena', 'Vienna', 'Praga', 'Prague',
    'Lisboa', 'Lisbon', 'Atenas', 'Athens', 'Venecia', 'Venice', 'Florencia',
    'Florence', 'Milán', 'Milan', 'Bangkok', 'Singapur', 'Singapore', 'Sydney',
    'Los Ángeles', 'Los Angeles', 'Miami', 'Chicago', 'San Francisco',
    'Cancún', 'Cancun', 'México', 'Mexico City', 'Buenos Aires', 'Lima',
    'Bogotá', 'Santiago', 'Cartagena', 'Cusco', 'Río de Janeiro', 'Rio de Janeiro',
    'São Paulo', 'Sao Paulo', 'Medellín', 'Quito', 'La Habana', 'Havana'
  ];
  
  const titleLower = title.toLowerCase();
  
  for (const city of knownCities) {
    if (titleLower.includes(city.toLowerCase())) {
      return city;
    }
  }
  
  // Fallback: try to get first word before common separators
  const separators = [':', '-', '–', '|', ',', 'estratégico', 'romántico', 'aventura', 'cultural'];
  for (const sep of separators) {
    const idx = titleLower.indexOf(sep.toLowerCase());
    if (idx > 2) {
      const extracted = title.substring(0, idx).trim();
      if (extracted.length > 2 && extracted.length < 30) {
        return extracted;
      }
    }
  }
  
  return null;
};

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const { country, state, city } = useUserLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = (key: string) => getTranslation(`chat.${key}`, language);
  const initialMessage = location.state?.initialMessage || "";
  const conversationIdFromState = location.state?.conversationId || null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const loadConversationSeqRef = useRef(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [showContentOnMobile, setShowContentOnMobile] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tripSaved, setTripSaved] = useState(false);
  const [tripCount, setTripCount] = useState(0);
  const [checkingTripCount, setCheckingTripCount] = useState(false);
  const [limitNotificationShown, setLimitNotificationShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showRegisterBanner, setShowRegisterBanner] = useState(false);
  const userMessageCountRef = useRef(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);

  // Anonymous draft restore (sessionStorage)
  const [resumeDraftDialogOpen, setResumeDraftDialogOpen] = useState(false);
  const draftToRestoreRef = useRef<{
    messages: Message[];
    pendingMessage: string | null;
    showRegisterBanner: boolean;
    userMessageCount: number;
  } | null>(null);
  
  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationIdFromState);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState<string | null>(null);
  const [tripEndDate, setTripEndDate] = useState<string | null>(null);
  const [tripDestination, setTripDestination] = useState<string | null>(null);
  const [tripOrigin, setTripOrigin] = useState<string | null>(null);
  const [tripTravelers, setTripTravelers] = useState<number>(1);
  const [tripBudget, setTripBudget] = useState<number | null>(null);
  const [tripImage, setTripImage] = useState<string | null>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);

  // Edge function URL for TravesIA chat
  const CHAT_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travesia-chat`;

  const { isRecording, isProcessing, toggleRecording } = useVoiceRecorder({
    onTranscription: (text) => {
      setInputValue(prev => prev ? `${prev} ${text}` : text);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation if ID is provided
  useEffect(() => {
    if (conversationIdFromState && user) {
      loadConversation(conversationIdFromState);
    }
  }, [conversationIdFromState, user]);

  const loadConversation = async (convId: string) => {
    const seq = ++loadConversationSeqRef.current;

    try {
      // Load conversation details
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle();

      // If the user switched chats while we were loading, ignore this result
      if (seq !== loadConversationSeqRef.current) return;

      if (convError) throw convError;
      if (!conv) {
        toast({ title: "Conversación no encontrada", variant: "destructive" });
        return;
      }

      setConversationTitle(conv.title);
      setCurrentConversationId(convId);

      // Load messages
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (seq !== loadConversationSeqRef.current) return;

      if (msgsError) throw msgsError;

      const loadedMessages: Message[] = (msgs || []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        htmlContent: m.html_content || undefined,
      }));

      setMessages(loadedMessages);
      messagesRef.current = loadedMessages;
      userMessageCountRef.current = loadedMessages.filter(m => m.role === 'user').length;

      // If conversation has a linked trip, load the full trip data to restore itineraryData
      if (conv.trip_id) {
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', conv.trip_id)
          .maybeSingle();

        if (seq !== loadConversationSeqRef.current) return;

        if (!tripError && tripData) {
          // Restore trip metadata
          setTripDestination(tripData.destination);
          setTripOrigin(tripData.origin);
          setTripDate(tripData.start_date);
          setTripEndDate(tripData.end_date);
          setTripBudget(tripData.budget);
          setTripTravelers(tripData.travelers || 1);
          setTripSaved(true);

          // Restore itineraryData from preferences if available
          const prefs = tripData.preferences as { itinerary_data?: ItineraryData; itinerary_html?: string } | null;
          if (prefs?.itinerary_data) {
            setItineraryData(prefs.itinerary_data);
            // Also set HTML for fallback
            if (prefs.itinerary_html) {
              setHtmlContent(prefs.itinerary_html);
            }
            return; // Exit early - we have the full structured data
          } else if (prefs?.itinerary_html) {
            setHtmlContent(prefs.itinerary_html);
            return;
          }
        }
      }

      // Fallback: Check if there's HTML content in the last assistant message
      const lastAssistantMsg = [...loadedMessages].reverse().find(m => m.role === 'assistant' && m.htmlContent);
      if (lastAssistantMsg?.htmlContent) {
        setHtmlContent(lastAssistantMsg.htmlContent);
      } else {
        setHtmlContent(null);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({ title: "Error al cargar la conversación", variant: "destructive" });
    }
  };

  const createConversation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: null,
          destination: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (convId: string, role: "user" | "assistant", content: string, htmlContent?: string) => {
    if (!user || !convId) return;

    try {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role,
        content,
        html_content: htmlContent || null,
      });

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateConversationTitle = async (convId: string, title: string, destination?: string) => {
    if (!user || !convId) return;

    try {
      await supabase
        .from('conversations')
        .update({ 
          title, 
          destination: destination || null 
        })
        .eq('id', convId);
      
      setConversationTitle(title);
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  // Save messages to sessionStorage when they change (for non-logged in users)
  useEffect(() => {
    if (messages.length > 0 && !user) {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages));
      sessionStorage.setItem('chatUserMessageCount', String(userMessageCountRef.current));
    }
  }, [messages, user]);

  // Save pending message and banner state
  useEffect(() => {
    if (pendingMessage) {
      sessionStorage.setItem('chatPendingMessage', pendingMessage);
    }
    sessionStorage.setItem('chatShowRegisterBanner', String(showRegisterBanner));
  }, [pendingMessage, showRegisterBanner]);

  // Restore messages from sessionStorage on mount (for non-logged in users)
  // NOTE: We ask the user whether to continue or start fresh to avoid accidental carry-over.
  useEffect(() => {
    if (user || currentConversationId) return; // Don't restore if logged in or loading a conversation

    const savedMessages = sessionStorage.getItem('chatMessages');
    if (!savedMessages) return;

    try {
      const parsed: Message[] = JSON.parse(savedMessages).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));

      // Only restore if there's a meaningful conversation (at least 2 messages)
      if (!parsed || parsed.length < 2) {
        sessionStorage.removeItem('chatMessages');
        sessionStorage.removeItem('chatPendingMessage');
        sessionStorage.removeItem('chatShowRegisterBanner');
        sessionStorage.removeItem('chatUserMessageCount');
        return;
      }

      // Auto-restore without asking for anonymous users
      setMessages(parsed);
      messagesRef.current = parsed;

      const savedPendingMessage = sessionStorage.getItem('chatPendingMessage');
      const savedBannerState = sessionStorage.getItem('chatShowRegisterBanner');
      const savedUserMessageCount = sessionStorage.getItem('chatUserMessageCount');

      if (savedPendingMessage) {
        setPendingMessage(savedPendingMessage);
      }
      if (savedBannerState === 'true') {
        setShowRegisterBanner(true);
      }
      userMessageCountRef.current = savedUserMessageCount ? parseInt(savedUserMessageCount, 10) : 0;

    } catch (e) {
      sessionStorage.removeItem('chatMessages');
      sessionStorage.removeItem('chatPendingMessage');
      sessionStorage.removeItem('chatShowRegisterBanner');
      sessionStorage.removeItem('chatUserMessageCount');
    }
  }, []);

  // Handle payment success from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      toast({
        title: "¡Pago exitoso!",
        description: "Ahora puedes guardar itinerarios ilimitados",
      });
      navigate('/chat', { replace: true });
    }
  }, [location.search]);

  useEffect(() => {
    if (initialMessage && messages.length === 0 && !conversationIdFromState) {
      sendMessage(initialMessage);
    }
  }, []);

  useEffect(() => {
    if (htmlContent) {
      setShowContentOnMobile(true);
    }
  }, [htmlContent]);

  // Check trip count when user is available or when returning to the page
  useEffect(() => {
    if (user && !authLoading) {
      checkTripCount();
    }
  }, [user, authLoading]);

  // Re-check trip count when page gains focus (user might have deleted a trip)
  useEffect(() => {
    const handleFocus = () => {
      if (user && htmlContent && !tripSaved) {
        checkTripCount();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, htmlContent, tripSaved]);

  const checkTripCount = async () => {
    if (!user) return;
    
    setCheckingTripCount(true);
    try {
      const { count, error } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) throw error;
      setTripCount(count || 0);
    } catch (error) {
      console.error("Error checking trip count:", error);
    } finally {
      setCheckingTripCount(false);
    }
  };

  // Auto-save when itinerary arrives and user is logged in
  useEffect(() => {
    if (htmlContent && !tripSaved && !authLoading && !checkingTripCount && user) {
      // Check if under limit before auto-saving
      if (tripCount < MAX_SAVED_TRIPS) {
        saveTrip();
        setLimitNotificationShown(false);
      } else if (!limitNotificationShown) {
        // Show notification that limit is reached but keep itinerary visible (only once)
        setLimitNotificationShown(true);
        toast({
          title: "Límite de viajes alcanzado",
          description: `Tienes ${MAX_SAVED_TRIPS} viajes guardados. Ve a "Mis Viajes" para eliminar uno y poder guardar este.`,
          variant: "destructive",
          duration: 8000,
        });
      }
    } else if (htmlContent && !tripSaved && !authLoading && !user) {
      setShowAuthDialog(true);
    }
  }, [htmlContent, user, authLoading, tripSaved, tripCount, checkingTripCount, limitNotificationShown]);

  // Auto-save when user logs in after seeing itinerary
  useEffect(() => {
    if (user && htmlContent && !tripSaved && showAuthDialog) {
      setShowAuthDialog(false);
      checkTripCount();
    }
  }, [user, htmlContent, tripSaved, showAuthDialog]);

  // Send pending message when user logs in
  useEffect(() => {
    if (user && pendingMessage && !authLoading) {
      setShowRegisterBanner(false);
      sessionStorage.removeItem('chatPendingMessage');
      sessionStorage.setItem('chatShowRegisterBanner', 'false');
      sendMessage(pendingMessage, true);
      setPendingMessage(null);
    }
  }, [user, pendingMessage, authLoading]);

  const saveTrip = async () => {
    if (!user || !htmlContent || tripSaved) return;
    
    // Check if already at limit
    if (tripCount >= MAX_SAVED_TRIPS) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${MAX_SAVED_TRIPS} viajes guardados. Elimina alguno para guardar más.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Use itinerary data title or fallback to first message
      const firstUserMessage = messages.find(m => m.role === "user")?.content || "Mi viaje";
      const tripTitle = itineraryData?.resumen?.titulo || conversationTitle || `Viaje: ${firstUserMessage.substring(0, 50)}${firstUserMessage.length > 50 ? '...' : ''}`;
      
      // Use captured trip data from the conversation
      const startDate = tripDate || new Date().toISOString().split('T')[0];
      const endDate = tripEndDate || (() => {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + 7);
        return endDateObj.toISOString().split('T')[0];
      })();
      
      // Get travelers count - default to 1
      const travelersCount = 1;
      
      const { data: trip, error } = await supabase.from("trips").insert({
        user_id: user.id,
        title: tripTitle,
        origin: tripOrigin || "Por definir",
        destination: tripDestination || conversationTitle || "Por definir", 
        start_date: startDate,
        end_date: endDate,
        budget: tripBudget || itineraryData?.resumen?.presupuestoEstimado || null,
        travelers: travelersCount,
        preferences: { 
          itinerary_html: htmlContent,
          itinerary_data: itineraryData 
        },
      }).select().single();

      if (error) throw error;

      // Save itinerary days if available
      if (trip && itineraryData?.itinerario && itineraryData.itinerario.length > 0) {
        const daysData = itineraryData.itinerario.map((dia) => ({
          trip_id: trip.id,
          day_number: dia.dia,
          date: dia.fecha,
          summary: dia.resumenDia || null,
          activities: dia.actividades || [],
        }));

        await supabase.from('itinerary_days').insert(daysData);
      }

      // Link trip to conversation
      if (currentConversationId && trip) {
        await supabase
          .from('conversations')
          .update({ trip_id: trip.id })
          .eq('id', currentConversationId);
      }

      setTripSaved(true);
      setTripCount(prev => prev + 1);
      toast({
        title: "¡Itinerario guardado!",
        description: "Puedes verlo en 'Mis viajes'",
      });
    } catch (error) {
      console.error("Error saving trip:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el itinerario",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment');
      
      if (error) throw error;
      
      if (data?.url) {
        // Use location.href instead of window.open to avoid popup blockers on mobile
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago. Intenta de nuevo.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  const sendMessage = async (messageText: string, isFromPending = false) => {
    if (!messageText.trim() || isLoading) return;

    const hasExistingItinerary = !!itineraryData;
    const isAckOnly = /^\s*(gracias|ok|vale|perfecto|listo|genial|bien|thanks|thx)\b/i.test(messageText.trim());
    const shouldTryRegenerate = hasExistingItinerary && !isAckOnly;

    // Registration gate - show banner after first message for non-logged users
    const currentUserMessages = userMessageCountRef.current;
    if (currentUserMessages >= 1 && !user && !isFromPending) {
      setPendingMessage(messageText);
      setInputValue("");
      setShowRegisterBanner(true);
      return;
    }

    // Create conversation if user is logged in and no conversation exists
    let convId = currentConversationId;
    if (user && !convId) {
      convId = await createConversation();
      setCurrentConversationId(convId);
    }

    userMessageCountRef.current += 1;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage];
      messagesRef.current = next;
      return next;
    });
    setInputValue("");
    setIsLoading(true);

    // Save user message to DB
    if (convId) {
      await saveMessage(convId, "user", messageText);
    }

    try {
      // Build message history for context
      const messageHistory = messagesRef.current.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Check if we already have an itinerary - if so, pass current trip data for modifications
      const existingTripData = itineraryData ? {
        destino: tripDestination,
        origen: tripOrigin,
        fechaSalida: tripDate,
        fechaRegreso: tripEndDate,
        pasajeros: tripTravelers,
        presupuesto: tripBudget,
      } : null;

      const response = await fetch(CHAT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messageHistory,
          userLocation: {
            country: country || null,
            state: state || null,
            city: city || null,
          },
          existingTripData,
          hasItinerary: !!itineraryData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error("Demasiadas solicitudes. Intenta en unos momentos.");
        }
        if (response.status === 402) {
          throw new Error("Servicio temporalmente no disponible.");
        }
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("TravesIA response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      let responseText = data.text || "";
      let receivedHtml: string | undefined;

      // Handle status complete - generate itinerary
      if (data.status === "complete") {
        try {
          // Parse the trip data from text field - clean markdown if present
          let textToParse = data.text;
          if (typeof textToParse === "string") {
            // Clean markdown code blocks
            textToParse = textToParse.trim();
            if (textToParse.startsWith("```json")) {
              textToParse = textToParse.slice(7);
            } else if (textToParse.startsWith("```")) {
              textToParse = textToParse.slice(3);
            }
            if (textToParse.endsWith("```")) {
              textToParse = textToParse.slice(0, -3);
            }
            textToParse = textToParse.trim();
          }
          const tripData = typeof textToParse === "string" ? JSON.parse(textToParse) : textToParse;
          console.log("Trip data complete:", tripData);

          // Set trip metadata
          if (tripData.destino) {
            setTripDestination(tripData.destino);
            setConversationTitle(`Viaje a ${tripData.destino}`);
          }
          if (tripData.origen) {
            setTripOrigin(tripData.origen);
          }
          if (tripData.fechaSalida) {
            setTripDate(tripData.fechaSalida);
          }
          if (tripData.fechaRegreso) {
            setTripEndDate(tripData.fechaRegreso);
          }
          if (tripData.pasajeros) {
            setTripTravelers(tripData.pasajeros);
          }
          if (tripData.presupuesto) {
            setTripBudget(tripData.presupuesto);
          }

          // Show generating message based on detected language - mention it may take a few minutes
          const detectedLanguage = tripData.language || "es";
          const generatingMessages: Record<string, string> = {
            es: "¡Perfecto! Tengo toda la información. Estoy preparando tu itinerario personalizado. Esto puede tomar 1-2 minutos, pero valdrá la pena... ✨",
            en: "Perfect! I have all the information. I'm preparing your personalized itinerary. This may take 1-2 minutes, but it will be worth it... ✨",
            fr: "Parfait! J'ai toutes les informations. Je prépare votre itinéraire personnalisé. Cela peut prendre 1-2 minutes, mais ça en vaudra la peine... ✨",
            de: "Perfekt! Ich habe alle Informationen. Ich bereite deine personalisierte Reiseroute vor. Das kann 1-2 Minuten dauern, aber es wird sich lohnen... ✨",
            pt: "Perfeito! Tenho todas as informações. Estou preparando seu itinerário personalizado. Isso pode levar 1-2 minutos, mas vai valer a pena... ✨",
            it: "Perfetto! Ho tutte le informazioni. Sto preparando il tuo itinerario personalizzato. Potrebbe richiedere 1-2 minuti, ma ne varrà la pena... ✨",
          };
          
          const generatingMessage: Message = {
            role: "assistant",
            content: generatingMessages[detectedLanguage] || generatingMessages.es,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const next = [...prev, generatingMessage];
            messagesRef.current = next;
            return next;
          });

          // Call generate-itinerary function with retry logic for cold starts
          const { data: session } = await supabase.auth.getSession();
          
          const invokeWithRetry = async (retries = 2): Promise<any> => {
            try {
              const response = await supabase.functions.invoke("generate-itinerary", {
                body: {
                  description: hasExistingItinerary
                    ? `${tripData.estiloViaje || "viaje"} | Cambios solicitados: ${messageText}`
                    : (tripData.estiloViaje || "viaje cultural"),
                  origin: tripData.origen,
                  destination: tripData.destino,
                  startDate: tripData.fechaSalida,
                  endDate: tripData.fechaRegreso,
                  travelers: tripData.pasajeros || 1,
                  budget: tripData.presupuesto || null,
                  language: detectedLanguage,
                },
              });
              
              // If we get an error and have retries left, try again
              if (response.error && retries > 0) {
                console.log(`Retrying generate-itinerary, attempts left: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s before retry
                return invokeWithRetry(retries - 1);
              }
              
              return response;
            } catch (err) {
              if (retries > 0) {
                console.log(`Error caught, retrying generate-itinerary, attempts left: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                return invokeWithRetry(retries - 1);
              }
              throw err;
            }
          };
          
          const itineraryResponse = await invokeWithRetry();

          if (itineraryResponse.error) {
            throw new Error(itineraryResponse.error.message || "Error generando itinerario");
          }

          const itinerary = itineraryResponse.data?.itinerary;
          if (itinerary) {
            console.log("Generated itinerary:", itinerary);
            const generatedHtml = generateItineraryHtml(itinerary);
            setHtmlContent(generatedHtml);
            setItineraryData(itinerary as ItineraryData);
            receivedHtml = generatedHtml;
            responseText = itinerary.resumen?.descripcion || "¡Tu itinerario está listo!";
            
            // Update conversation title with itinerary title
            if (itinerary.resumen?.titulo) {
              setConversationTitle(itinerary.resumen.titulo);
              if (convId) {
                await updateConversationTitle(convId, itinerary.resumen.titulo, tripData.destino);
              }
            }
          }
        } catch (parseError) {
          console.error("Error processing complete status:", parseError);
          responseText = "Hubo un error al generar el itinerario. Por favor, intenta de nuevo.";
        }
      } else {
        // Status incomplete - show the text response
        responseText = data.text || "¿En qué puedo ayudarte?";

        // If the user already has an itinerary and is requesting changes, regenerate using the current trip data
        if (
          shouldTryRegenerate &&
          tripDestination &&
          tripOrigin &&
          tripDate &&
          tripEndDate
        ) {
          try {
            const updatingMessages: Record<string, string> = {
              es: "Perfecto, voy a ajustar tu itinerario con ese cambio. Dame 1-2 minutos... ✨",
              en: "Got it — I'll update your itinerary with that change. Give me 1-2 minutes... ✨",
              fr: "Parfait — je mets à jour votre itinéraire avec ce changement. Donnez-moi 1-2 minutes... ✨",
              de: "Alles klar — ich aktualisiere deine Reiseroute. Gib mir 1-2 Minuten... ✨",
              pt: "Perfeito — vou atualizar seu itinerário com essa mudança. Me dá 1-2 minutos... ✨",
              it: "Perfetto — aggiorno il tuo itinerario con questa modifica. Dammi 1-2 minuti... ✨",
            };

            const updatingMessage: Message = {
              role: "assistant",
              content: updatingMessages[language] || updatingMessages.es,
              timestamp: new Date(),
            };
            setMessages((prev) => {
              const next = [...prev, updatingMessage];
              messagesRef.current = next;
              return next;
            });

            const itineraryResponse = await supabase.functions.invoke("generate-itinerary", {
              body: {
                description: `Cambios solicitados: ${messageText}`,
                origin: tripOrigin,
                destination: tripDestination,
                startDate: tripDate,
                endDate: tripEndDate,
                travelers: tripTravelers || 1,
                budget: tripBudget || null,
                language: language || "es",
              },
            });

            if (!itineraryResponse.error) {
              const itinerary = itineraryResponse.data?.itinerary;
              if (itinerary) {
                const generatedHtml = generateItineraryHtml(itinerary);
                setHtmlContent(generatedHtml);
                setItineraryData(itinerary as ItineraryData);
                receivedHtml = generatedHtml;
              }
            }
          } catch (e) {
            console.warn("Failed to regenerate itinerary from follow-up:", e);
          }
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        htmlContent: receivedHtml,
      };

      setMessages((prev) => {
        // If we showed a generating/updating message, replace it
        const lastMsg = prev[prev.length - 1];
        const isGeneratingPlaceholder =
          lastMsg?.role === "assistant" &&
          /(Generando tu itinerario|preparando tu itinerario|actualizando tu itinerario)/i.test(lastMsg.content);

        const next = isGeneratingPlaceholder
          ? [...prev.slice(0, -1), assistantMessage]
          : [...prev, assistantMessage];

        messagesRef.current = next;
        return next;
      });

      // Save assistant message to DB
      if (convId) {
        await saveMessage(convId, "assistant", responseText, receivedHtml);
        
        // Update conversation title if not set
        if (!conversationTitle && messages.length === 0) {
          const shortTitle = messageText.length > 50 
            ? messageText.substring(0, 50) + '...' 
            : messageText;
          await updateConversationTitle(convId, shortTitle);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorDetails = error instanceof Error ? error.message : "Error desconocido";
      const errorMessage: Message = {
        role: "assistant",
        content: `Lo siento, hubo un error al procesar tu mensaje. (${errorDetails})`,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const next = [...prev, errorMessage];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleNewChat = () => {
    // Cancel any in-flight conversation loads and clear everything
    loadConversationSeqRef.current += 1;
    messagesRef.current = [];

    // Clear everything and start fresh
    setMessages([]);
    setHtmlContent(null);
    setItineraryData(null);
    setCurrentConversationId(null);
    setConversationTitle(null);
    setTripDate(null);
    setTripEndDate(null);
    setTripDestination(null);
    setTripOrigin(null);
    setTripBudget(null);
    setTripTravelers(1);
    setTripImage(null);
    setTripSaved(false);
    setLimitNotificationShown(false);
    setShowRegisterBanner(false);
    setPendingMessage(null);
    userMessageCountRef.current = 0;
    sessionStorage.removeItem('chatMessages');
    sessionStorage.removeItem('chatPendingMessage');
    sessionStorage.removeItem('chatShowRegisterBanner');
    sessionStorage.removeItem('chatUserMessageCount');
    setShowSidebar(false);
  };

  const handleSelectConversation = (convId: string) => {
    // Cancel any in-flight loads and clear current state completely
    loadConversationSeqRef.current += 1;
    messagesRef.current = [];

    setMessages([]);
    setHtmlContent(null);
    setItineraryData(null);
    setTripDate(null);
    setTripEndDate(null);
    setTripDestination(null);
    setTripOrigin(null);
    setTripBudget(null);
    setTripTravelers(1);
    setTripImage(null);
    setTripSaved(false);
    setLimitNotificationShown(false);
    setShowRegisterBanner(false);
    setPendingMessage(null);
    userMessageCountRef.current = 0;

    // Also clear any anonymous-session draft to avoid leakage
    sessionStorage.removeItem('chatMessages');
    sessionStorage.removeItem('chatPendingMessage');
    sessionStorage.removeItem('chatShowRegisterBanner');
    sessionStorage.removeItem('chatUserMessageCount');

    // Load selected conversation
    setCurrentConversationId(convId);
    loadConversation(convId);
    setShowSidebar(false);
  };

  const restoreAnonymousDraft = () => {
    const draft = draftToRestoreRef.current;
    setResumeDraftDialogOpen(false);

    if (!draft) return;

    setMessages(draft.messages);
    messagesRef.current = draft.messages;

    if (draft.pendingMessage) {
      setPendingMessage(draft.pendingMessage);
    }

    if (draft.showRegisterBanner && !user) {
      setShowRegisterBanner(true);
    }

    userMessageCountRef.current = draft.userMessageCount || 0;
    draftToRestoreRef.current = null;
  };

  const discardAnonymousDraft = () => {
    draftToRestoreRef.current = null;
    setResumeDraftDialogOpen(false);
    handleNewChat();
  };

  // Show save button when itinerary exists, not saved, and there's room now
  const canShowSaveButton = htmlContent && !tripSaved && user && tripCount < MAX_SAVED_TRIPS && !isSaving;

  return (
    <div className="h-screen flex">
      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Tu itinerario está listo!</DialogTitle>
            <DialogDescription>
              Para guardar este itinerario en tu perfil y acceder a él más tarde, necesitas iniciar sesión o registrarte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Ver sin guardar
            </Button>
            <Button onClick={() => navigate('/auth', { state: { returnTo: '/chat' } })}>
              Iniciar sesión
            </Button>
            <Button variant="secondary" onClick={() => navigate('/register', { state: { returnTo: '/chat' } })}>
              Registrarme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume / new chat dialog for anonymous drafts */}
      <Dialog open={resumeDraftDialogOpen} onOpenChange={setResumeDraftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Continuar tu chat anterior?</DialogTitle>
            <DialogDescription>
              Detecté un chat guardado en este dispositivo. Puedes continuar donde lo dejaste o empezar uno nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={discardAnonymousDraft}>
              Empezar nuevo
            </Button>
            <Button onClick={restoreAnonymousDraft}>Continuar chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog removed - no longer needed */}

      {/* Sidebar for conversations - Desktop */}
      {user && showDesktopSidebar && (
        <div className="hidden lg:flex w-72 border-r border-border bg-gray-50 flex-col">
          <ConversationList 
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            selectedId={currentConversationId || undefined}
            onHideSidebar={() => setShowDesktopSidebar(false)}
          />
        </div>
      )}

      {/* Chat Section - 35% width */}
      <div className={`${showContentOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-[40%] flex-col bg-gradient-to-b from-gray-50 to-white flex-shrink-0`}>
        {/* Header with branding */}
        <div className="bg-white shadow-sm p-4 flex items-center gap-3">
          {/* Left side: Back arrow + Logo */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <img src={logoFull} alt="travesIA" className="h-8" />
          </Link>
          
          {tripDestination && (
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]">
              {tripDestination}
            </span>
          )}
          
          <div className="flex-1" />
          
          {/* Right side: Chat sidebar trigger + Save button */}
          {user && (
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden shrink-0 hover:bg-gray-100"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Conversaciones</SheetTitle>
                </SheetHeader>
                <ConversationList 
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  selectedId={currentConversationId || undefined}
                />
              </SheetContent>
            </Sheet>
          )}
          
          {/* Auto-saving indicator */}
          {isSaving && (
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </span>
          )}
          {tripSaved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Guardado
            </span>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Welcome message if no messages yet */}
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <img src={logoIcon} alt="travesIA" className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Hola! Soy tu asistente de viajes</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Cuéntame sobre tu viaje ideal y te ayudaré a crear el itinerario perfecto.
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className="animate-fade-in">
                <div
                  className={`flex items-end gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <img src={logoIcon} alt="travesIA" className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white shadow-sm border border-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs mt-1.5 opacity-60">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Register Banner - blocks sending more messages */}
            {showRegisterBanner && !user && (
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl py-6 px-4 text-center shadow-xl border border-slate-100 mx-2">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  {/* Logo icon */}
                  <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-primary/10 to-blue-100 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md border border-primary/10">
                    <img src={logoIcon} alt="travesIA" className="w-8 h-8" />
                  </div>
                  
                  <h3 className="font-urbanist font-extrabold text-lg sm:text-xl mb-2 text-foreground flex items-center justify-center gap-1.5 flex-wrap">
                    {t('joinTravesia').replace('travesIA!', '')} <img src={logoFull} alt="travesIA" className="h-5 sm:h-6 inline-block" />!
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
                    {t('joinDescription')}
                  </p>
                  
                  <div className="flex flex-col gap-2 justify-center items-center w-full">
                    <Button 
                      onClick={() => navigate('/register', { state: { returnTo: '/chat' } })}
                      className="bg-primary text-white hover:bg-primary/90 font-bold px-5 py-2 h-10 rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm w-full max-w-[200px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {t('createFreeAccount')}
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth', { state: { returnTo: '/chat' } })}
                      variant="outline"
                      className="text-foreground hover:bg-slate-50 font-medium px-4 py-2 h-10 rounded-full border-slate-200 hover:border-primary/30 transition-all duration-300 text-sm w-full max-w-[200px]"
                    >
                      {t('alreadyHaveAccount')}
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground mt-4">
                    ✨ {t('freeFeatures')}
                  </p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <p className="text-sm text-gray-600">{t('writing')}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-2 flex items-end gap-2">
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full shrink-0 mb-0.5"
                disabled={showRegisterBanner && !user}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                placeholder={showRegisterBanner && !user ? t('registerToContinue') : t('placeholder')}
                className="flex-1 bg-transparent border-0 focus:outline-none text-base md:text-sm px-2 resize-none min-h-[36px] max-h-[120px] py-2"
                disabled={showRegisterBanner && !user}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className={`rounded-full shrink-0 mb-0.5 ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                onClick={toggleRecording}
                disabled={isProcessing || (showRegisterBanner && !user)}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim() || (showRegisterBanner && !user)}
                className="bg-primary hover:bg-primary/90 text-white rounded-full shrink-0 mb-0.5"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Disclaimer message */}
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t('disclaimer')}
            </p>
          </form>
        </div>

        {/* Floating button to show sidebar - bottom right */}
        {user && !showDesktopSidebar && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDesktopSidebar(true)}
            className="hidden lg:flex fixed bottom-6 right-6 z-50 bg-white shadow-lg hover:bg-gray-50 border-gray-200"
            title="Mostrar historial"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Itinerary Section - Full screen on mobile, 65% on desktop */}
      <div className={`${showContentOnMobile ? 'fixed inset-0 z-50 flex' : 'hidden md:flex'} w-full md:relative md:flex-1 bg-background md:bg-primary items-stretch md:items-center justify-center md:p-6 overflow-hidden`}>
        {/* Decorative background elements - only on desktop */}
        <div className="hidden md:block absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="hidden md:block absolute bottom-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl" />
        <div className="hidden md:block absolute top-1/3 left-1/4 w-2 h-2 bg-white/20 rounded-full" />
        <div className="hidden md:block absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full" />
        
        {/* Mobile close button - floating */}
        {showContentOnMobile && (
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowContentOnMobile(false)}
            className="md:hidden fixed top-4 right-4 z-[60] bg-black/60 hover:bg-black/80 text-white shadow-lg backdrop-blur-sm rounded-full h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {itineraryData ? (
          <div className="w-full h-full bg-background md:bg-white md:rounded-lg md:shadow-lg overflow-hidden relative">
            {/* Save banner when there's room to save */}
            {canShowSaveButton && (
              <div className="absolute top-4 right-4 z-20">
                <Button
                  onClick={saveTrip}
                  disabled={isSaving}
                  className="rounded-full shadow-lg gap-2"
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar itinerario
                </Button>
              </div>
            )}
            <ItineraryPanel 
              data={itineraryData}
              destination={tripDestination || undefined}
              origin={tripOrigin || undefined}
              startDate={tripDate || undefined}
              endDate={tripEndDate || undefined}
              travelers={tripTravelers}
              budget={tripBudget || undefined}
              customImage={tripImage || undefined}
            />
          </div>
        ) : htmlContent ? (
          <div className="w-full h-full bg-background md:bg-white md:rounded-lg md:shadow-lg overflow-auto relative">
            <div>
              {/* Itinerary Header with image + map */}
              <ItineraryHeader 
                title={conversationTitle || "Tu viaje"}
                destination={tripDestination || undefined}
                origin={tripOrigin || undefined}
                startDate={tripDate || undefined}
                endDate={tripEndDate || undefined}
                travelers={tripTravelers}
                customImage={tripImage || undefined}
              />
              
              {/* HTML Content - Sanitized to prevent XSS */}
              <div className="p-4 md:p-6 pt-0">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }} />
              </div>
            </div>
          </div>
        ) : (
          <LoadingItinerary destination={tripDestination || undefined} t={t} />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
