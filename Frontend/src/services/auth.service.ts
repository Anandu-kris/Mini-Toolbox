import { api } from "../lib/api";


// Types
export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  name?: string | null;
  role?: "user" | "admin" | "operator";
};

export type AuthResponse = {
  message: string;
  user: User;
  token?: string;
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
};
