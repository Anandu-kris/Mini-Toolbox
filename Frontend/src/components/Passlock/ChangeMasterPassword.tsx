import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useVaultMeta, usePatchVaultMeta } from "@/hooks/usePasslockApi";
import {
  DEFAULT_KDF,
  base64ToBytes,
  bytesToBase64,
  deriveKekArgon2id,
  importAesKey,
  randomBytes,
  unwrapVaultKey,
  wrapVaultKey,
} from "@/lib/passlock/crypto";
import { usePasslock } from "./usePasslock";

export default function ChangeMasterPassword() {
  const { isUnlocked } = usePasslock();
  const [currentMp, setCurrentMp] = useState("");
  const { data: meta } = useVaultMeta(isUnlocked);
  const patchMut = usePatchVaultMeta();

  const [mp, setMp] = useState("");
  const [mp2, setMp2] = useState("");

  const canSubmit = useMemo(() => {
    if (!isUnlocked) return false;
    if (!meta) return false;
    if (currentMp.length < 1) return false;
    if (mp.length < 10) return false;
    if (mp !== mp2) return false;
    return true;
  }, [isUnlocked, meta, currentMp, mp, mp2]);

  async function onChange() {
    try {
      if (!meta) return;
      if (!canSubmit) return;

      // verify current password
      const saltOld = base64ToBytes(meta.salt);
      const wrappedOld = base64ToBytes(meta.encryptedVaultKey);
      const ivOld = base64ToBytes(meta.vaultKeyIv);

      const kekOldRaw = await deriveKekArgon2id(
        currentMp,
        saltOld,
        meta.kdfParams,
      );
      const kekOld = await importAesKey(kekOldRaw);

      const vaultKeyRaw = await unwrapVaultKey(kekOld, wrappedOld, ivOld);

      const saltNew = randomBytes(16);
      const kekNewRaw = await deriveKekArgon2id(mp, saltNew, DEFAULT_KDF);
      const kekNew = await importAesKey(kekNewRaw);

      const { iv, ct } = await wrapVaultKey(kekNew, vaultKeyRaw);

      await patchMut.mutateAsync({
        kdf: "argon2id",
        kdfParams: DEFAULT_KDF,
        salt: bytesToBase64(saltNew),
        encryptedVaultKey: bytesToBase64(ct),
        vaultKeyIv: bytesToBase64(iv),
        vaultKeyAlg: "A256GCM",
        expectedVersion: meta.version,
      });

      toast.success("Master password updated");

      setCurrentMp("");
      setMp("");
      setMp2("");
    } catch {
      toast.error("Current password is incorrect");
    }
  }

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">Change Master Password</CardTitle>
        <p className="text-sm text-white/60">
          This re-wraps your existing vault key with a new master password. Your
          secrets stay encrypted end-to-end.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-white/80">Current Master Password</Label>
          <Input
            type="password"
            value={currentMp}
            placeholder="Your current password"
            onChange={(e) => setCurrentMp(e.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-white/80">New Master Password</Label>
          <Input
            type="password"
            value={mp}
            onChange={(e) => setMp(e.target.value)}
            placeholder="Minimum 10 characters"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-white/80">Confirm New Master Password</Label>
          <Input
            type="password"
            value={mp2}
            onChange={(e) => setMp2(e.target.value)}
            placeholder="Re-enter"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <Button
          className="w-full"
          disabled={!canSubmit || patchMut.isPending}
          onClick={onChange}
        >
          {patchMut.isPending ? "Updating..." : "Update master password"}
        </Button>

        <p className="text-xs text-white/50">
          If you forget the master password, the vault cannot be recovered.
        </p>
      </CardContent>
    </Card>
  );
}
