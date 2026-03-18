import {
  Headphones,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Loader2,
  Waves,
  Trees,
  AudioWaveform,
  Music,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import { FOCUS_SOUNDS } from "@/data/focusSounds";
import type { PomodoroAudioSettings } from "@/services/pomodoro_audio.service";

type FocusAudioPanelProps = {
  className?: string;
  settings: PomodoroAudioSettings;
  isPlaying: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  onTogglePlay: () => void | Promise<void>;
  onSelectSound: (soundId: string) => void;
  onVolumeChange: (value: number[]) => void;
  onToggleAutoPlay: (checked: boolean) => void;
  onTogglePauseOnBreak: (checked: boolean) => void;
};

function getSoundIcon(soundId: string) {
  if (soundId === "rain") return Waves;
  if (soundId === "forest") return Trees;
  if (soundId === "lofi") return Music;
  if (soundId === "white-noise") return Wind;
  if (soundId === "brown-noise") return AudioWaveform;
  return AudioWaveform;
}

function getSoundGradient(soundId: string) {
  if (soundId === "rain") return "from-blue-500/20 to-cyan-500/10";
  if (soundId === "forest") return "from-emerald-500/20 to-green-500/10";
  if (soundId === "lofi") return "from-amber-500/20 to-orange-500/10";
  if (soundId === "white-noise") return "from-slate-400/20 to-slate-500/10";
  if (soundId === "brown-noise") return "from-yellow-700/20 to-amber-800/10";
  return "from-violet-500/20 to-purple-500/10";
}

function getSoundAccent(soundId: string) {
  if (soundId === "rain") return "text-blue-300";
  if (soundId === "forest") return "text-emerald-300";
  if (soundId === "lofi") return "text-amber-300";
  if (soundId === "white-noise") return "text-slate-300";
  if (soundId === "brown-noise") return "text-yellow-600";
  return "text-violet-300";
}

function getSoundRingActive(soundId: string) {
  if (soundId === "rain") return "ring-blue-400/50 bg-blue-500/10";
  if (soundId === "forest") return "ring-emerald-400/50 bg-emerald-500/10";
  if (soundId === "lofi") return "ring-amber-400/50 bg-amber-500/10";
  if (soundId === "white-noise") return "ring-slate-400/50 bg-slate-500/10";
  if (soundId === "brown-noise") return "ring-yellow-600/50 bg-yellow-700/10";
  return "ring-violet-400/50 bg-violet-500/10";
}

function WaveformBars({
  playing,
  accent,
}: {
  playing: boolean;
  accent: string;
}) {
  return (
    <div className={cn("flex h-5 items-end gap-[3px]", accent)}>
      {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.75].map((h, i) => (
        <span
          key={i}
          style={{
            height: playing ? `${Math.round(h * 20)}px` : "4px",
            animationDelay: `${i * 80}ms`,
            animationDuration: `${500 + i * 70}ms`,
            transition: "height 0.4s ease",
          }}
          className={cn(
            "w-[3px] rounded-full bg-current opacity-80",
            playing && "animate-bounce"
          )}
        />
      ))}
    </div>
  );
}

export default function FocusAudioPanel({
  className,
  settings,
  isPlaying,
  isLoading = false,
  isSaving = false,
  onTogglePlay,
  onSelectSound,
  onVolumeChange,
  onToggleAutoPlay,
  onTogglePauseOnBreak,
}: FocusAudioPanelProps) {
  const selectedSound =
    FOCUS_SOUNDS.find((sound) => sound.id === settings.selectedSoundId) ??
    FOCUS_SOUNDS[0];

  const SelectedIcon = getSoundIcon(selectedSound?.id ?? "rain");
  const accentColor = getSoundAccent(selectedSound?.id ?? "rain");
  const heroGradient = getSoundGradient(selectedSound?.id ?? "rain");

  return (
    <div className={cn("text-white", className)}>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/12">
            <Headphones className="h-5 w-5 text-white/70" />
            {isPlaying && (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0b1020]" />
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              Focus sounds
            </h3>
            <p className="mt-0.5 text-sm text-white/45">
              Calm background audio for your session
            </p>
          </div>
        </div>

        <div className="pt-8 text-xs text-white/35">
          {isLoading || isSaving ? (
            <span className="inline-flex items-center gap-1.5 text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="text-white/20">Saved</span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative mb-7 overflow-hidden rounded-3xl ring-1 ring-white/10",
          "bg-linear-to-br",
          heroGradient
        )}
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')]" />

        <div className="relative flex items-center gap-5 px-6 py-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/12">
            <SelectedIcon className={cn("h-6 w-6", accentColor)} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
              Now playing
            </p>
            <p className="truncate text-lg font-semibold text-white">
              {selectedSound?.name ?? "Rain"}
            </p>
            <div className="mt-2">
              <WaveformBars playing={isPlaying} accent={accentColor} />
            </div>
          </div>

          <Button
            type="button"
            onClick={onTogglePlay}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              "bg-white text-black shadow-lg hover:scale-105 hover:bg-white/90 active:scale-95"
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-black" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5 fill-black" />
            )}
          </Button>
        </div>
      </div>

      <div className="mb-7">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-white/35">
          Choose sound
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FOCUS_SOUNDS.map((sound) => {
            const active = sound.id === settings.selectedSoundId;
            const Icon = getSoundIcon(sound.id);
            const accent = getSoundAccent(sound.id);
            const activeRing = getSoundRingActive(sound.id);

            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => onSelectSound(sound.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-150",
                  "ring-1 hover:bg-white/6",
                  active
                    ? cn("ring-1", activeRing)
                    : "bg-white/4 ring-white/8 hover:ring-white/15"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8 transition-colors",
                    active && "bg-white/12"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? accent : "text-white/50"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active
                      ? "text-white"
                      : "text-white/60 group-hover:text-white/80"
                  )}
                >
                  {sound.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-7 rounded-2xl bg-white/4 px-5 py-4 ring-1 ring-white/8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.volume === 0 ? (
              <VolumeX className="h-4 w-4 text-white/40" />
            ) : (
              <Volume2 className="h-4 w-4 text-white/50" />
            )}
            <span className="text-sm font-medium text-white/70">Volume</span>
          </div>

          <span className="text-sm tabular-nums text-white/40">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>

        <Slider
          value={[settings.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={onVolumeChange}
        />
      </div>

      <div className="rounded-2xl bg-white/4 px-5 py-4 ring-1 ring-white/8">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-white/35">
          Behaviour
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-white/6">
            <Switch
              checked={settings.autoPlayFocus}
              onCheckedChange={onToggleAutoPlay}
              className="
                data-[state=checked]:bg-blue-500
                data-[state=unchecked]:bg-slate-600
                [&>span]:bg-white
              "
            />
            <span className="text-sm text-white/70">Auto-play on focus</span>
          </div>

          <div className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-white/6">
            <Switch
              checked={settings.pauseOnBreak}
              onCheckedChange={onTogglePauseOnBreak}
              className="
                data-[state=checked]:bg-blue-500
                data-[state=unchecked]:bg-slate-600
                [&>span]:bg-white
              "
            />
            <span className="text-sm text-white/70">Pause during break</span>
          </div>
        </div>
      </div>
    </div>
  );
}