import { api } from "@/lib/api";

export type VaultItem = {
  id: string;
  name: string;
  username?: string | null;
  url?: string | null;
  folder?: string | null;
  favorite?: boolean;
  ciphertext: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateVaultItemPayload = {
  name: string;
  username?: string | null;
  url?: string | null;
  folder?: string | null;
  favorite?: boolean;
  ciphertext: string;
  iv: string;
};

export type UpdateVaultItemPayload = Partial<CreateVaultItemPayload>;

export async function listVaultItems() {
  const res = await api.get<VaultItem[]>("/api/passlock/items");
  return res.data;
}

export async function createVaultItem(payload: CreateVaultItemPayload) {
  const res = await api.post<VaultItem>("/api/passlock/items", payload);
  return res.data;
}

export async function updateVaultItem(
  itemId: string,
  payload: UpdateVaultItemPayload,
) {
  const res = await api.patch<VaultItem>(
    `/api/passlock/items/${itemId}`,
    payload,
  );
  return res.data;
}

export async function deleteVaultItem(itemId: string) {
  const res = await api.delete<{ ok: boolean }>(
    `/api/passlock/items/${itemId}`,
  );
  return res.data;
}
