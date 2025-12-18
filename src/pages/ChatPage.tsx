import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, X, Save, Lock, CreditCard, Mic, Paperclip, Loader2, Sparkles, Menu, MessageCircle, PanelLeftClose, PanelLeft } from "lucide-react";
import ItineraryHeader from "@/components/ItineraryHeader";
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

interface ItineraryActivity {
  hora: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  costoAprox: number;
}

interface ItineraryDay {
  dia: number;
  fecha: string;
  resumenDia: string;
  actividades: ItineraryActivity[];
}

interface ItineraryData {
  resumen: {
    titulo: string;
    descripcion: string;
    presupuestoEstimado: number;
    duracion: number;
    highlights: string[];
  };
  transporte: {
    vuelos: Array<{
      aerolinea: string;
      origen: string;
      destino: string;
      fechaSalida: string;
      fechaLlegada: string;
      precio: number;
    }>;
    transporteLocal: string;
  };
  alojamiento: {
    recomendacion: string;
    zona: string;
    costoPorNoche: number;
    opciones: string[];
  };
  itinerario: ItineraryDay[];
  comentarios: {
    consejos: string[];
    advertencias: string[];
    mejorEpoca: string;
  };
}

const generateItineraryHtml = (data: ItineraryData): string => {
  const { resumen, transporte, alojamiento, itinerario, comentarios } = data;
  
  const getHoraLabel = (hora: string) => {
    switch (hora) {
      case 'morning': return '🌅 Mañana';
      case 'afternoon': return '☀️ Tarde';
      case 'evening': return '🌙 Noche';
      default: return hora;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%; color: #1a1a2e;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">${resumen.titulo}</h1>
        <p style="margin: 0; opacity: 0.9; font-size: 16px;">${resumen.descripcion}</p>
        <div style="display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap;">
          <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px;">📅 ${resumen.duracion} días</span>
          <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 14px;">💰 ~$${resumen.presupuestoEstimado?.toLocaleString()} USD</span>
        </div>
      </div>

      <!-- Highlights -->
      ${resumen.highlights?.length ? `
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
          <h3 style="margin: 0 0 16px 0; font-size: 18px;">✈️ Transporte</h3>
          ${transporte.vuelos.map(v => `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
              <div style="font-weight: 600;">${v.aerolinea}</div>
              <div style="font-size: 14px; color: #666;">${v.origen} → ${v.destino}</div>
              <div style="font-size: 14px; color: #667eea; margin-top: 4px;">$${v.precio?.toLocaleString()} USD</div>
            </div>
          `).join('')}
          ${transporte.transporteLocal ? `<p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">🚇 ${transporte.transporteLocal}</p>` : ''}
        </div>
      ` : ''}

      <!-- Alojamiento -->
      ${alojamiento ? `
        <div style="background: white; border: 1px solid #e0e0e0; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px;">🏨 Alojamiento</h3>
          <div style="font-weight: 600; font-size: 16px;">${alojamiento.recomendacion}</div>
          <div style="font-size: 14px; color: #666; margin-top: 4px;">📍 ${alojamiento.zona}</div>
          <div style="font-size: 14px; color: #667eea; margin-top: 4px;">$${alojamiento.costoPorNoche}/noche</div>
          ${alojamiento.opciones?.length ? `
            <div style="margin-top: 12px;">
              <span style="font-size: 13px; color: #888;">Otras opciones: ${alojamiento.opciones.join(', ')}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Itinerario -->
      <h2 style="font-size: 22px; margin: 32px 0 16px 0;">📋 Itinerario día a día</h2>
      ${itinerario.map(day => `
        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 12px; margin-bottom: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px;">
            <div style="font-weight: 700; font-size: 18px;">Día ${day.dia}</div>
            <div style="font-size: 14px; opacity: 0.9;">${formatDate(day.fecha)}</div>
            <div style="font-size: 14px; margin-top: 4px; opacity: 0.8;">${day.resumenDia}</div>
          </div>
          <div style="padding: 16px;">
            ${day.actividades.map(act => `
              <div style="border-left: 3px solid #667eea; padding-left: 16px; margin-bottom: 16px;">
                <div style="font-size: 12px; color: #888; margin-bottom: 4px;">${getHoraLabel(act.hora)}</div>
                <div style="font-weight: 600; font-size: 16px;">${act.titulo}</div>
                <div style="font-size: 14px; color: #666; margin-top: 4px;">${act.descripcion}</div>
                <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 13px; color: #888;">
                  <span>📍 ${act.ubicacion}</span>
                  ${act.costoAprox > 0 ? `<span>💰 $${act.costoAprox}</span>` : '<span>🆓 Gratis</span>'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showRegisterBanner, setShowRegisterBanner] = useState(false);
  const userMessageCountRef = useRef(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  
  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationIdFromState);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [tripDate, setTripDate] = useState<string | null>(null);

  const WEBHOOK_URL = "https://youtube-n8n.c5mnsm.easypanel.host/webhook/711a4b1d-3d85-4831-9cc2-5ce273881cd2";

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
    try {
      // Load conversation details
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle();

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

      if (msgsError) throw msgsError;

      const loadedMessages: Message[] = (msgs || []).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        htmlContent: m.html_content || undefined,
      }));

      setMessages(loadedMessages);
      userMessageCountRef.current = loadedMessages.filter(m => m.role === 'user').length;

      // Check if there's HTML content in the last assistant message
      const lastAssistantMsg = [...loadedMessages].reverse().find(m => m.role === 'assistant' && m.htmlContent);
      if (lastAssistantMsg?.htmlContent) {
        setHtmlContent(lastAssistantMsg.htmlContent);
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
  useEffect(() => {
    if (user || currentConversationId) return; // Don't restore if logged in or loading a conversation
    
    const savedMessages = sessionStorage.getItem('chatMessages');
    const savedPendingMessage = sessionStorage.getItem('chatPendingMessage');
    const savedBannerState = sessionStorage.getItem('chatShowRegisterBanner');
    const savedUserMessageCount = sessionStorage.getItem('chatUserMessageCount');
    
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(parsed);
    }
    
    if (savedPendingMessage) {
      setPendingMessage(savedPendingMessage);
    }
    
    if (savedBannerState === 'true' && !user) {
      setShowRegisterBanner(true);
    }
    
    if (savedUserMessageCount) {
      userMessageCountRef.current = parseInt(savedUserMessageCount, 10);
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

  // Check trip count when user is available
  useEffect(() => {
    if (user && !authLoading) {
      checkTripCount();
    }
  }, [user, authLoading]);

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
      }
    } else if (htmlContent && !tripSaved && !authLoading && !user) {
      setShowAuthDialog(true);
    }
  }, [htmlContent, user, authLoading, tripSaved, tripCount, checkingTripCount]);

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
      const firstUserMessage = messages.find(m => m.role === "user")?.content || "Mi viaje";
      const tripTitle = conversationTitle || `Viaje: ${firstUserMessage.substring(0, 50)}${firstUserMessage.length > 50 ? '...' : ''}`;
      
      // Use tripDate from webhook or default to today
      const startDate = tripDate || new Date().toISOString().split('T')[0];
      // Calculate end date as 7 days after start date
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 7);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      const { data: trip, error } = await supabase.from("trips").insert({
        user_id: user.id,
        title: tripTitle,
        origin: "Por definir",
        destination: conversationTitle || "Por definir", 
        start_date: startDate,
        end_date: endDate,
        travelers: 1,
        preferences: { itinerary_html: htmlContent },
      }).select().single();

      if (error) throw error;

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

    const currentUserMessages = userMessageCountRef.current;
    
    // If this would be 2nd message and user not logged in, block webhook
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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Save user message to DB
    if (convId) {
      await saveMessage(convId, "user", messageText);
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
          user_id: user?.id || null,
          currency: currency,
          conversationId: convId || null,
          location: {
            country: country || null,
            state: state || null,
            city: city || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const responseBody = await response.text();
      console.log("Webhook raw response:", responseBody);
      
      let responseText = "";
      let receivedHtml: string | undefined;
      let receivedTitle: string | undefined;
      
      try {
        let data = JSON.parse(responseBody);
        
        // Handle if response is an array
        if (Array.isArray(data)) {
          data = data[0];
        }
        
        console.log("Parsed data:", data);
        
        // Extract title from webhook response (support both 'title' and 'titulo')
        if (data.title) {
          receivedTitle = data.title.trim();
          setConversationTitle(receivedTitle);
        } else if (data.titulo) {
          receivedTitle = data.titulo.trim();
          setConversationTitle(receivedTitle);
        } else if (data.resumen?.titulo) {
          receivedTitle = data.resumen.titulo.trim();
          setConversationTitle(receivedTitle);
        }
        
        // Extract date from webhook response (Fecha field or from itinerary)
        if (data.Fecha) {
          setTripDate(data.Fecha);
          console.log("Trip date received:", data.Fecha);
        } else if (data.itinerario?.[0]?.fecha) {
          setTripDate(data.itinerario[0].fecha);
          console.log("Trip date from itinerary:", data.itinerario[0].fecha);
        }
        
        // Check if it's a structured itinerary JSON (has resumen, itinerario, etc.)
        if (data.resumen && data.itinerario && Array.isArray(data.itinerario)) {
          console.log("Found structured itinerary JSON");
          const generatedHtml = generateItineraryHtml(data);
          setHtmlContent(generatedHtml);
          receivedHtml = generatedHtml;
          responseText = data.resumen?.descripcion || receivedTitle || "¡Itinerario generado!";
        }
        // Check for HTML content
        else if (data.html) {
          console.log("Found HTML content, length:", data.html.length);
          setHtmlContent(data.html);
          receivedHtml = data.html;
          responseText = data.message || data.text || receivedTitle || "Itinerario generado.";
        } else if (data.message) {
          responseText = data.message;
        } else if (data.text) {
          responseText = data.text;
        } else if (data.type === 'html_panel' && !data.html) {
          // Edge case: type indicates HTML but no html field
          responseText = "Respuesta recibida pero sin contenido HTML.";
        } else {
          responseText = "Mensaje recibido correctamente.";
        }
      } catch (parseError) {
        console.log("JSON parse failed:", parseError);
        if (responseBody && responseBody.trim().startsWith('<')) {
          setHtmlContent(responseBody);
          receivedHtml = responseBody;
          responseText = "Itinerario generado.";
        } else {
          responseText = responseBody || "Mensaje recibido correctamente.";
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        htmlContent: receivedHtml,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to DB
      if (convId) {
        await saveMessage(convId, "assistant", responseText, receivedHtml);
        
        // Update conversation title if received from webhook
        if (receivedTitle) {
          await updateConversationTitle(convId, receivedTitle);
        } else if (!conversationTitle && messages.length === 0) {
          // Use first user message as fallback title
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
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleNewChat = () => {
    // Clear everything and start fresh
    setMessages([]);
    setHtmlContent(null);
    setCurrentConversationId(null);
    setConversationTitle(null);
    setTripDate(null);
    setTripSaved(false);
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
    // Clear current state
    setMessages([]);
    setHtmlContent(null);
    setTripSaved(false);
    setShowRegisterBanner(false);
    setPendingMessage(null);
    userMessageCountRef.current = 0;
    
    // Load selected conversation
    setCurrentConversationId(convId);
    loadConversation(convId);
    setShowSidebar(false);
  };

  const canShowSaveButton = false; // Auto-save is now enabled, no manual save button needed

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

      {/* Payment Dialog removed - no longer needed */}

      {/* Sidebar for conversations - Desktop */}
      {user && showDesktopSidebar && (
        <div className="hidden lg:flex w-72 border-r border-border bg-gray-50 flex-col relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDesktopSidebar(false)}
            className="absolute top-3 right-3 z-10 hover:bg-gray-200"
            title="Ocultar historial"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
          <ConversationList 
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            selectedId={currentConversationId || undefined}
          />
        </div>
      )}

      {/* Chat Section */}
      <div className={`${showContentOnMobile ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gradient-to-b from-gray-50 to-white`}>
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
          
          {conversationTitle && (
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]">
              {conversationTitle}
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
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-3xl py-10 px-8 text-center shadow-2xl border border-slate-100">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-primary/20 rounded-full" />
                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/15 rounded-full" />
                
                <div className="relative z-10">
                  {/* Logo icon */}
                  <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-primary/10 to-blue-100 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-primary/10">
                    <img src={logoIcon} alt="travesIA" className="w-12 h-12" />
                  </div>
                  
                  <h3 className="font-urbanist font-extrabold text-2xl sm:text-3xl mb-3 text-foreground flex items-center justify-center gap-2 flex-wrap">
                    {t('joinTravesia').replace('travesIA!', '')} <img src={logoFull} alt="travesIA" className="h-7 sm:h-8 inline-block" />!
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                    {t('joinDescription')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button 
                      onClick={() => navigate('/register', { state: { returnTo: '/chat' } })}
                      className="bg-primary text-white hover:bg-primary/90 font-bold px-8 py-3 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('createFreeAccount')}
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth', { state: { returnTo: '/chat' } })}
                      variant="outline"
                      className="text-foreground hover:bg-slate-50 font-medium px-6 py-3 h-12 rounded-full border-slate-200 hover:border-primary/30 transition-all duration-300"
                    >
                      {t('alreadyHaveAccount')}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-6">
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

      {/* HTML Content Section */}
      <div className={`${showContentOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 lg:w-2/5 bg-primary items-center justify-center p-6 relative overflow-hidden`}>
        {/* Decorative background elements */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl" />
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/15 rounded-full" />
        
        {showContentOnMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowContentOnMobile(false)}
            className="md:hidden absolute top-4 left-4 z-10 bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {htmlContent ? (
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-auto relative">
            <div>
              {/* Itinerary Header with image + map */}
              <ItineraryHeader 
                title={conversationTitle || "Tu viaje"}
                destination={conversationTitle}
                startDate={tripDate || undefined}
                travelers={1}
              />
              
              {/* HTML Content */}
              <div className="p-6 pt-0">
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center px-8 relative z-10">
            <div className="mb-8 relative">
              <div className="w-28 h-28 mx-auto bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <img src={logoIcon} alt="travesIA" className="w-16 h-16 animate-pulse brightness-0 invert" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <div className="bg-orange-400 shadow-lg rounded-full p-2">
                  <Sparkles className="w-5 h-5 text-white animate-bounce" />
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-urbanist font-bold mb-4 text-white">
              {t('itineraryOnWay')}
            </h3>
            
            <div className="flex items-center justify-center gap-2 mb-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mx-auto w-fit">
              <img src={logoFull} alt="travesIA" className="h-5 brightness-0 invert" />
            </div>
            
            <p className="text-blue-100 text-base max-w-sm mx-auto leading-relaxed">
              {t('preparingPlan')}
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" />
              <span className="text-sm text-white/70">{t('waitingMessage')}</span>
              <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
