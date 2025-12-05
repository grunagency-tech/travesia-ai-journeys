import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, X, Save, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MAX_FREE_TRIPS = 2;

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const initialMessage = location.state?.initialMessage || "";
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

  const WEBHOOK_URL = "https://youtube-n8n.c5mnsm.easypanel.host/webhook/711a4b1d-3d85-4831-9cc2-5ce273881cd2";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle payment success from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      toast({
        title: "¡Pago exitoso!",
        description: "Ahora puedes guardar itinerarios ilimitados",
      });
      // Clear the URL params
      navigate('/chat', { replace: true });
    }
  }, [location.search]);

  useEffect(() => {
    if (initialMessage) {
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
        // Auto-show payment dialog when limit reached
        setShowPaymentDialog(true);
      }
    }
  }, [htmlContent, user, authLoading, tripSaved, tripCount, checkingTripCount]);

  // Auto-save when user logs in after seeing itinerary
  useEffect(() => {
    if (user && htmlContent && !tripSaved && showAuthDialog) {
      setShowAuthDialog(false);
      // Re-check trip count after login
      checkTripCount();
    }
  }, [user, htmlContent, tripSaved, showAuthDialog]);

  // Send pending message when user logs in
  useEffect(() => {
    if (user && pendingMessage && !authLoading) {
      setShowRegisterBanner(false);
      sendMessage(pendingMessage, true);
      setPendingMessage(null);
    }
  }, [user, pendingMessage, authLoading]);

  const handleSaveAttempt = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Check trip count first
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
      
      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        title: `Viaje: ${firstUserMessage.substring(0, 50)}${firstUserMessage.length > 50 ? '...' : ''}`,
        origin: "Por definir",
        destination: "Por definir", 
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travelers: 1,
        preferences: { itinerary_html: htmlContent },
      });

      if (error) throw error;

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
      console.log("Iniciando proceso de pago...");
      const { data, error } = await supabase.functions.invoke('create-payment');
      
      console.log("Respuesta de create-payment:", { data, error });
      
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

    // Count current user messages
    const currentUserMessages = messages.filter(m => m.role === "user").length;
    
    console.log("sendMessage called:", { 
      currentUserMessages, 
      user: !!user, 
      isFromPending,
      messageText: messageText.substring(0, 20)
    });
    
    // If this would be 2nd message and user not logged in, block webhook
    if (currentUserMessages >= 1 && !user && !isFromPending) {
      console.log("BLOCKING: User not logged in and already has 1 message");
      setPendingMessage(messageText);
      setInputValue("");
      setShowRegisterBanner(true);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      console.log("Sending message to webhook:", WEBHOOK_URL);
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log("Webhook response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const responseBody = await response.text();
      let responseText = "";
      
      try {
        const data = JSON.parse(responseBody);
        
        if (data.html) {
          setHtmlContent(data.html);
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
          responseText = "Itinerario generado.";
        } else {
          responseText = responseBody || "Mensaje recibido correctamente.";
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorDetails = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error details:", errorDetails);
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

      {/* Chat Section */}
      <div className={`${showContentOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 flex-col bg-white`}>
        <div className="border-b bg-white p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Tu itinerario personalizado</h2>
            <p className="text-sm text-muted-foreground">Creado por travesIA</p>
          </div>
          {/* Save button - always show when itinerary exists */}
          {canShowSaveButton && (
            <Button
              onClick={handleSaveAttempt}
              disabled={isSaving || checkingTripCount}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          )}
          {tripSaved && (
            <span className="text-sm text-green-600 font-medium">✓ Guardado</span>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Register Banner - blocks sending more messages */}
            {showRegisterBanner && !user && (
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white">
                <div className="flex flex-col items-center text-center gap-4">
                  <div>
                    <h3 className="font-bold text-xl mb-2">¡Regístrate para continuar!</h3>
                    <p className="text-sm text-white/90">Para seguir generando tu itinerario personalizado, necesitas crear una cuenta gratuita</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate('/register', { state: { returnTo: '/chat' } })}
                      className="bg-white text-primary hover:bg-white/90 font-bold uppercase"
                    >
                      REGÍSTRATE GRATIS
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth', { state: { returnTo: '/chat' } })}
                      variant="outline"
                      className="border-white text-white hover:bg-white/20"
                    >
                      Ya tengo cuenta
                    </Button>
                  </div>
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
            <div className="flex gap-2">
              <Textarea
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 placeholder={showRegisterBanner && !user ? "Regístrate para continuar..." : "Escribe tu mensaje..."}
                 className="resize-none text-base md:text-sm"
                 rows={1}
                 disabled={showRegisterBanner && !user}
                 onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !inputValue.trim() || (showRegisterBanner && !user)}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* HTML Content Section */}
      <div className={`${showContentOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 bg-primary items-center justify-center p-6 relative`}>
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
          <div className="text-center text-white">
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Esperando tu itinerario</h3>
            <p className="text-blue-100">
              El contenido se mostrará aquí cuando esté listo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;