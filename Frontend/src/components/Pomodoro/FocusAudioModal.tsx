import { useState } from "react";
import { Headphones } from "lucide-react";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import FocusAudioPanel from "@/components/Pomodoro/FocusAudioPanel";
import { useFocusAudioController } from "@/hooks/useFocusAudioController";

type PomodoroMode = "focus" | "short" | "long";

type FocusAudioDialogProps = {
  mode: PomodoroMode;
  isRunning: boolean;
  buttonClassName?: string;
};

export default function FocusAudioModal({
  mode,
  isRunning,
  buttonClassName,
}: FocusAudioDialogProps) {
  const [open, setOpen] = useState(false);

  const audio = useFocusAudioController({
    mode,
    isRunning,
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className={cn(
              "grid h-[38px] w-[38px] place-items-center rounded-[10px]",
              "border border-white/10 bg-white/4 text-white/55",
              "backdrop-blur-md transition-all duration-200",
              "hover:bg-white/9 hover:text-white",
              buttonClassName
            )}
            title="Focus Sounds"
            type="button"
          >
            <Headphones size={16} />
          </button>
        </DialogTrigger>

        <DialogContent
          className={cn(
            "max-w-3xl overflow-hidden border-white/10 bg-[#0b1020]/95 p-0 text-white",
            "backdrop-blur-2xl"
          )}
        >
          <div className="max-h-[95vh] overflow-y-auto px-6 py-6 sm:px-7 sm:py-7">
            <FocusAudioPanel
              settings={audio.settings}
              isPlaying={audio.isPlaying}
              isLoading={audio.isLoading}
              isSaving={audio.isSaving}
              onTogglePlay={audio.togglePlay}
              onSelectSound={audio.selectSound}
              onVolumeChange={audio.changeVolume}
              onToggleAutoPlay={audio.setAutoPlayFocus}
              onTogglePauseOnBreak={audio.setPauseOnBreak}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}