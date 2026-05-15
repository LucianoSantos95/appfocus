import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Sparkles, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MeetingRecorderProps {
  clienteId: string;
  onTranscribed?: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export function MeetingRecorder({ clienteId, onTranscribed }: MeetingRecorderProps) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [processing, setProcessing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = handleStop;
      mr.start(1000);
      recorderRef.current = mr;
      setSeconds(0);
      setRecording(true);
      setPaused(false);
      startTimer();
    } catch (e) {
      toast.error("Permissão de microfone negada", { description: (e as Error).message });
    }
  };

  const togglePause = () => {
    if (!recorderRef.current) return;
    if (paused) {
      recorderRef.current.resume();
      startTimer();
      setPaused(false);
    } else {
      recorderRef.current.pause();
      stopTimer();
      setPaused(true);
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopTimer();
    setRecording(false);
    setPaused(false);
  };

  const handleStop = async () => {
    if (!user) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 1000) {
      toast.error("Gravação muito curta");
      return;
    }
    setProcessing(true);
    try {
      const fileName = `${user.id}/${clienteId}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage.from("client-recordings").upload(fileName, blob, { contentType: "audio/webm" });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage.from("client-recordings").createSignedUrl(fileName, 60 * 60 * 24 * 30);

      const { data: rec, error: insErr } = await supabase.from("client_recordings").insert({
        cliente_id: clienteId,
        audio_url: signed?.signedUrl || "",
        storage_path: fileName,
        duration_sec: seconds,
        status: "processando",
      }).select("id").single();
      if (insErr) throw insErr;

      toast.info("🎙️ Gravação salva. A IA está transcrevendo e resumindo...", { duration: 4000 });

      const { error: fnErr } = await supabase.functions.invoke("transcribe-meeting", {
        body: { recording_id: rec.id, cliente_id: clienteId, storage_path: fileName, audio_url: signed?.signedUrl },
      });
      if (fnErr) throw fnErr;

      toast.success("✨ Reunião transcrita e resumida nas anotações!");
      onTranscribed?.();
    } catch (e) {
      toast.error("Erro ao processar gravação", { description: (e as Error).message });
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-foreground">Transcrevendo com IA...</span>
        <Sparkles className="w-3.5 h-3.5 text-primary ml-auto" />
      </div>
    );
  }

  if (!recording) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={startRecording}>
        <Mic className="w-3.5 h-3.5 text-destructive" />
        Gravar reunião
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/5">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-destructive ${paused ? "" : "animate-ping opacity-75"}`} />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
      </span>
      <span className="text-sm font-mono tabular-nums">{formatTime(seconds)}</span>
      <Button variant="ghost" size="sm" className="ml-auto h-7 px-2" onClick={togglePause}>
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </Button>
      <Button variant="destructive" size="sm" className="h-7 gap-1" onClick={stopRecording}>
        <Square className="w-3 h-3" />
        Parar
      </Button>
    </div>
  );
}
