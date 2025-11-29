import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMessage = location.state?.initialMessage || "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPdfOnMobile, setShowPdfOnMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const WEBHOOK_URL = "https://gcp.grunagency.com/webhook/edc6fe1e-5d9a-44d8-9739-a5be993d853a";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }

    // Check for payment success in URL
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success") {
      setHasPaid(true);
      toast({
        title: "¡Pago exitoso!",
        description: "Ahora puedes ver tu itinerario completo.",
      });
      // Clean URL
      window.history.replaceState({}, "", "/chat");
    } else if (paymentStatus === "canceled") {
      toast({
        title: "Pago cancelado",
        description: "El pago fue cancelado. Puedes intentarlo nuevamente.",
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, "", "/chat");
    }
  }, []);

  useEffect(() => {
    // Show PDF on mobile when it's available
    if (pdfUrl) {
      setShowPdfOnMobile(true);
    }
  }, [pdfUrl]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      // Check if response contains a PDF URL
      if (data.pdf_url) {
        // Convert Google Docs URLs to embeddable format
        let embedUrl = data.pdf_url;
        if (embedUrl.includes('docs.google.com/document')) {
          // Replace /edit with /preview for embedding
          embedUrl = embedUrl.replace('/edit?usp=sharing', '/preview');
          embedUrl = embedUrl.replace('/edit', '/preview');
        }
        setPdfUrl(embedUrl);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "Lo siento, no pude procesar tu mensaje.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje.",
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

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, "_blank");
        toast({
          title: "Redirigiendo a pago",
          description: "Se abrirá una nueva pestaña para completar el pago.",
        });
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Chat Section - Hidden on mobile when PDF is shown, half on desktop */}
      <div className={`${showPdfOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 flex-col bg-white`}>
        {/* Header with Back Button */}
        <div className="border-b bg-white p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-lg">Tu itinerario personalizado</h2>
            <p className="text-sm text-muted-foreground">Creado por travesIA</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
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
            ))}
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
                 placeholder="Escribe tu mensaje..."
                 className="resize-none text-base md:text-sm"
                 rows={1}
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
                disabled={isLoading || !inputValue.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* PDF Preview Section - Full screen on mobile when shown, half width on desktop */}
      <div className={`${showPdfOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 bg-primary items-center justify-center p-6 relative`}>
        {/* Close button for mobile */}
        {showPdfOnMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPdfOnMobile(false)}
            className="md:hidden absolute top-4 left-4 z-10 bg-white/90 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {pdfUrl ? (
          <div className="w-full h-full bg-white rounded-lg shadow-lg relative">
            {/* PDF with blur when not paid */}
            <iframe
              src={pdfUrl}
              className={`w-full h-full rounded-lg ${!hasPaid ? "blur-lg" : ""}`}
              title="PDF Preview"
            />
            
            {/* Payment overlay when not paid */}
            {!hasPaid && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
                <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl mx-4">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <Lock className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    Desbloquea tu itinerario
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Para ver tu itinerario completo y detallado, realiza un pago único de <span className="font-bold text-primary">$9.99 USD</span>
                  </p>
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    size="lg"
                    className="w-full"
                  >
                    {isProcessingPayment ? "Procesando..." : "Desbloquear ahora"}
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Pago seguro procesado por Stripe
                  </p>
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
              El PDF se mostrará aquí cuando esté listo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;