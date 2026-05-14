import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Mic, X, Image, FileText, Music, Smile, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AIComposerButton } from "./AIComposerButton";
import { SmartReplySuggestions } from "./SmartReplySuggestions";

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendMedia: (url: string, type: string, caption?: string) => void;
  accountId: string | null;
  contatoId?: string | null;
}

export function ChatInput({ onSendText, onSendMedia, accountId, contatoId }: ChatInputProps) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const cancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [fileType, setFileType] = useState<string>("image");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSendText(text.trim());
        setText("");
      }
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSendText(text.trim());
      setText("");
    }
  };

  const uploadFile = async (file: File, mediaType: string) => {
    if (!accountId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${accountId}/${mediaType}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat-media").upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      onSendMedia(urlData.publicUrl, mediaType);
      toast.success("Arquivo enviado!");
    } catch (err: unknown) {
      toast.error("Erro no upload: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (type: string) => {
    setFileType(type);
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      const accept = type === "image" ? "image/*,video/*" : type === "document" ? "*/*" : "audio/*";
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const ALLOWED_EXTENSIONS: Record<string, string[]> = {
    image: ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "mp4", "webm", "mov"],
    video: ["mp4", "webm", "mov", "avi"],
    audio: ["mp3", "wav", "ogg", "m4a", "webm"],
    document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"],
  };
  const MAX_FILE_SIZE_MB = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`);
      e.target.value = "";
      return;
    }

    let type = fileType;
    if (file.type.startsWith("video/")) type = "video";
    else if (file.type.startsWith("image/")) type = "image";
    else if (file.type.startsWith("audio/")) type = "audio";
    else type = "document";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS[type]?.includes(ext)) {
      toast.error(`Tipo de arquivo não permitido: .${ext}`);
      e.target.value = "";
      return;
    }

    uploadFile(file, type);
    e.target.value = "";
  };

  // Audio recording recording logic...
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      let isFirstChunk = true;
      let timerStarted = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          if (isFirstChunk) {
            isFirstChunk = false;
            return;
          }
          chunksRef.current.push(e.data);
          if (!timerStarted) {
            timerStarted = true;
            recordingStartRef.current = Date.now();
            setRecordingTime(0);
            timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
          }
        }
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        setRecordingTime(0);

        const durationMs = Date.now() - recordingStartRef.current;
        if (cancelledRef.current || durationMs < 500 || chunksRef.current.length === 0) {
          return;
        }
        const actualMime = recorder.mimeType || "audio/ogg;codecs=opus";
        const blob = new Blob(chunksRef.current, { type: actualMime });
        await uploadAudio(blob);
      };

      recorder.start(100);
      setRecording(true);
      setRecordingTime(0);
    } catch {
      toast.error("Permita o acesso ao microfone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const uploadAudio = async (blob: Blob) => {
    if (!accountId) return;
    setUploading(true);
    try {
      const isOgg = blob.type.includes("ogg");
      const ext = isOgg ? "ogg" : "webm";
      const contentType = isOgg ? "audio/ogg;codecs=opus" : "audio/webm;codecs=opus";
      const path = `${accountId}/audio/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat-media").upload(path, blob, { contentType });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
      onSendMedia(urlData.publicUrl, "audio");
    } catch (err: unknown) {
      toast.error("Erro no upload de áudio: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  };

  const formatRecTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-4 px-4 py-1.5 min-h-[52px]" data-recording>
        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 shrink-0" onClick={cancelRecording}>
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[15px] font-medium text-destructive tabular-nums">{formatRecTime(recordingTime)}</span>
          <span className="text-sm text-gray-500">Gravando...</span>
        </div>
        <Button size="icon" onClick={stopRecording} className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#008f72] shrink-0">
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <SmartReplySuggestions contatoId={contatoId ?? null} onSelect={(t) => setText(t)} />
    <div className="relative flex items-end gap-2 px-3 py-2 min-h-[60px]">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      {/* Attach popup — aparece acima do botão */}
      {showAttachMenu && (
        <div className="absolute bottom-[68px] left-3 flex flex-col gap-2 p-2 rounded-2xl bg-white dark:bg-[#233138] shadow-xl border border-black/5 dark:border-white/10 z-50">
          <button
            onClick={() => handleFileSelect("image")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-[#bf59cf] flex items-center justify-center shrink-0">
              <Image className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Fotos e Vídeos</span>
          </button>
          <button
            onClick={() => handleFileSelect("audio")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-[#0063cb] flex items-center justify-center shrink-0">
              <Music className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Áudio</span>
          </button>
          <button
            onClick={() => handleFileSelect("document")}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-[#5157ae] flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Documento</span>
          </button>
        </div>
      )}

      {/* Emoji */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full text-[#54656f] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
        disabled
      >
        <Smile className="h-5 w-5" />
      </Button>

      {/* Attach toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full shrink-0 transition-all",
          showAttachMenu
            ? "text-[#00a884] bg-black/5 dark:bg-white/5 rotate-45"
            : "text-[#54656f] dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
        )}
        onClick={() => setShowAttachMenu((v) => !v)}
        disabled={uploading}
      >
        <Plus className={cn("h-5 w-5 transition-transform duration-200", uploading && "animate-pulse")} />
      </Button>

      {/* Textarea */}
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem"
          className="w-full min-h-[42px] max-h-[120px] resize-none text-[15px] rounded-xl bg-white dark:bg-[#2a3942] border-none focus:ring-0 outline-none px-4 py-[10px] leading-snug text-gray-800 dark:text-gray-100 placeholder:text-[#8696a0]"
          rows={1}
        />
      </div>

      {/* AI Composer — só aparece quando há texto */}
      {text.trim() && (
        <AIComposerButton message={text} onComposed={setText} disabled={uploading} />
      )}

      {/* Send / Mic */}
      {text.trim() ? (
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#008f72] shrink-0"
          onClick={handleSend}
        >
          <Send className="h-4 w-4 text-white" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-[#00a884] hover:bg-[#008f72] shrink-0"
          onClick={startRecording}
          disabled={uploading}
        >
          <Mic className="h-4 w-4 text-white" />
        </Button>
      )}
    </div>
    </>
  );
}
