import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function Tile({
  ch,
  state,
}: {
  ch: string;
  state?: "correct" | "present" | "absent";
}) {
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-lg grid place-items-center font-semibold",
        "border border-white/10 bg-white/5 text-white",
        state === "correct" && "bg-emerald-500/40 border-emerald-400/30",
        state === "present" && "bg-yellow-500/40 border-yellow-400/30",
        state === "absent" && "bg-white/8 text-white/50",
      )}
    >
      {ch}
    </div>
  );
}

export function WordleHowToPlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-white/10 bg-[rgba(20,16,40,0.72)] backdrop-blur-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">How To Play</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-white/75 text-sm">
            Guess the Wordle in 6 tries.
          </div>

          <ul className="list-disc pl-5 text-sm text-white/80 space-y-1">
            <li>Each guess must be a valid 5-letter word.</li>
            <li>
              The color of the tiles will change to show how close your guess
              was.
            </li>
          </ul>

          <div className="pt-1">
            <div className="text-sm font-semibold text-white/90 mb-2">
              Examples
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex gap-2 mb-2">
                  <Tile ch="W" state="correct" />
                  <Tile ch="O" />
                  <Tile ch="R" />
                  <Tile ch="D" />
                  <Tile ch="Y" />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-semibold text-white">W</span> is in the
                  word and in the correct spot.
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  <Tile ch="L" />
                  <Tile ch="I" state="present" />
                  <Tile ch="G" />
                  <Tile ch="H" />
                  <Tile ch="T" />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-semibold text-white">I</span> is in the
                  word but in the wrong spot.
                </div>
              </div>

              <div>
                <div className="flex gap-2 mb-2">
                  <Tile ch="R" />
                  <Tile ch="O" />
                  <Tile ch="G" />
                  <Tile ch="U" state="absent" />
                  <Tile ch="E" />
                </div>
                <div className="text-sm text-white/75">
                  <span className="font-semibold text-white">U</span> is not in
                  the word in any spot.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-xs text-white/55">
            A new puzzle is released daily at midnight.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}