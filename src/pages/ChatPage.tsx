import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, []);

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
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
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

  return (
    <div className="h-screen flex">
      {/* Chat Section - Full width on mobile, half on desktop */}
      <div className="w-full md:w-1/2 flex flex-col bg-white">
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

      {/* PDF Preview Section - Hidden on mobile, half width on desktop */}
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-6">
        {pdfUrl ? (
          <div className="w-full h-full bg-white rounded-lg shadow-lg">
            <iframe
              src={pdfUrl}
              className="w-full h-full rounded-lg"
              title="PDF Preview"
            />
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
