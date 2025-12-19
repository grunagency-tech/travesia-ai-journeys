import { useEffect, useState } from 'react';
import { MessageCircle, Plus, Clock, MapPin, Trash2, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Conversation {
  id: string;
  title: string | null;
  destination: string | null;
  last_message_at: string;
  created_at: string;
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  selectedId?: string;
  onHideSidebar?: () => void;
}

export const ConversationList = ({ onSelectConversation, onNewChat, selectedId, onHideSidebar }: ConversationListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setLoading(false);
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;
    
    setIsDeleting(true);
    try {
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      if (messagesError) throw messagesError;

      // Then delete the conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationToDelete);

      if (convError) throw convError;

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
      toast.success('Conversación eliminada');
      
      // If the deleted conversation was selected, trigger new chat
      if (selectedId === conversationToDelete) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Error al eliminar la conversación');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <p>Inicia sesión para ver tus conversaciones anteriores</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Cargando...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tienes conversaciones previas</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative w-full text-left p-3 rounded-xl transition-all hover:bg-primary/5 ${
                  selectedId === conv.id ? 'bg-primary/10 border border-primary/20' : ''
                }`}
              >
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="font-medium text-sm text-foreground truncate">
                        {conv.title || conv.destination || 'Nueva conversación'}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(conv.last_message_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
                
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteClick(e, conv.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  title="Eliminar conversación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border mt-auto space-y-2">
        <Button 
          onClick={onNewChat}
          className="w-full gap-2"
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Nuevo Chat
        </Button>
        {onHideSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHideSidebar}
            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
            Ocultar historial
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los mensajes de esta conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
