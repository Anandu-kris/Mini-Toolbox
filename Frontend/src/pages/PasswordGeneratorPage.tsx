import PasswordGenerator from "@/components/PasswordGenerator";

export default function PasswordGeneratorPage() {
  return (
    <div className="min-h-[calc(100dvh-100px)] flex items-center justify-center mx-auto  px-10">
      <div className="w-full max-w-8xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="text-center lg:text-left">
          <h4 className="text-7xl lg:text-7xl text-white leading-tight">
            Randomized. Encrypted vibes.
          </h4>

          <p className="text-lg lg:text-xl text-neutral-300 mt-4 max-w-xl">
            Generate high-entropy passwords & passphrases for next-level
            protection.{" "}
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <PasswordGenerator />
        </div>
      </div>
    </div>
  );
}
