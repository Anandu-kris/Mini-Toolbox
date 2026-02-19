import { useMemo, useState } from "react";
import { useShortenUrl } from "@/hooks/useUrlShortner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  QrCode,
  Download,
  Sparkles,
} from "lucide-react";
import LinksDrawer from "./LinksDrawer";
import { QRCodeCanvas } from "qrcode.react";

const ALIAS_RE = /^[a-z0-9-_]{3,30}$/;

const UrlShortener: React.FC = () => {
  // Shorten states
  const [longUrl, setLongUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"shorten" | "qr">("shorten");

  // QR states
  const [qrText, setQrText] = useState("");

  const { mutateAsync: shortenUrl, isPending } = useShortenUrl();

  const qrValue = useMemo(() => qrText.trim(), [qrText]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setQrText("");
    if (!longUrl) return;

    const normalizedAlias = alias.trim().toLowerCase();
    if (normalizedAlias && !ALIAS_RE.test(normalizedAlias)) {
      setError("Alias must be 3–30 chars: a–z, 0–9, - or _");
      return;
    }

    try {
      const payload = normalizedAlias
        ? { longUrl, alias: normalizedAlias }
        : { longUrl };

      const res = await shortenUrl(payload);

      setShortUrl(res.shortUrl);
      setAlias("");
    } catch (err: unknown) {
      const anyErr = err as {
        response?: { status?: number; data?: { detail?: string } };
        message?: string;
      };
      const status = anyErr.response?.status;
      const msg =
        status === 409
          ? "Alias already in use. Try a different one."
          : anyErr.response?.data?.detail ||
            anyErr.message ||
            "Failed to shorten";
      setError(msg);
    }
  }

  async function copyShort() {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch (e) {
      console.log("Error", e);
    }
  }

  async function copyQr() {
    if (!qrValue) return;
    try {
      await navigator.clipboard.writeText(qrValue);
    } catch (e) {
      console.log("Error", e);
    }
  }

  function downloadQrPng() {
    const canvas = document.getElementById(
      "qr-canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <div className="w-full max-w-lg">
      <LinksDrawer />

      <Card className="w-full max-w-lg mx-auto shadow-lg border border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2 justify-center">
            <LinkIcon className="h-5 w-5" />
            <span className="bg-linear-to-r from-blue-700 via-sky-400 to-blue-800 bg-clip-text text-transparent font-semibold">
              URL Shortener
            </span>
          </CardTitle>
        </CardHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "shorten" | "qr")}
          className="w-full"
        >
          <div className="px-6 pb-2 mb-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shorten" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Shorten
              </TabsTrigger>
              <TabsTrigger value="qr" className="gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </TabsTrigger>
            </TabsList>
          </div>

          {/* SHORTEN TAB */}
          <TabsContent value="shorten">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 mb-3">
                <div className="grid gap-3">
                  <Label htmlFor="longUrl">Long URL</Label>
                  <Input
                    id="longUrl"
                    type="url"
                    placeholder="https://example.com/very/long/link"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="alias">Custom alias (optional)</Label>
                  <Input
                    id="alias"
                    type="text"
                    placeholder="e.g. my-link"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    pattern="^[a-z0-9-_]{3,30}$"
                    title="3–30 chars: a–z, 0–9, - or _"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between gap-3 mt-6">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Shorten"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLongUrl("");
                      setAlias("");
                      setShortUrl("");
                      setError("");
                    }}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>

            <Separator />

            <CardFooter className="flex-col justify-center items-center gap-2 mt-5">
              {shortUrl && (
                <div className="w-full">
                  <Label>Short URL</Label>

                  <div className="mt-2 flex flex-col gap-3">
                    <Input readOnly value={shortUrl} />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="default"
                        onClick={copyShort}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>

                      <Button
                        type="button"
                        variant="default"
                        className="flex items-center gap-2"
                        onClick={() => window.open(shortUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setQrText(shortUrl);
                          setTab("qr");
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                        Use for QR
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardFooter>
          </TabsContent>

          {/* QR TAB */}
          <TabsContent value="qr">
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="qrText" className="mb-2">URL for QR</Label>
                <Input
                  id="qrText"
                  type="url"
                  placeholder="Paste a URL or use your short URL"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground my-2">
                  Tip: generate a short link first, then use it for a cleaner
                  QR.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!qrValue}
                  onClick={copyQr}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>

                <Button
                  type="button"
                  disabled={!qrValue}
                  onClick={downloadQrPng}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQrText("");
                    setError("");
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-center py-2">
                {qrValue ? (
                  <div className="rounded-xl border bg-background p-4 shadow-sm">
                    <QRCodeCanvas
                      id="qr-canvas"
                      value={qrValue}
                      size={220}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter a URL to generate a QR code.
                  </p>
                )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default UrlShortener;
