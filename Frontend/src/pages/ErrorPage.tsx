import { useNavigate } from "react-router-dom";
import imageSrc from "@/assets/error.png";
import { ArrowLeft } from "lucide-react";

type Error404Props = {
  code?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  homePath?: string;
};

export default function Error404({
  code = "404",
  title = "Oops, something went wrong...",
  subtitle = "Let’s get you back to somewhere familiar.",
  buttonText = "Back to home",
  homePath = "/",
}: Error404Props) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-b from-sky-400 via-sky-200 to-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-14">
        <div className="flex items-center justify-center gap-6 md:gap-2">

          {/* CHARACTER */}
          <div className="relative">
            <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-2xl" />

            <img
              src={imageSrc}
              alt="Lost character"
              className="relative w-[180px] sm:w-60 md:w-[280px] drop-shadow-[0_25px_40px_rgba(2,132,199,0.25)]"
              draggable={false}
            />
          </div>

          {/* 404 */}
          <div className="relative">
            <div
              className="absolute left-2 top-2 select-none text-[140px] font-black text-sky-900/15 sm:text-[180px] md:text-[220px]"
              aria-hidden="true"
            >
              {code}
            </div>

            <div
              className={[
                "select-none text-[140px] font-black sm:text-[180px] md:text-[220px]",
                "bg-linear-to-b from-white via-sky-50 to-sky-200 bg-clip-text text-transparent",
                "[text-shadow:0_1px_0_rgba(255,255,255,0.6),0_4px_0_rgba(186,230,253,0.9),0_8px_0_rgba(56,189,248,0.5),0_16px_30px_rgba(2,132,199,0.3)]",
              ].join(" ")}
            >
              {code}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-700 sm:text-base">{subtitle}</p>

          <button
            onClick={() => navigate(homePath)}
            className={[
              "mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
              "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-400/80",
              "shadow-[0_14px_35px_rgba(2,132,199,0.35)]",
              "transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(2,132,199,0.45)]",
            ].join(" ")}
          >
            <ArrowLeft />
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
