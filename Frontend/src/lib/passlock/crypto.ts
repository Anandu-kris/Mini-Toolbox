// src/lib/passlock/crypto.ts
import { argon2id } from "hash-wasm";

export type KdfParams = {
  timeCost: number;
  memoryCost: number; // KiB
  parallelism: number;
  hashLen: number; // bytes
};

export const DEFAULT_KDF: KdfParams = {
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 1,
  hashLen: 32,
};

export function bytesToBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function base64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(len: number) {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return b;
}

export function utf8ToBytes(s: string) {
  return new TextEncoder().encode(s);
}

export function bytesToUtf8(b: Uint8Array) {
  return new TextDecoder().decode(b);
}

function toU8(u8: Uint8Array) {
  return new Uint8Array(u8);
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return toU8(u8).buffer;
}

export async function deriveKekArgon2id(
  masterPassword: string,
  salt: Uint8Array,
  params: KdfParams,
) {
  const hash = await argon2id({
    password: masterPassword,
    salt,
    iterations: params.timeCost,
    memorySize: params.memoryCost,
    parallelism: params.parallelism,
    hashLength: params.hashLen,
    outputType: "binary",
  });

  return toU8(hash);
}

export async function importAesKey(raw32: Uint8Array) {
  const raw = toU8(raw32);
  if (raw.byteLength !== 32) {
    throw new Error(`importAesKey expects 32 bytes, got ${raw.byteLength}`);
  }

  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(raw),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array,
  iv: Uint8Array,
) {
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toU8(iv) },
    key,
    toArrayBuffer(plaintext),
  );
  return new Uint8Array(ct);
}

export async function aesGcmDecrypt(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array,
) {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toU8(iv) },
    key,
    toArrayBuffer(ciphertext),
  );
  return new Uint8Array(pt);
}

export async function wrapVaultKey(kek: CryptoKey, vaultKeyRaw: Uint8Array) {
  const vk = toU8(vaultKeyRaw);
  if (vk.byteLength !== 32) {
    throw new Error(`vaultKeyRaw must be 32 bytes, got ${vk.byteLength}`);
  }

  const iv = randomBytes(12);
  const ct = await aesGcmEncrypt(kek, vk, iv);
  return { iv, ct };
}

export async function unwrapVaultKey(
  kek: CryptoKey,
  wrapped: Uint8Array,
  iv: Uint8Array,
) {
  const raw = await aesGcmDecrypt(kek, wrapped, iv);
  if (raw.byteLength !== 32) {
    throw new Error(`unwrapped vault key must be 32 bytes, got ${raw.byteLength}`);
  }
  return raw;
}
