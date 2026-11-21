import { useEffect, useRef, useState } from "react";
import type { FocusSoundType, SoundThemeId, TimerSettings } from "@/types/settings";
import { FOCUS_PREVIEW_SECONDS, hasFocusSource } from "@/types/settings";
import type { BackgroundMessage, FocusSource, PopupMessage, SoundCue } from "@/types/messages";
import { AlertTriangle, Check, Link, Music, Play, Square, Trash2, Upload, VolumeX, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUND_THEMES } from "@/lib/soundThemes";
import { normalizeAudioUrl, parseYouTubeUrl, youTubeThumbnail } from "@/lib/mediaUrls";
import { useSoundPreview } from "@/popup/hooks/useSoundPreview";
import { Switch } from "@/components/ui/Switch";
import { VolumeControl } from "./VolumeControl";

interface SoundSelectorProps {
  settings: TimerSettings;
  onUpdate: (partial: Partial<TimerSettings>) => void;
  sendMessage: (message: PopupMessage) => void;
  registerMessageHandler: (handler: (message: BackgroundMessage) => void) => () => void;
}

const FOCUS_SOURCES: { id: FocusSoundType; label: string; icon: typeof Music }[] = [
  { id: "none", label: "Off", icon: VolumeX },
  { id: "local", label: "Audio file", icon: Upload },
  { id: "url", label: "Audio URL", icon: Link },
  { id: "youtube", label: "YouTube", icon: Youtube },
];

const CUES: { cue: SoundCue; label: string }[] = [
  { cue: "start", label: "Start" },
  { cue: "pause", label: "Pause" },
  { cue: "stop", label: "Stop" },
];

const sectionTitle = "text-[10px] font-bold text-primary tracking-wider uppercase px-0.5";
const card = "glass-panel rounded-[22px]";
const inputClass =
  "w-full px-3 py-2 rounded-xl glass-inset border border-white/10 text-xs text-white placeholder:text-on-surface-muted/40 focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/30 transition-all duration-200";

