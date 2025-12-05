import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [showContentOnMobile, setShowContentOnMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const WEBHOOK_URL = "https://youtube-n8n.c5mnsm.easypanel.host/webhook/711a4b1d-3d85-4831-9cc2-5ce273881cd2";

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
  }, []);

  useEffect(() => {
    if (htmlContent) {
      setShowContentOnMobile(true);
    }
  }, [htmlContent]);

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

      // Get response as text first, then try to parse as JSON
      const responseBody = await response.text();
      let responseText = "";
      
      try {
        const data = JSON.parse(responseBody);
        
        // Handle different JSON response formats
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
        // Response is not JSON - it's likely HTML content
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

  return (
    <div className="h-screen flex">
      {/* Chat Section - Hidden on mobile when content is shown, half on desktop */}
      <div className={`${showContentOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 flex-col bg-white`}>
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

      {/* HTML Content Section - Full screen on mobile when shown, half width on desktop */}
      <div className={`${showContentOnMobile ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 bg-primary items-center justify-center p-6 relative`}>
        {/* Close button for mobile */}
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
          <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-auto p-6">
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
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