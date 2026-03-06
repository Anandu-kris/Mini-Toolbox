import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { importAesKey } from "@/lib/passlock/crypto";
import { PasslockContext } from "./passlock.context";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 min
const ABS_TIMEOUT = 60 * 60 * 1000; // 1 hour

function cloneU8(u8: Uint8Array) {
  return new Uint8Array(u8);
}

export function PassLockProvider({ children }: { children: React.ReactNode }) {
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);

  const vaultKeyRawRef = useRef<Uint8Array | null>(null);

  const idleTimer = useRef<number | null>(null);
  const absTimer = useRef<number | null>(null);

  const [remainingMs, setRemainingMs] = useState<number>(0);

  // ---------------- LOCK ----------------
  const lock = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (absTimer.current) clearTimeout(absTimer.current);

    idleTimer.current = null;
    absTimer.current = null;

    vaultKeyRawRef.current = null;
    setVaultKey(null);
    setRemainingMs(0);
  }, []);

  // ---------------- RESET IDLE ----------------
  const resetIdleTimer = useCallback(() => {
    if (!vaultKey) return;

    if (idleTimer.current) clearTimeout(idleTimer.current);

    idleTimer.current = window.setTimeout(lock, IDLE_TIMEOUT);
    setRemainingMs(IDLE_TIMEOUT);
  }, [vaultKey, lock]);

  // ---------------- UNLOCK ----------------
  const unlockWithRawVaultKey = useCallback(
    async (raw32: Uint8Array) => {
      const key = await importAesKey(raw32);

      vaultKeyRawRef.current = cloneU8(raw32);
      setVaultKey(key);

      // start timers
      resetIdleTimer();

      if (absTimer.current) clearTimeout(absTimer.current);
      absTimer.current = window.setTimeout(lock, ABS_TIMEOUT);
    },
    [lock, resetIdleTimer],
  );

  const getVaultKeyRaw = useCallback(() => {
    const v = vaultKeyRawRef.current;
    return v ? cloneU8(v) : null;
  }, []);

  // ---------------- ACTIVITY LISTENERS ----------------
  useEffect(() => {
    if (!vaultKey) return;

    const events = ["mousemove", "keydown", "click", "scroll"];

    const handler = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handler));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [vaultKey, resetIdleTimer]);

  // ---------------- COUNTDOWN ----------------
  useEffect(() => {
    if (!vaultKey) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [vaultKey]);

  const value = useMemo(
    () => ({
      isUnlocked: !!vaultKey,
      vaultKey,
      getVaultKeyRaw,
      unlockWithRawVaultKey,
      lock,
      remainingMs,
    }),
    [vaultKey, getVaultKeyRaw, unlockWithRawVaultKey, lock, remainingMs],
  );

  return (
    <PasslockContext.Provider value={value}>
      {children}
    </PasslockContext.Provider>
  );
}