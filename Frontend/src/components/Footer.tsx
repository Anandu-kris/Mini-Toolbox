import {
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircleMore,
  Mail,
} from "lucide-react";
import { useState } from "react";

type FooterProps = {
  brandName?: string;
  year?: number;
  onSubscribe?: (email: string) => void;
};

export default function Footer({
  brandName = "Mini Toolbox",
  year = 2025,
  onSubscribe,
}: FooterProps) {
  const [email, setEmail] = useState("");

  function handleSubmit() {
    if (!email.trim()) return;
    onSubscribe?.(email.trim());
    setEmail("");
  }

  return (
    <footer
      className="
        mx-6 md:mx-12 my-10 md:my-14
        rounded-3xl
        border border-white/10
        bg-black/30 backdrop-blur-2xl
        p-8 md:p-12
        text-[#e8f0fb]
        shadow-[0_20px_80px_rgba(0,0,0,0.35)]
      "
      style={{ fontFamily: '"Space Grotesk", ui-sans-serif, system-ui' }}
    >
      {/* TOP SECTION */}
      <div className="flex flex-col gap-12 md:flex-row mb-5">
        {/* LEFT (Newsletter) */}
        <div className="flex-1 md:basis-1/2">
          {/* Gradient panel */}
          <div
            className="
              rounded-2xl
              p-8 md:p-9
              border border-white/10
              bg-linear-to-br from-[#151334]/70 via-[#0b0a1f]/60 to-[#1a1443]/70
              shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
            "
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Join 2000+ users
            </h2>
            <p className="mt-3 text-sm md:text-base text-white/60 max-w-md leading-relaxed">
              Stay in the loop with everything you need to know.
            </p>

            {/* Input + privacy row */}
            <div className="mt-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* input pill */}
              <div
                className="
                  w-full max-w-xl
                  rounded-2xl
                  bg-white/10
                  border border-white/10
                  backdrop-blur
                  shadow-[0_10px_30px_rgba(0,0,0,0.25)]
                  focus-within:border-white/20
                  focus-within:ring-2 focus-within:ring-indigo-500/30
                  transition
                "
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                    <Mail className="h-5 w-5 text-white/70" />
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="
                      flex-1 bg-transparent outline-none
                      text-white placeholder:text-white/45
                      text-sm md:text-base
                    "
                  />

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="
                      h-11 w-11
                      rounded-xl
                      grid place-items-center
                      bg-linear-to-br from-indigo-500 to-purple-600
                      shadow-[0_10px_20px_rgba(99,102,241,0.35)]
                      hover:brightness-110 active:scale-95
                      transition
                    "
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-white/55">
                We care about your data in our{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 text-white/75 hover:text-white transition"
                >
                  privacy policy.
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT LINKS */}
        <div className="flex-1 md:basis-1/2">
          <div className="flex gap-12 justify-center md:justify-end text-center md:text-left px-2 md:px-0">
            {/* Company */}
            <ul className="list-none p-0 m-0">
              <li className="flex flex-col">
                <h3 className="mb-4 text-md uppercase tracking-widest font-normal text-white/50">
                  Company
                </h3>

                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <a
                    key={item}
                    className="mb-3 cursor-pointer text-white/75 hover:text-white transition"
                  >
                    {item}
                  </a>
                ))}
              </li>
            </ul>

            {/* Resources */}
            <ul className="list-none p-0 m-0">
              <li className="flex flex-col">
                <h3 className="mb-4 text-md uppercase tracking-widest font-normal text-white/50">
                  Resources
                </h3>

                {["Help", "Support", "Instructions", "Docs"].map((item) => (
                  <a
                    key={item}
                    className="mb-3 cursor-pointer text-white/75 hover:text-white transition"
                  >
                    {item}
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="flex flex-col-reverse gap-6 items-center border-t border-white/10 pt-8 md:flex-row">
        <div className="flex-1">
          <p className="text-white/55 text-center md:text-left">
            &copy; {brandName} {year}. All rights reserved.
          </p>
        </div>

        <div className="flex gap-3">
          {[
            { icon: <Facebook size={18} />, label: "Facebook" },
            { icon: <Twitter size={18} />, label: "Twitter" },
            { icon: <MessageCircleMore size={18} />, label: "Discord" },
            { icon: <Linkedin size={18} />, label: "LinkedIn" },
          ].map((s) => (
            <a
              key={s.label}
              aria-label={s.label}
              className="
                h-10 w-10 rounded-xl
                grid place-items-center
                bg-white/5 border border-white/10
                text-white/75
                hover:text-white hover:bg-white/10
                transition
              "
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
