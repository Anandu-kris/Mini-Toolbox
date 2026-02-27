import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  base64ToBytes,
  bytesToBase64,
  randomBytes,
  utf8ToBytes,
  bytesToUtf8,
} from "@/lib/passlock/crypto";

export type VaultSecretPayload = {
  password: string;
  notes: string;
};

export async function encryptVaultSecret(
  vaultKey: CryptoKey,
  payload: VaultSecretPayload,
) {
  const iv = randomBytes(12);
  const pt = utf8ToBytes(JSON.stringify(payload));
  const ct = await aesGcmEncrypt(vaultKey, pt, iv);

  return {
    ciphertext: bytesToBase64(ct),
    iv: bytesToBase64(iv),
  };
}

export async function decryptVaultSecret(
  vaultKey: CryptoKey,
  ciphertextB64: string,
  ivB64: string,
): Promise<VaultSecretPayload> {
  const ct = base64ToBytes(ciphertextB64);
  const iv = base64ToBytes(ivB64);

  const pt = await aesGcmDecrypt(vaultKey, ct, iv);
  const json = bytesToUtf8(pt);

  const parsed = JSON.parse(json) as Partial<VaultSecretPayload>;
  return {
    password: parsed.password ?? "",
    notes: parsed.notes ?? "",
  };
}