import { api } from "@/lib/api";

export type VaultMeta = {
  kdf: "argon2id";
  kdfParams: {
    timeCost: number;
    memoryCost: number;
    parallelism: number;
    hashLen: number;
  };
  salt: string; // base64
  encryptedVaultKey: string; // base64
  vaultKeyIv: string; // base64
  vaultKeyAlg?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type SetupVaultPayload = {
  kdf: "argon2id";
  kdfParams: VaultMeta["kdfParams"];
  salt: string;
  encryptedVaultKey: string;
  vaultKeyIv: string;
  vaultKeyAlg?: string;
  version: number;
};

export type VaultMetaPatch = {
  kdf: "argon2id";
  kdfParams: VaultMeta["kdfParams"];
  salt: string;
  encryptedVaultKey: string;
  vaultKeyIv: string;
  vaultKeyAlg: "A256GCM";
  expectedVersion?: number | null;
};

export async function fetchVaultMeta() {
  const res = await api.get<VaultMeta>("/api/passlock/meta");
  return res.data;
}

export async function setupVault(payload: SetupVaultPayload) {
  const res = await api.post<VaultMeta>("/api/passlock/setup", payload);
  return res.data;
}

export async function patchVaultMeta(payload: VaultMetaPatch) {
  const res = await api.patch<VaultMeta>("/api/passlock/meta", payload);
  return res.data;
}
