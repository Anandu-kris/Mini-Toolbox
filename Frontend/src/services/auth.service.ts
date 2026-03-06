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
  email: string;
  name?: string | null;
  role?: "user" | "admin" | "operator";
  avatarUrl?: string | null;
};

export type AuthResponse = {
  message: string;
  user: User;
  token?: string;
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

  //PATCH /auth/me/password
  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse> => {
    const res = await api.patch("/auth/me/password", payload);
    return res.data;
  },
};
