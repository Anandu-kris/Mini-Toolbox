import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      queryClient.clear();
    },
  });
};