function formatStart(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function youTubeInputFromSettings(settings: TimerSettings): string {
  if (!settings.youtubeVideoId) return "";
  const t = settings.youtubeStartSeconds > 0 ? `?t=${settings.youtubeStartSeconds}` : "";
  return `https://youtu.be/${settings.youtubeVideoId}${t}`;
}

export function SoundSelector({ settings, onUpdate, sendMessage, registerMessageHandler }: SoundSelectorProps) {
  const preview = useSoundPreview(sendMessage, registerMessageHandler);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const ytInputRef = useRef<HTMLInputElement>(null);

  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(settings.externalAudioUrl);
  const [ytInput, setYtInput] = useState(youTubeInputFromSettings(settings));
  const [ytError, setYtError] = useState<string | null>(null);

  // Keep inputs in sync when settings load or are discarded — but never while the user is typing.
  useEffect(() => {
    if (document.activeElement !== urlInputRef.current) setUrlInput(settings.externalAudioUrl);
  }, [settings.externalAudioUrl]);
  useEffect(() => {
    if (document.activeElement !== ytInputRef.current) {
      setYtInput(youTubeInputFromSettings(settings));
      setYtError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.youtubeVideoId, settings.youtubeStartSeconds]);

  /* ---------- previews ---------- */

  const previewChime = (theme: SoundThemeId, cue: SoundCue) =>
    preview.toggleCue(`chime:${theme}:${cue}`, { theme, cue, volume: settings.chimeVolume });

  const previewFocus = () => {
    if (settings.focusSound === "none") return;
    const source: FocusSource = {
      kind: settings.focusSound,
      customSoundDataUrl: settings.customSoundDataUrl,
      externalAudioUrl: settings.externalAudioUrl,
      youtubeVideoId: settings.youtubeVideoId,
      youtubeStartSeconds: settings.youtubeStartSeconds,
    };
    preview.toggleSource("focus", { source, volume: settings.focusVolume });
  };

  /* ---------- source inputs ---------- */

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError(null);

    if (!file.type.startsWith("audio/")) {
      setFileError("Please choose an audio file (.mp3, .wav, .ogg, .m4a).");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("That file is too large. Please choose an audio file under 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileName(file.name);
      onUpdate({ customSoundDataUrl: e.target?.result as string });
    };
    reader.onerror = () => setFileError("That file couldn't be read.");
    reader.readAsDataURL(file);
  };

  const handleRemoveLocalFile = () => {
    preview.stop();
    setFileName(null);
    onUpdate({ customSoundDataUrl: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    // Update immediately (not on blur) so Preview always plays what's in the box.
    onUpdate({ externalAudioUrl: normalizeAudioUrl(value) });
  };

  const handleYouTubeChange = (value: string) => {
    setYtInput(value);
    if (!value.trim()) {
      setYtError(null);
      onUpdate({ youtubeVideoId: "", youtubeStartSeconds: 0 });
      return;
    }
    const parsed = parseYouTubeUrl(value);
    if (!parsed) {
      setYtError("Couldn't find a YouTube video in that link.");
      return;
    }
    setYtError(null);
    onUpdate({ youtubeVideoId: parsed.videoId, youtubeStartSeconds: parsed.startSeconds });
  };

  const urlWasConverted = urlInput.trim() !== "" && normalizeAudioUrl(urlInput) !== urlInput.trim();
  const focusPlaying = preview.activeKey === "focus";
  const focusNotice = preview.notice?.key === "focus" ? preview.notice : null;
  const chimeNotice = preview.notice && preview.notice.key !== "focus" ? preview.notice : null;
  const focusReady = hasFocusSource(settings);

  return (
    <div className="space-y-5">
      {/* =================== Chimes =================== */}
      <div className="space-y-2">
        <div>
          <h3 className={sectionTitle}>Chimes</h3>
          <p className="mt-0.5 px-0.5 text-[10px] text-on-surface-muted/75">Short sounds when you start, pause or stop.</p>
        </div>

        <div className={cn(card, "overflow-hidden divide-y divide-white/5")}>
          {SOUND_THEMES.map((theme) => {
            const selected = settings.soundTheme === theme.id;
            return (
              <div
                key={theme.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  // Narrow side panels: preview buttons drop under the name so it isn't truncated.
                  "max-[379px]:flex-col max-[379px]:items-stretch max-[379px]:gap-2",
                  selected && "bg-primary/[0.07]"
                )}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onUpdate({ soundTheme: theme.id })}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all",
                      selected ? "border-primary bg-primary" : "border-white/20"
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-xs font-semibold", selected ? "text-white" : "text-on-surface")}>
                      {theme.name}
                    </span>
                    <span className="block truncate text-[10px] text-on-surface-muted/75">{theme.description}</span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1 max-[379px]:pl-7" aria-label={`Preview ${theme.name}`}>
                  {CUES.map(({ cue, label }) => {
                    const playing = preview.activeKey === `chime:${theme.id}:${cue}`;
                    return (
                      <button
                        key={cue}
                        type="button"
                        onClick={() => previewChime(theme.id, cue)}
                        title={`${playing ? "Stop" : "Play"} ${theme.name} ${label.toLowerCase()} chime`}
                        aria-pressed={playing}
                        className={cn(
                          "flex h-6 items-center gap-1 rounded-md border px-1.5 text-[9px] font-semibold transition-all cursor-pointer",
                          playing
                            ? "border-primary/50 bg-primary/20 text-white"
                            : "border-white/5 glass-inset text-on-surface-muted hover:text-white hover:border-white/15"
                        )}
                      >
                        {playing ? <Square className="h-2 w-2 fill-current" /> : <Play className="h-2 w-2 fill-current" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {chimeNotice && <p className="px-1 text-[10px] text-error">{chimeNotice.text}</p>}

        <div className={cn(card, "space-y-4 px-5 py-4")}>
          <VolumeControl
            bare
            label="Chime Volume"
            volume={settings.chimeVolume}
            onChange={(chimeVolume) => onUpdate({ chimeVolume })}
          />
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3.5">
            <div>
              <p className="text-xs font-semibold text-white">Start, Pause &amp; Reset Chimes</p>
              <p className="text-[10px] text-on-surface-muted/80">The stop chime always plays when a session ends</p>
            </div>
            <Switch
              checked={settings.controlChimes}
              onChange={(controlChimes) => onUpdate({ controlChimes })}
              label="Start, pause and reset chimes"
            />
          </div>
        </div>
      </div>

      {/* =================== Focus sound =================== */}
      <div className="space-y-2">
        <div>
          <h3 className={sectionTitle}>Focus Sound</h3>
          <p className="mt-0.5 px-0.5 text-[10px] text-on-surface-muted/75">
            Loops in the background while the timer is running.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FOCUS_SOURCES.map(({ id, label, icon: Icon }) => {
            const isActive = settings.focusSound === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  preview.stop();
                  preview.clearNotice();
                  onUpdate({ focusSound: id });
                }}
                className={cn(
                  "flex min-w-0 items-center gap-2 p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/35 shadow-[0_2px_12px_color-mix(in_oklab,var(--accent-1)_15%,transparent)]"
                    : "glass-panel hover:bg-white/[0.09]"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-on-surface-muted/70")} strokeWidth={1.8} />
                <span className={cn("truncate text-xs font-semibold", isActive ? "text-white" : "text-on-surface-muted")}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className={cn(card, "space-y-3 p-4")}>
          {settings.focusSound === "none" && (
            <p className="text-[11px] leading-relaxed text-on-surface-muted/95">
              No background sound. Choose an audio file, a link or a YouTube video (rain, lo-fi, white noise…) to
              play while you focus.
            </p>
          )}

          {settings.focusSound === "local" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Audio file</span>
                {settings.customSoundDataUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLocalFile}
                    className="flex items-center gap-1 text-[10px] font-semibold text-error transition-colors hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>
              {settings.customSoundDataUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/25 bg-primary/5 p-2.5">
                  <Music className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-[11px] font-medium text-white/90">{fileName ?? "Custom audio file"}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 glass-inset py-4 transition-all duration-200 hover:border-primary/30 hover:bg-black/30 cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-on-surface-muted/80" />
                  <span className="text-[11px] font-medium text-on-surface-muted">Choose audio (.mp3, .wav, .ogg) · max 5 MB</span>
                </button>
              )}
              {fileError && <p className="text-[10px] text-error">{fileError}</p>}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
            </div>
          )}

          {settings.focusSound === "url" && (
            <div className="space-y-1.5">
              <label htmlFor="focus-url" className="text-xs font-semibold text-white">
                Audio file URL
              </label>
              <input
                id="focus-url"
                ref={urlInputRef}
                type="url"
                placeholder="https://example.com/rain.mp3"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={inputClass}
              />
              <p className="px-0.5 text-[9.5px] leading-relaxed text-on-surface-muted/70">
                {urlWasConverted
                  ? "Share link detected — we'll use its direct-download version."
                  : "Use a direct link to an audio file. Dropbox and Google Drive share links work too."}
              </p>
            </div>
          )}

          {settings.focusSound === "youtube" && (
            <div className="space-y-2">
              <label htmlFor="focus-yt" className="text-xs font-semibold text-white">
                YouTube link
              </label>
              <input
                id="focus-yt"
                ref={ytInputRef}
                type="text"
                placeholder="https://www.youtube.com/watch?v=…"
                value={ytInput}
                onChange={(e) => handleYouTubeChange(e.target.value)}
                aria-invalid={Boolean(ytError)}
                className={cn(inputClass, ytError && "border-error/50")}
              />
              {ytError && <p className="text-[10px] text-error">{ytError}</p>}
              {settings.youtubeVideoId && !ytError && (
                <div className="flex items-center gap-3 rounded-xl border border-white/5 glass-inset p-2">
                  <img
                    src={youTubeThumbnail(settings.youtubeVideoId)}
                    alt=""
                    className="h-10 w-[71px] shrink-0 rounded-md bg-white/[0.08] object-cover"
                  />
                  <div className="min-w-0 text-[10px] leading-relaxed text-on-surface-muted">
                    <p className="truncate font-mono text-white/90">{settings.youtubeVideoId}</p>
                    <p>
                      {settings.youtubeStartSeconds > 0 ? `Starts at ${formatStart(settings.youtubeStartSeconds)} · ` : ""}
                      loops while the timer runs
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {settings.focusSound !== "none" && (
            <>
              <div className="border-t border-white/5 pt-3.5">
                <VolumeControl
                  bare
                  label="Focus Sound Volume"
                  volume={settings.focusVolume}
                  onChange={(focusVolume) => onUpdate({ focusVolume })}
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3.5">
                <div>
                  <p className="text-xs font-semibold text-white">Keep Playing During Breaks</p>
                  <p className="text-[10px] text-on-surface-muted/80">Off = focus sessions only</p>
                </div>
                <Switch
                  checked={settings.focusSoundDuringBreaks}
                  onChange={(focusSoundDuringBreaks) => onUpdate({ focusSoundDuringBreaks })}
                  label="Keep playing during breaks"
                />
              </div>

              {focusNotice && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
                  <p className="text-[10.5px] leading-relaxed text-rose-200">{focusNotice.text}</p>
                </div>
              )}

              <button
                type="button"
                onClick={previewFocus}
                disabled={!focusReady && !focusPlaying}
                aria-pressed={focusPlaying}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  focusPlaying
                    ? "border-error/25 bg-error/15 text-error hover:bg-error/25"
                    : "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                {focusPlaying ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" /> Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Preview Focus Sound
                  </>
                )}
              </button>
              <p className="-mt-1 text-center text-[9.5px] text-on-surface-muted/60">
                Previews play up to {FOCUS_PREVIEW_SECONDS}s. Remember to save to use it with the timer.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
