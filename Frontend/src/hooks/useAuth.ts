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
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

export const useRequestMobileOtp = () =>
  useMutation({
    mutationFn: authService.requestMobileOtp,
  });

export const useVerifyMobileOtp = () =>
  useMutation({
    mutationFn: authService.verifyMobileOtp,
  });

export const useVerifyMfa = () =>
  useMutation({
    mutationFn: authService.verifyMfa,
  });

export const useRequestLinkMobileOtp = () =>
  useMutation({
    mutationFn: authService.requestLinkMobileOtp,
  });

export const useVerifyLinkMobileOtp = () =>
  useMutation({
    mutationFn: authService.verifyLinkMobileOtp,
  });
