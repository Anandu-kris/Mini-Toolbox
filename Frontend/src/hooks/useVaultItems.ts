import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listVaultItems,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  type CreateVaultItemPayload,
  type UpdateVaultItemPayload,
} from "@/services/passlock_items.service";

export function useVaultItems(enabled = true) {
  return useQuery({
    queryKey: ["passlock", "items"],
    queryFn: listVaultItems,
    enabled,
    staleTime: 10_000,
    retry: false,
  });
}

export function useCreateVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVaultItemPayload) => createVaultItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passlock", "items"] }),
  });
}

export function useUpdateVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { itemId: string; payload: UpdateVaultItemPayload }) =>
      updateVaultItem(args.itemId, args.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passlock", "items"] }),
  });
}

export function useDeleteVaultItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteVaultItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passlock", "items"] }),
  });
}