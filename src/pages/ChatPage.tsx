import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Send, ArrowLeft, X, Save, Lock, CreditCard, Mic, Paperclip, Loader2, Sparkles, Menu, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
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

const MAX_FREE_TRIPS = 2;

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
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
  
  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationIdFromState);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);

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

  // When itinerary arrives, check if user needs to login or pay
  useEffect(() => {
    if (htmlContent && !tripSaved && !authLoading && !checkingTripCount) {
      if (!user) {
        setShowAuthDialog(true);
      } else if (tripCount >= MAX_FREE_TRIPS) {
        setShowPaymentDialog(true);
      }
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

  const handleSaveAttempt = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    await checkTripCount();
    
    if (tripCount >= MAX_FREE_TRIPS) {
      setShowPaymentDialog(true);
      return;
    }

    saveTrip();
  };

  const saveTrip = async () => {
    if (!user || !htmlContent || tripSaved) return;

    setIsSaving(true);
    try {
      const firstUserMessage = messages.find(m => m.role === "user")?.content || "Mi viaje";
      const tripTitle = conversationTitle || `Viaje: ${firstUserMessage.substring(0, 50)}${firstUserMessage.length > 50 ? '...' : ''}`;
      
      const { data: trip, error } = await supabase.from("trips").insert({
        user_id: user.id,
        title: tripTitle,
        origin: "Por definir",
        destination: conversationTitle || "Por definir", 
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        window.open(data.url, '_blank');
        setShowPaymentDialog(false);
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
    } finally {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const responseBody = await response.text();
      let responseText = "";
      let receivedHtml: string | undefined;
      let receivedTitle: string | undefined;
      
      try {
        const data = JSON.parse(responseBody);
        
        // Extract title from webhook response
        if (data.titulo) {
          receivedTitle = data.titulo;
        }
        
        if (data.html) {
          setHtmlContent(data.html);
          receivedHtml = data.html;
          responseText = data.message || "Itinerario generado.";
        } else if (data.message) {
          responseText = data.message;
        } else if (data.text) {
          responseText = data.text;
        } else {
          responseText = "Mensaje recibido correctamente.";
        }
      } catch {
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

  const canShowSaveButton = htmlContent && !tripSaved;
  const needsPayment = user && tripCount >= MAX_FREE_TRIPS && !tripSaved;

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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Límite de itinerarios alcanzado
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>Has alcanzado el límite de <strong>{MAX_FREE_TRIPS} itinerarios gratuitos</strong>.</p>
              <p>Para guardar más itinerarios y desbloquear funciones premium, actualiza tu cuenta.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessingPayment}>
              Ver sin guardar
            </Button>
            <Button onClick={handlePayment} disabled={isProcessingPayment} className="gap-2">
              <CreditCard className="w-4 h-4" />
              {isProcessingPayment ? "Procesando..." : "Desbloquear Premium"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar for conversations - Desktop */}
      {user && (
        <div className="hidden lg:flex w-72 border-r border-border bg-gray-50 flex-col">
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
          {/* Mobile sidebar trigger */}
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
          
          {/* Save button - always show when itinerary exists */}
          {canShowSaveButton && (
            <Button
              onClick={handleSaveAttempt}
              disabled={isSaving || checkingTripCount}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
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
              <div className="bg-primary rounded-2xl py-8 px-6 text-white text-center">
                <h3 className="font-bold text-xl italic mb-2">¡Regístrate para continuar!</h3>
                <p className="text-sm text-white/90 mb-6">Para seguir generando tu itinerario personalizado, necesitas crear una cuenta gratuita</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/register', { state: { returnTo: '/chat' } })}
                    className="bg-white text-primary hover:bg-white/90 font-bold uppercase px-8 py-3 rounded-full"
                  >
                    REGÍSTRATE GRATIS
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth', { state: { returnTo: '/chat' } })}
                    variant="outline"
                    className="border-2 border-white text-primary bg-white hover:bg-white/90 font-medium px-8 py-3 rounded-full"
                  >
                    Ya tengo cuenta
                  </Button>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <p className="text-sm text-gray-600">Escribiendo...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-full p-2 flex items-center gap-2">
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full shrink-0"
                disabled={showRegisterBanner && !user}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={showRegisterBanner && !user ? "Regístrate para continuar..." : "Escribe tu mensaje..."}
                className="flex-1 bg-transparent border-0 focus:outline-none text-base md:text-sm px-2"
                disabled={showRegisterBanner && !user}
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
                className={`rounded-full shrink-0 ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
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
                className="bg-primary hover:bg-primary/90 text-white rounded-full shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* HTML Content Section */}
      <div className={`${showContentOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 lg:w-2/5 bg-primary items-center justify-center p-6 relative`}>
        {showContentOnMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowContentOnMobile(false)}
            className="md:hidden absolute top-4 left-4 z-10 bg-white/90 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {htmlContent ? (
          <div className={`w-full h-full bg-white rounded-lg shadow-lg overflow-auto p-6 relative ${needsPayment ? 'select-none' : ''}`}>
            <div 
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
              className={needsPayment ? 'blur-md pointer-events-none' : ''}
            />
            {needsPayment && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm">
                  <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Contenido bloqueado</h3>
                  <p className="text-muted-foreground mb-4">
                    Has alcanzado el límite de {MAX_FREE_TRIPS} itinerarios gratuitos
                  </p>
                  <Button onClick={handlePayment} disabled={isProcessingPayment} className="w-full gap-2">
                    <CreditCard className="w-4 h-4" />
                    {isProcessingPayment ? "Procesando..." : "Desbloquear por $9.99 USD"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white px-8">
            <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <img src={logoIcon} alt="travesIA" className="w-14 h-14 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Tu itinerario está en camino</h3>
            <p className="text-blue-100 text-lg max-w-sm mx-auto">
              Escribe los detalles de tu viaje ideal y la magia de travesIA hará el resto
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-sm">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
              <span>Esperando tu mensaje...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
