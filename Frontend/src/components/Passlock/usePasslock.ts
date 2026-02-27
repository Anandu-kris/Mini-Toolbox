import { useContext } from "react";
import { PasslockContext } from "./passlock.context";

export function usePasslock() {
  const ctx = useContext(PasslockContext);
  if (!ctx) {
    throw new Error("usePasslock must be used inside PassLockProvider");
  }
  return ctx;
}
