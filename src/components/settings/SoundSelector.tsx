import React, { useState, useEffect, useRef } from "react";
import type { TimerSettings } from "@/types/settings";
import type { PopupMessage } from "@/types/messages";
import { Music, Upload, Link, Youtube, Play, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoundSelectorProps {
  settings: TimerSettings;
  onUpdate: (partial: Partial<TimerSettings>) => void;
  sendMessage: (message: PopupMessage) => void;
}

const SOUND_TYPES = [
  { id: "default", label: "Default Beep", icon: Music },
  { id: "local", label: "Local Audio", icon: Upload },
  { id: "url", label: "External URL", icon: Link },
  { id: "youtube", label: "YouTube Stream", icon: Youtube },
] as const;

export function SoundSelector({ settings, onUpdate, sendMessage }: SoundSelectorProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [urlInput, setUrlInput] = useState(settings.externalAudioUrl);
  const [youtubeInput, setYoutubeInput] = useState(
    settings.youtubeVideoId ? `https://youtube.com/watch?v=${settings.youtubeVideoId}` : ""
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // Stop previewing when component unmounts
      sendMessage({ type: "STOP_ALARM" });
    };
  }, [sendMessage]);

  const handleTestSound = () => {
    if (isPreviewing) {
      sendMessage({ type: "STOP_ALARM" });
      setIsPreviewing(false);
    } else {
      sendMessage({
        type: "PREVIEW_ALARM",
        volume: settings.alarmVolume,
        alarmSoundType: settings.alarmSoundType,
        customSoundDataUrl: settings.customSoundDataUrl,
        externalAudioUrl: settings.externalAudioUrl,
        youtubeVideoId: settings.youtubeVideoId,
      });
      setIsPreviewing(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an audio file under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpdate({ customSoundDataUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLocalFile = () => {
    onUpdate({ customSoundDataUrl: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlBlur = () => {
    onUpdate({ externalAudioUrl: urlInput.trim() });
  };

  const extractYoutubeVideoId = (urlOrId: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return match && match[2] && match[2].length === 11 ? match[2] : urlOrId.trim();
  };

  const handleYoutubeBlur = () => {
    const videoId = extractYoutubeVideoId(youtubeInput);
    onUpdate({ youtubeVideoId: videoId });
  };

  return (
    <div className="space-y-3">
      {/* Sound Type Picker */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-bold text-primary tracking-wider uppercase px-0.5 mb-2">Alarm Tone</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {SOUND_TYPES.map(({ id, label, icon: Icon }) => {
            const isActive = settings.alarmSoundType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onUpdate({ alarmSoundType: id });
                  sendMessage({ type: "STOP_ALARM" });
                  setIsPreviewing(false);
                }}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/35 shadow-[0_2px_12px_rgba(59,130,246,0.15)]"
                    : "glass-panel border-white/5 bg-[#0b1326]/40 hover:bg-[#0b1326]/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "text-on-surface-muted/70"
                  )}
                  strokeWidth={1.8}
                />
                <span
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    isActive ? "text-white" : "text-on-surface-muted"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sound Parameter Configuration */}
      <div className="glass-panel border-white/5 bg-[#0b1326]/40 rounded-2xl p-4 shadow-sm space-y-3">
        {settings.alarmSoundType === "default" && (
          <p className="text-[11px] text-on-surface-muted/95 leading-relaxed">
            The built-in FocusFlow retro chime sequence will play offscreen when your focus session or break timer completes.
          </p>
        )}

        {settings.alarmSoundType === "local" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white font-semibold">Upload Audio File</label>
              {settings.customSoundDataUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLocalFile}
                  className="flex items-center gap-1 text-[10px] text-error hover:text-red-400 font-semibold transition-colors cursor-pointer"
                  title="Remove uploaded audio"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>

            {settings.customSoundDataUrl ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-primary/25 bg-primary/5 text-center">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-white/90 font-medium truncate">
                  Custom Audio File Loaded
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-white/10 hover:border-primary/30 bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-200 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-on-surface-muted/80" />
                <span className="text-[11px] text-on-surface-muted font-medium">
                  Select Audio (.mp3, .wav, .ogg)
                </span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>
        )}

        {settings.alarmSoundType === "url" && (
          <div className="space-y-1.5">
            <label className="text-xs text-white font-semibold">External Audio / Spotify Link</label>
            <input
              type="url"
              placeholder="https://example.com/sound.mp3 or Spotify Track Link"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleUrlBlur}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder:text-on-surface-muted/40 focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
            />
            <p className="text-[9px] text-on-surface-muted/70 leading-relaxed px-0.5">
              Paste a direct audio URL or a Spotify Track URL. Spotify tracks will play a 30-second preview.
            </p>
          </div>
        )}

        {settings.alarmSoundType === "youtube" && (
          <div className="space-y-1.5">
            <label className="text-xs text-white font-semibold">YouTube Video URL / ID</label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... or Video ID"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              onBlur={handleYoutubeBlur}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder:text-on-surface-muted/40 focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200"
            />
            {settings.youtubeVideoId && (
              <div className="flex items-center gap-1.5 px-1 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-on-surface-muted">
                  Resolved Video ID: <code className="text-white font-mono bg-white/5 px-1 py-0.5 rounded">{settings.youtubeVideoId}</code>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Preview Player Toggle */}
        <button
          type="button"
          onClick={handleTestSound}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border active:scale-[0.98] transition-all duration-200 cursor-pointer",
            isPreviewing
              ? "bg-error/15 border-error/25 text-error hover:bg-error/25"
              : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
          )}
        >
          {isPreviewing ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Preview
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Test Alarm Sound
            </>
          )}
        </button>
      </div>
    </div>
  );
}
