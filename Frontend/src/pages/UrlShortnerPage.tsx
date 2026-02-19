import UrlShortener from "@/components/UrlShortener";

export default function UrlShortenerPage() {
  return (
    <div className="min-h-[calc(100dvh-100px)] flex items-center justify-center mx-auto px-40">
      <div className="w-full max-w-8xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        <div className="text-center lg:text-left">
          <h4 className="text-6xl lg:text-6xl text-white leading-tight">
            URL Shortener, Branded Short Links & Analytics.
          </h4>

          <p className="text-lg lg:text-xl text-neutral-300 mt-4 max-w-xl">
            Welcome to the original link shortener — simplifying the Internet
            through the power of the URL.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <UrlShortener />
        </div>
      </div>
    </div>
  );
}
