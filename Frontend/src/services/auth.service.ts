import { api } from "../lib/api";

// Types
export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string | null;
  name?: string | null;
  role?: "user" | "admin" | "operator";
  avatarUrl?: string | null;

  mobileNumber?: string | null;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  mfaEnabled?: boolean;
};

export type AuthResponse = {
  message: string;
  requiresMfa?: boolean;
  email?: string;
  user?: User;
  token?: string;
};

export type MobileOtpRequestPayload = {
  mobileNumber: string;
};

export type MobileOtpVerifyPayload = {
  mobileNumber: string;
  otpCode: string;
};

export type MfaVerifyPayload = {
  code: string;
};

export type BasicMessageResponse = {
  message: string;
};

export type UploadAvatarResponse = {
  msg: string;
  avatarUrl: string;
};

export type UpdateProfilePayload = {
  name?: string | null;
  email?: string | null;
};

export type UpdateProfileResponse = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type LinkMobileVerifyResponse = User;

export const authService = {
  // POST: /auth/login
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", payload);
    return res.data;
  },

  // POST: /auth/signup
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const res = await api.post("/auth/signup", payload);
    return res.data;
  },

  // GET: /auth/me
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  // POST: /auth/logout
  logout: async (): Promise<{ message: string }> => {
    const res = await api.post("/auth/logout");
    return res.data;
  },

  // POST: /auth/avatar
  uploadAvatar: async (file: File): Promise<UploadAvatarResponse> => {
    const form = new FormData();
    form.append("avatar", file);

    const res = await api.post("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },

  //PATCH: /auth/me
  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<UpdateProfileResponse> => {
    const res = await api.patch("/auth/me", payload);
    return res.data;
  },

  //PATCH: /auth/me/password
  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse> => {
    const res = await api.patch("/auth/me/password", payload);
    return res.data;
  },

  // POST: /auth/mobile/request-otp
  requestMobileOtp: async (
    payload: MobileOtpRequestPayload,
  ): Promise<BasicMessageResponse> => {
    const res = await api.post("/auth/mobile/request-otp", payload);
    return res.data;
  },

  // POST: /auth/mobile/verify-otp
  verifyMobileOtp: async (
    payload: MobileOtpVerifyPayload,
  ): Promise<AuthResponse> => {
    const res = await api.post("/auth/mobile/verify-otp", payload);
    return res.data;
  },

  // POST: /auth/mfa/verify
  verifyMfa: async (
    payload: MfaVerifyPayload,
  ): Promise<BasicMessageResponse> => {
    const res = await api.post("/auth/mfa/verify", payload);
    return res.data;
  },

  // POST: /auth/me/mobile/request-otp
  requestLinkMobileOtp: async (
    payload: MobileOtpRequestPayload,
  ): Promise<BasicMessageResponse> => {
    const res = await api.post("/auth/me/mobile/request-otp", payload);
    return res.data;
  },

  // POST: /auth/me/mobile/verify-otp
  verifyLinkMobileOtp: async (
    payload: MobileOtpVerifyPayload,
  ): Promise<LinkMobileVerifyResponse> => {
    const res = await api.post("/auth/me/mobile/verify-otp", payload);
    return res.data;
  },
};
