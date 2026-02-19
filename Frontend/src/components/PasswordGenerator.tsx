import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LockKeyhole,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  Shuffle,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { WORDS } from "@/constants/WordList";
import { cn } from "@/lib/utils";

function generatePassword(
  length: number,
  options: {
    lowercase: boolean;
    uppercase: boolean;
    digits: boolean;
    symbols: boolean;
  },
) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  const symbols = "!@#$%^&*()_+-={}[]<>?";

  let chars = "";
  if (options.lowercase) chars += lower;
  if (options.uppercase) chars += upper;
  if (options.digits) chars += nums;
  if (options.symbols) chars += symbols;

  if (!chars) return "";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateUniqueWords(count: number) {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return Array.from(set);
}

function capitalize(w: string) {
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function generatePassphrase(opts: {
  wordsCount: number;
  separator: string;
  capitalizeWords: boolean;
  addNumber: boolean;
  addSymbol: boolean;
}) {
  const symbols = ["!", "@", "#", "$", "%", "&", "*"];
  const num = Math.floor(Math.random() * 90 + 10);

  const words = generateUniqueWords(opts.wordsCount).map((w) =>
    opts.capitalizeWords ? capitalize(w) : w,
  );

  let phrase = words.join(opts.separator);

  if (opts.addNumber) phrase += `${opts.separator}${num}`;
  if (opts.addSymbol)
    phrase += `${opts.separator}${
      symbols[Math.floor(Math.random() * symbols.length)]
    }`;

  return phrase;
}

function generatePin(length: number) {
  const digits = "0123456789";
  let res = "";
  for (let i = 0; i < length; i++) {
    res += digits[Math.floor(Math.random() * digits.length)];
  }
  return res;
}

export default function PasswordGenerator() {
  type Mode = "password" | "passphrase" | "pin";

  const [mode, setMode] = useState<Mode>("password");

  const MODE_LABEL: Record<Mode, string> = {
    password: "Password",
    passphrase: "Passphrase",
    pin: "PIN",
  };

  // password states
  const [length, setLength] = useState(12);
  const [pwOptions, setPwOptions] = useState({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
  });

  // passphrase states
  const [wordsCount, setWordsCount] = useState(4);
  const [separator, setSeparator] = useState<"-" | " " | ".">("-");
  const [ppOptions, setPpOptions] = useState({
    capitalizeWords: true,
    addNumber: true,
    addSymbol: false,
  });

  // PIN states
  const [pinLength, setPinLength] = useState(6);

  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const passphraseConfig = useMemo(
    () => ({
      wordsCount,
      separator,
      capitalizeWords: ppOptions.capitalizeWords,
      addNumber: ppOptions.addNumber,
      addSymbol: ppOptions.addSymbol,
    }),
    [wordsCount, separator, ppOptions],
  );

  useEffect(() => {
    if (mode === "password") {
      setOutput(generatePassword(length, pwOptions));
    } else if (mode === "passphrase") {
      setOutput(generatePassphrase(passphraseConfig));
    } else {
      setOutput(generatePin(pinLength));
    }
  }, [mode, length, pwOptions, passphraseConfig, pinLength]);

  const regenerate = () => {
    if (mode === "password") {
      setOutput(generatePassword(length, pwOptions));
    } else if (mode === "passphrase") {
      setOutput(generatePassphrase(passphraseConfig));
    } else {
      setOutput(generatePin(pinLength));
    }
  };

  const copyValue = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="w-full max-w-lg mx-auto border border-border shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center text-2xl">
          <LockKeyhole className="h-5 w-5 text-blue-800" />
          <span className="bg-linear-to-r from-blue-700 via-sky-400 to-blue-800 bg-clip-text text-transparent font-semibold">
            {mode === "password"
              ? "Password Generator"
              : "Passphrase Generator"}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* MODE TOGGLE */}
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "password" | "passphrase")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-12 rounded-md bg-neutral-50 shadow-sm border p-1">
            <TabsTrigger
              value="password"
              className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border"
            >
              <Shuffle className="h-4 w-4" />
              Password
            </TabsTrigger>

            <TabsTrigger
              value="passphrase"
              className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border"
            >
              <Lightbulb className="h-4 w-4" />
              Passphrase
            </TabsTrigger>

            <TabsTrigger
              value="pin"
              className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border"
            >
              <Hash className="h-4 w-4" />
              PIN
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* CONTROLS */}
        {mode === "password" ? (
          <>
            {/* Length Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Length</span>
                <span>{length}</span>
              </div>
              <Slider
                min={6}
                max={32}
                step={1}
                value={[length]}
                onValueChange={(val) => setLength(val[0])}
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Option
                label="Lowercase Letters"
                checked={pwOptions.lowercase}
                onChange={(v) => setPwOptions({ ...pwOptions, lowercase: v })}
              />
              <Option
                label="Uppercase Letters"
                checked={pwOptions.uppercase}
                onChange={(v) => setPwOptions({ ...pwOptions, uppercase: v })}
              />
              <Option
                label="Digits"
                checked={pwOptions.digits}
                onChange={(v) => setPwOptions({ ...pwOptions, digits: v })}
              />
              <Option
                label="Special Characters"
                checked={pwOptions.symbols}
                onChange={(v) => setPwOptions({ ...pwOptions, symbols: v })}
              />
            </div>
          </>
        ) : mode === "passphrase" ? (
          <>
            {/* Words Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Words</span>
                <span>{wordsCount}</span>
              </div>
              <Slider
                min={3}
                max={10}
                step={1}
                value={[wordsCount]}
                onValueChange={(val) => setWordsCount(val[0])}
              />
            </div>

            {/* Separator */}
            <div className="flex items-center justify-between border rounded-lg px-4 py-3">
              <span className="text-sm">Separator</span>
              <div className="flex gap-2">
                {(["-", " ", "."] as const).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={separator === s ? "default" : "outline"}
                    onClick={() => setSeparator(s)}
                  >
                    {s === " " ? "space" : s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Option
                label="Capitalize Words"
                checked={ppOptions.capitalizeWords}
                onChange={(v) =>
                  setPpOptions({ ...ppOptions, capitalizeWords: v })
                }
              />
              <Option
                label="Add a Number"
                checked={ppOptions.addNumber}
                onChange={(v) => setPpOptions({ ...ppOptions, addNumber: v })}
              />
              <Option
                label="Add a Symbol"
                checked={ppOptions.addSymbol}
                onChange={(v) => setPpOptions({ ...ppOptions, addSymbol: v })}
              />
            </div>
          </>
        ) : (
          <>
            {/* PIN controls */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>PIN Length</span>
                <span>{pinLength}</span>
              </div>

              <Slider
                min={4}
                max={12}
                step={1}
                value={[pinLength]}
                onValueChange={(val) => setPinLength(val[0])}
              />
            </div>
          </>
        )}

        {/* Generated Output */}
        <div className="relative">
          <Input
            readOnly
            value={output}
            className="px-4 font-mono text-base py-6"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={copyValue}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Regenerate */}
        <Button className="w-full hover:text-blue-300" onClick={regenerate}>
          <Sparkles
            className={cn(
              "animate-pulse",
              mode === "pin" && "text-yellow-300",
              mode === "password" && "text-cyan-300",
              mode === "passphrase" && "text-purple-300",
            )}
          />
          Generate New {MODE_LABEL[mode]}
        </Button>
      </CardContent>
    </Card>
  );
}

function Option({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border rounded-lg px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label="Switch"
        className="focus-visible:border-destructive to-destructive/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 h-6 w-10 border-none bg-linear-to-r from-amber-500 data-[state=checked]:from-sky-400 data-[state=checked]:to-indigo-700 [&_span]:size-5 [&_span]:bg-white/90 dark:[&_span]:bg-gray-800/90 shadow-md"
      />
    </div>
  );
}
