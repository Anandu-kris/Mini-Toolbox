import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: authService.updateProfile,

    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data);

      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}