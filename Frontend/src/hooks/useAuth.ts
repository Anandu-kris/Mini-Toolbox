import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export const useLogin = () =>
  useMutation({
    mutationFn: authService.login,
  });

export const useSignup = () =>
  useMutation({
    mutationFn: authService.signup,
  });

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.getCurrentUser,
    retry: false,
  });
