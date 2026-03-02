import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export const useUploadAvatar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.uploadAvatar,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};