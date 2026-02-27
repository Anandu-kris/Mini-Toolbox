import { createContext } from "react";

export type PasslockCtx = {
  isUnlocked: boolean;
  getVaultKeyRaw: () => Uint8Array | null;
  unlockWithRawVaultKey: (raw32: Uint8Array) => Promise<void>;
  lock: () => void;
  vaultKey: CryptoKey | null;
  remainingMs: number;
};

export const PasslockContext = createContext<PasslockCtx | null>(null);
