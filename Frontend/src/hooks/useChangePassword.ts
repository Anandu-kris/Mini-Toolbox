// hooks/useChangePassword.ts
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
  });
}