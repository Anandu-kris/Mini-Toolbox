import { useNavigate } from "react-router-dom";
import FeatureCard from "@/components/FeatureCard";
import { LinkIcon, KeyRound, Notebook, Timer, LockKeyhole, Dice6 } from "lucide-react";
import TextType from "@/components/Animation/TextType";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-full mx-auto p-15">
      <div className="text-2xl font-sans font-semibold text-left text-white mb-10">
        <TextType
          typingSpeed={75}
          pauseDuration={1500}
          showCursor
          cursorCharacter="_"
          text={[
            "Welcome to Mini ToolBox! Good to see you!",
            "Build some amazing experiences!",
            "Choose a Tool as per your need!",
          ]}
          deletingSpeed={50}
          cursorBlinkDuration={0.5}
        />
      </div>

      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
        <FeatureCard
          title="URL Shortener"
          description="Shorten long URLs with expiry & tracking"
          icon={<LinkIcon className="h-6 w-6" />}
          variant="violet"
          onClick={() => navigate("/home/url-shortener")}
        />

        <FeatureCard
          title="Password Generator"
          description="Generate secure random passwords"
          icon={<KeyRound className="h-6 w-6" />}
          variant="cyan"
          onClick={() => navigate("/home/password-generator")}
        />

        <FeatureCard
          title="Notes"
          description="More than just create & manage notes"
          icon={<Notebook className="h-6 w-6" />}
          variant="emerald"
          onClick={() => navigate("/home/notes")}
        />

        <FeatureCard
          title="Pomodoro"
          description="Focus timer with work/break cycles"
          icon={<Timer className="h-6 w-6" />}
          variant="amber"
          onClick={() => navigate("/home/pomodoro")}
        />

        <FeatureCard
          title="PassLock"
          description="Place to remember all secrets"
          icon={<LockKeyhole className="h-6 w-6" />}
          variant="lime"
          onClick={() => navigate("/home/passlock")}
        />

        <FeatureCard
          title="Wordle"
          description="Guess the word of the day"
          icon={<Dice6 className="h-6 w-6" />}
          variant="rose"
          onClick={() => navigate("/home/wordle")}
        />
      </div>
    </div>
  );
}
