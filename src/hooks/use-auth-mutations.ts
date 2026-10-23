import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { resendOtp, sendOtp } from "#/lib/api/auth-controller";
import { logoutSession, verifySession } from "#/lib/auth/session-client";
import { sessionUserKey } from "./use-session-user";

export function useSendOtpMutation() {
  return useMutation({ mutationFn: (email: string) => sendOtp(email) });
}

export function useResendOtpMutation() {
  return useMutation({ mutationFn: (email: string) => resendOtp(email) });
}

/**
 * Exchange the code for a session (cookies set by /session/verify), then
 * leave the sign-in route. `router.refresh()` re-runs the root layout so the
 * header switches to the signed-in view.
 */
export function useVerifyOtpMutation(redirectTo: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: verifySession,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(sessionUserKey, user);
      router.replace(redirectTo);
      router.refresh();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      queryClient.clear();
      router.replace("/auth/sign-in");
      router.refresh();
    },
  });
}
