import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchVaultMeta,
  setupVault,
  patchVaultMeta,
  type SetupVaultPayload,
  type VaultMetaPatch,
} from "@/services/passlock.service";

export function useVaultMeta(enabled = true) {
  return useQuery({
    queryKey: ["passlock", "meta"],
    queryFn: fetchVaultMeta,
    enabled,
    retry: false,
  });
}

export function useSetupVault() {
  return useMutation({
    mutationFn: (payload: SetupVaultPayload) => setupVault(payload),
  });
}

export function usePatchVaultMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VaultMetaPatch) => patchVaultMeta(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["passlock", "meta"] });
    },
  });
}
