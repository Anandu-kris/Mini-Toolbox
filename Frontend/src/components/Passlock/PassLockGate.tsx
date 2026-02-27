import axios from "axios";

import { usePasslock } from "./usePasslock";
import { useVaultMeta } from "@/hooks/usePasslockApi";
import PassLockSetup from "./PassLockSetup";
import PassLockUnlock from "./PassLockUnlock";
import { VaultItemsSection } from "./VaultItemsSection";

export default function PassLockGate() {
  const { isUnlocked } = usePasslock();
  const metaQ = useVaultMeta(true);

  if (isUnlocked) {
    return (
      <div className="w-full h-full min-h-0 px-6 2xl:px-10">
        <VaultItemsSection />
      </div>
    );
  }

  const status = axios.isAxiosError(metaQ.error)
    ? metaQ.error.response?.status
    : undefined;

  if (metaQ.isError && status === 404) {
    return <PassLockSetup />;
  }

  return <PassLockUnlock />;
}
