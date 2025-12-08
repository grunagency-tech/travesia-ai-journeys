import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseVoiceRecorderOptions {
  onTranscription: (text: string) => void;
}

export const useVoiceRecorder = ({ onTranscription }: UseVoiceRecorderOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64 and send to edge function
        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });

            if (error) {
              console.error('Transcription error:', error);
              toast.error('Error al transcribir el audio');
              setIsProcessing(false);
              return;
            }

            if (data?.text) {
              onTranscription(data.text);
              toast.success('Audio transcrito correctamente');
            }
            setIsProcessing(false);
          };
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error('Error al procesar el audio');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Grabando... Toca de nuevo para detener');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  }, [onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    toggleRecording,
    startRecording,
    stopRecording,
  };
};
