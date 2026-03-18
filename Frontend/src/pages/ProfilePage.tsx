import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Mail,
  User,
  Loader2,
  Pencil,
  X,
  Save,
  KeyRound,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useUploadAvatar } from "@/hooks/useUploadAvatar";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useChangePassword } from "@/hooks/useChangePassword";
import axios from "axios";
import {
  useVerifyLinkMobileOtp,
  useRequestLinkMobileOtp,
} from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { maskMobileNumber } from "@/helper/MobileNumberMask";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: me, isLoading, isError } = useCurrentUser();
  const { mutateAsync: uploadAvatar, isPending: uploading } = useUploadAvatar();
  const { mutateAsync: updateProfile, isPending: savingProfile } =
    useUpdateProfile();
  const { mutateAsync: changePassword, isPending: changingPwd } =
    useChangePassword();
  const { mutateAsync: requestLinkMobileOtp, isPending: requestingMobileOtp } =
    useRequestLinkMobileOtp();

  const { mutateAsync: verifyLinkMobileOtp, isPending: verifyingMobileOtp } =
    useVerifyLinkMobileOtp();

  const displayName = useMemo(() => {
    return me?.name ?? "Account";
  }, [me]);

  const displayEmail = useMemo(() => {
    return me?.email ?? "—";
  }, [me]);

  const displayMobile = useMemo(() => {
    return maskMobileNumber(me?.mobileNumber);
  }, [me?.mobileNumber]);

  const mobileBusy = requestingMobileOtp || verifyingMobileOtp;

  const initialAvatarUrl = useMemo(() => {
    return me?.avatarUrl ?? null;
  }, [me]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileStep, setMobileStep] = useState<"input" | "verify">("input");
  const [mobileError, setMobileError] = useState<string | null>(null);

  async function onSavePassword() {
    setPwdError(null);

    if (!currentPwd || !newPwd) {
      setPwdError("Please fill all password fields.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    try {
      await changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
      });

      setPwdOpen(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e: unknown) {
      let msg = "Password update failed";
      if (axios.isAxiosError(e)) msg = e.response?.data?.detail ?? e.message;
      setPwdError(msg);
    }
  }

  function onResetAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    setNameDraft(me?.name ?? "");
    setEmailDraft(me?.email ?? "");
  }, [me?.name, me?.email]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function onPickAvatar() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarFile(file);
  }

  async function onSaveAvatar() {
    if (!avatarFile) return;
    try {
      await uploadAvatar(avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("Avatar upload failed", err);
    }
  }

  async function onSaveProfile() {
    const name = nameDraft.trim();
    const email = emailDraft.trim();

    if (!name) return;
    if (!email || !email.includes("@")) return;

    const payload: { name?: string; email?: string } = {};

    if (name !== (me?.name ?? "")) payload.name = name;
    if (email !== (me?.email ?? "")) payload.email = email;

    try {
      await updateProfile(payload);
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed", err);
    }
  }

  function onCancelEdit() {
    setIsEditing(false);
    setNameDraft(me?.name ?? "");
    setEmailDraft(me?.email ?? "");
  }

  const shownAvatar =
    avatarPreview ??
    (typeof initialAvatarUrl === "string" ? initialAvatarUrl : null);

  const initials = useMemo(() => {
    const n = (displayName || "").trim();
    if (!n) return "U";
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const busy =
    isLoading || isError || uploading || savingProfile || changingPwd;

  const profileChanged =
    nameDraft.trim() !== (me?.name ?? "") ||
    emailDraft.trim() !== (me?.email ?? "");

  //Mobile OTP Request
  async function onRequestMobileOtp() {
    setMobileError(null);

    const mobile = mobileDraft.trim();

    if (mobile.length !== 10) {
      setMobileError("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      await requestLinkMobileOtp({
        mobileNumber: `+91${mobile}`,
      });
      setMobileStep("verify");
    } catch (e: unknown) {
      let msg = "Failed to send OTP";
      if (axios.isAxiosError(e)) msg = e.response?.data?.detail ?? e.message;
      setMobileError(msg);
    }
  }

  //OTP Verify
  async function onVerifyMobileOtp() {
    setMobileError(null);

    const mobile = mobileDraft.trim();
    const otp = mobileOtp.trim();

    if (mobile.length !== 10) {
      setMobileError("Enter a valid mobile number.");
      return;
    }

    if (!otp) {
      setMobileError("Please enter the OTP.");
      return;
    }

    try {
      await verifyLinkMobileOtp({
        mobileNumber: `+91${mobile}`,
        otpCode: otp,
      });

      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      setMobileOpen(false);
      setMobileStep("input");
      setMobileDraft("");
      setMobileOtp("");
      setMobileError(null);
    } catch (e: unknown) {
      let msg = "OTP verification failed";
      if (axios.isAxiosError(e)) msg = e.response?.data?.detail ?? e.message;
      setMobileError(msg);
    }
  }

  function onCancelMobileLink() {
    setMobileOpen(false);
    setMobileStep("input");
    setMobileDraft("");
    setMobileOtp("");
    setMobileError(null);
  }

  return (
    <>
      <style>{`
        .profile-page{
          min-height: 100%;
          padding: 18px 18px 28px;
          display:flex;
          justify-content:center;
        }

        .profile-card{
          width: min(1440px, 100%);
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 70px rgba(0,0,0,0.35);
          overflow:hidden;
          font-family: 'Sora', sans-serif;
        }

        .profile-header{
          padding: 18px 18px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
        }
        .profile-title{
          font-size: 18px;
          font-weight: 650;
          color: rgba(255,255,255,0.92);
          letter-spacing: 0.05em;
        }
        .profile-sub{
          margin-top: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
        }

        .profile-body{
          padding: 18px;
          display:flex;
          flex-direction: column;
          gap: 16px;
        }

        .panel{
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(10,12,18,0.55);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          padding: 20px;
        }

        .panel-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
          margin-bottom: 14px;
        }
        .panel-title{
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.86);
          letter-spacing: 0.01em;
        }

        .avatar-card{
          padding: 18px 20px;
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 18px;
          align-items: center;
          min-height: 130px;
        }

        .avatar-left{
          display:flex;
          align-items:center;
          justify-content:center;
          margin-top: -10px;
        }

        .avatar-right{
          display:flex;
          flex-direction: column;
          justify-content: space-between;  /* top info + bottom actions */
          gap: 12px;
          min-height: 110px;
          margin-top: 2.5rem;
        }

        .avatar-top{
          display:flex;
          flex-direction: column;
          gap: 8px;
        }

        .avatar-cta{
          display:flex;
          align-items:center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .avatar-divider{
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin-top: 8px;
        }

        .avatar-actions{
          display:flex;
          justify-content:flex-end;
          gap: 10px;
          align-items:center;
          flex-wrap: wrap;
        }

        .avatar{
          width: 120px;
          height: 140px;
          border-radius: 22px;
          overflow:hidden;
          display:grid;
          place-items:center;
          flex-shrink:0;
          background: linear-gradient(140deg, rgba(139,109,253,0.9) 0%, rgba(91,63,232,0.9) 100%);
          box-shadow: 0 10px 30px rgba(124, 92, 252, 0.22);
          border: 1px solid rgba(255,255,255,0.10);
        }
        .avatar img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }
        .avatar-initials{
          color:white;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.02em;
          user-select:none;
        }

        .btn{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.85);
          cursor:pointer;
          transition: transform .18s, background .18s, border-color .18s;
          font-size: 13px;
          font-weight: 600;
          width: fit-content;
        }

        .btn-grad {
          background-image: linear-gradient(to right, #4776E6 0%, #8E54E9 51%, #4776E6 100%);
        }

        .btn-grad {
          display:inline-flex;
          align-items:center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 12px;
          text-align: center;
          color: white;
          outline: none;
          border: none;
          cursor:pointer;
          transition: 0.5s;
          background-size: 200% auto;
          font-size: 13px;
          font-weight: 600;
          width: fit-content;
        }

        .btn-grad:hover {
          background-position: right center;
          color: #fff;
          text-decoration: none;
        }

        .btn:hover:not(:disabled){
          transform: translateY(-1px);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.14);
        }
        .btn:disabled{
          opacity: 0.6;
          cursor:not-allowed;
        }

        .btn-primary{
          background: linear-gradient(140deg, rgba(139,109,253,0.95) 0%, rgba(91,63,232,0.95) 100%);
          border-color: rgba(255,255,255,0.14);
        }
        .btn-primary:hover:not(:disabled){
          background: linear-gradient(140deg, rgba(139,109,253,1) 0%, rgba(91,63,232,1) 100%);
        }

        .btn-ghost{
          background: rgba(255,255,255,0.03);
        }

        .hint{
          font-size: 12px;
          color: rgba(255,255,255,0.40);
          line-height: 1.35;
        }

        .field{
          display:flex;
          flex-direction:column;
          gap: 6px;
          margin-top: 12px;
        }
        .field:first-child{ margin-top: 0; }

        .label{
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          display:flex;
          align-items:center;
          gap: 8px;
        }
        .value{
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          padding: 10px 12px;
          color: rgba(255,255,255,0.88);
          font-size: 13px;
          overflow:hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .input{
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          padding: 10px 12px;
          color: rgba(255,255,255,0.9);
          font-size: 13px;
          outline: none;
        }
        .input:focus{
          border-color: rgba(139,109,253,0.55);
          box-shadow: 0 0 0 3px rgba(139,109,253,0.12);
        }
        .error{
          margin-top: 12px;
          font-size: 12px;
          color: #ff7b7b;
        }

        .status-pill{
          display:inline-flex;
          align-items:center;
          gap:6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          width: fit-content;
        }

        .status-pill.ok{
          background: rgba(34,197,94,0.12);
          color: rgba(134,239,172,0.95);
          border-color: rgba(34,197,94,0.24);
        }

        .status-pill.warn{
          background: rgba(245,158,11,0.10);
          color: rgba(253,224,71,0.95);
          border-color: rgba(245,158,11,0.22);
        }

        .inline-actions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }

      `}</style>

      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <div>
              <div className="profile-title">Profile</div>
              <div className="profile-sub">Manage your account details</div>
            </div>
            {isLoading ? (
              <div className="btn" style={{ opacity: 0.75, cursor: "default" }}>
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </div>
            ) : null}
          </div>

          <div className="profile-body">
            <div className="panel avatar-card">
              {/* Left */}
              <div className="avatar-left">
                <div className="avatar" aria-hidden="true">
                  {shownAvatar ? (
                    <img src={shownAvatar ?? undefined} alt="" />
                  ) : (
                    <span className="avatar-initials">{initials || "U"}</span>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="avatar-right">
                <div className="avatar-top">
                  <div className="avatar-cta">
                    <button
                      className="btn-grad"
                      onClick={onPickAvatar}
                      disabled={busy}
                    >
                      <Camera size={16} />
                      Change photo
                    </button>
                  </div>

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    style={{ display: "none" }}
                    disabled={busy}
                  />

                  <div className="hint">
                    PNG/JPG recommended. You’ll see a preview immediately.
                  </div>

                  <div className="avatar-divider" />
                </div>

                <div className="avatar-actions">
                  <button
                    className="btn"
                    onClick={onResetAvatar}
                    disabled={!avatarFile || uploading}
                    title={
                      !avatarFile
                        ? "Pick an image first"
                        : "Reset selected image"
                    }
                  >
                    <X size={16} />
                    Reset
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={onSaveAvatar}
                    disabled={uploading || isLoading || isError || !avatarFile}
                    title={
                      !avatarFile
                        ? "Pick an image to enable Save"
                        : "Upload avatar"
                    }
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save photo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Account details</div>

                {!isEditing ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading || isError}
                    title="Edit profile"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      onClick={onCancelEdit}
                      disabled={savingProfile}
                      title="Cancel changes"
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={onSaveProfile}
                      disabled={savingProfile || !profileChanged}
                      title={
                        !profileChanged ? "No changes to save" : "Save profile"
                      }
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="field">
                <div className="label">
                  <User size={14} />
                  Username
                </div>

                {!isEditing ? (
                  <div className="value">{displayName}</div>
                ) : (
                  <input
                    className="input"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Your name"
                    disabled={savingProfile}
                  />
                )}
              </div>

              <div className="field">
                <div className="label">
                  <Mail size={14} />
                  Email
                </div>

                {!isEditing ? (
                  <div className="value">{displayEmail}</div>
                ) : (
                  <input
                    className="input"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="you@example.com"
                    disabled={savingProfile}
                  />
                )}
              </div>

              {isEditing ? (
                <div className="hint" style={{ marginTop: 12 }}>
                  Tip: Email changes may require verification depending on your
                  backend rules.
                </div>
              ) : null}
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Mobile login</div>

                {!mobileOpen ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setMobileOpen(true);
                      setMobileDraft(
                        me?.mobileNumber?.replace("+91", "") ?? "",
                      );
                      setMobileOtp("");
                      setMobileStep("input");
                      setMobileError(null);
                    }}
                    disabled={busy}
                  >
                    <Smartphone size={16} />
                    {me?.mobileNumber ? "Update mobile" : "Link mobile"}
                  </button>
                ) : (
                  <div className="inline-actions">
                    <button
                      className="btn"
                      onClick={onCancelMobileLink}
                      disabled={mobileBusy}
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    {mobileStep === "input" ? (
                      <button
                        className="btn btn-primary"
                        onClick={onRequestMobileOtp}
                        disabled={mobileBusy}
                      >
                        {requestingMobileOtp ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Send OTP
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={onVerifyMobileOtp}
                        disabled={mobileBusy}
                      >
                        {verifyingMobileOtp ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Verifying…
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={16} />
                            Verify OTP
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!mobileOpen ? (
                <>
                  <div className="field">
                    <div className="label">
                      <Smartphone size={14} />
                      Mobile number
                    </div>
                    <div className="value">{displayMobile}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {me?.isMobileVerified ? (
                      <div className="status-pill ok">
                        <ShieldCheck size={12} />
                        Verified
                      </div>
                    ) : (
                      <div className="status-pill warn">
                        <Smartphone size={12} />
                        Not linked
                      </div>
                    )}
                  </div>

                  <div className="hint" style={{ marginTop: 12 }}>
                    {me?.isMobileVerified
                      ? "Your mobile number is linked and can be used for OTP login."
                      : "Link your mobile number to sign in with OTP later."}
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <div className="label">
                      <Smartphone size={14} />
                      Mobile number
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: "14px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.7)",
                          fontSize: "13px",
                        }}
                      >
                        +91
                      </div>

                      <input
                        className="input"
                        value={mobileDraft}
                        onChange={(e) => {
                          const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setMobileDraft(digits);
                        }}
                        placeholder="XXXXXXXXXX"
                        disabled={mobileBusy || mobileStep === "verify"}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  {mobileStep === "verify" ? (
                    <div className="field">
                      <div className="label">
                        <ShieldCheck size={14} />
                        OTP
                      </div>
                      <input
                        className="input"
                        value={mobileOtp}
                        onChange={(e) =>
                          setMobileOtp(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter OTP"
                        disabled={mobileBusy}
                      />
                    </div>
                  ) : null}

                  <div className="hint" style={{ marginTop: 12 }}>
                    {mobileStep === "input"
                      ? "We’ll send an OTP to this number to verify and link it to your current account."
                      : "Enter the OTP sent to your mobile number to complete verification."}
                  </div>

                  {mobileError ? (
                    <div className="error">{mobileError}</div>
                  ) : null}
                </>
              )}
            </div>

            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Security</div>

                {!pwdOpen ? (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setPwdOpen(true)}
                    disabled={busy}
                  >
                    <KeyRound size={16} />
                    Change password
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      onClick={() => {
                        setPwdOpen(false);
                        setPwdError(null);
                        setCurrentPwd("");
                        setNewPwd("");
                        setConfirmPwd("");
                      }}
                      disabled={changingPwd}
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={onSavePassword}
                      disabled={changingPwd}
                    >
                      {changingPwd ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!pwdOpen ? (
                <div className="hint">
                  Update your password regularly to keep your account secure.
                </div>
              ) : (
                <>
                  <div className="pwd-row">
                    <div className="field">
                      <div className="label">
                        <KeyRound size={14} />
                        Current password
                      </div>
                      <input
                        className="input"
                        type="password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        disabled={changingPwd}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="field">
                      <div className="label">
                        <KeyRound size={14} />
                        New password
                      </div>
                      <input
                        className="input"
                        type="password"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        disabled={changingPwd}
                        placeholder="Minimum 8 characters"
                      />
                    </div>

                    <div className="field">
                      <div className="label">
                        <KeyRound size={14} />
                        Confirm new password
                      </div>
                      <input
                        className="input"
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        disabled={changingPwd}
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>

                  {pwdError ? <div className="error">{pwdError}</div> : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
