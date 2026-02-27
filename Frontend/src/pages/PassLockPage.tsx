import { PassLockProvider } from "@/components/Passlock/PassLockProvider";
import PassLockGate from "@/components/Passlock/PassLockGate";

export default function PassLockPage() {
  return (
    <PassLockProvider>
      <PassLockGate />
    </PassLockProvider>
  );
}
