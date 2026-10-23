import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AccountValues } from "#/features/sign-up/components/account-step";
import type { DocumentsValue } from "#/features/sign-up/components/documents-step";
import type { OrganisationValues } from "#/features/sign-up/components/organisation-step";

type SignUpState = {
  account?: AccountValues;
  /** From signup/verify-otp; an hour, then the email is verified again. */
  token: string | null;
  organisation?: OrganisationValues;
  documents: DocumentsValue;
  /** Local previews of the files picked this session, by storage key. */
  previews: Record<string, string>;
  done: boolean;
  /** The account exists but no session came back: sign in by email code. */
  signInRequired: boolean;
  /** The email the account was created with, for the done screen only. */
  doneEmail: string | null;

  setAccount: (account: AccountValues) => void;
  setToken: (token: string | null) => void;
  setOrganisation: (organisation: OrganisationValues) => void;
  setDocuments: (documents: DocumentsValue) => void;
  setPreview: (key: string, url: string) => void;
  finish: (signInRequired: boolean) => void;
  reset: () => void;
};

const INITIAL = {
  account: undefined,
  token: null,
  organisation: undefined,
  documents: {},
  previews: {},
  done: false,
  signInRequired: false,
  doneEmail: null,
};

/**
 * The business sign-up in progress. Kept in sessionStorage — this tab only,
 * gone with it — so a reload resumes where it was instead of starting over;
 * the step itself is in the URL (nuqs, `?etape=`).
 *
 * The signup token is in there too: a one-hour capability limited to this
 * sign-up (uploads, then creating the one profile it was issued for), spent
 * as soon as the profile exists. Previews are object URLs of local files,
 * valid only in this page, so they are never stored.
 *
 * `skipHydration`: storage is read after the first render (rehydrate in the
 * wizard), so the server's HTML and the browser's first render agree.
 */
export const useSignUpStore = create<SignUpState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      setAccount: (account) => set({ account }),
      setToken: (token) => set({ token }),
      setOrganisation: (organisation) => set({ organisation }),
      setDocuments: (documents) => set({ documents }),
      setPreview: (key, url) => set({ previews: { ...get().previews, [key]: url } }),
      // The form is emptied the moment the account exists: nothing of it
      // stays in the tab, and coming back to the sign-up starts afresh. Only
      // the email survives, in memory, for the done screen.
      finish: (signInRequired) => {
        for (const url of Object.values(get().previews)) URL.revokeObjectURL(url);
        set({
          ...INITIAL,
          done: true,
          signInRequired,
          doneEmail: get().account?.email ?? null,
        });
      },
      reset: () => {
        for (const url of Object.values(get().previews)) URL.revokeObjectURL(url);
        set(INITIAL);
      },
    }),
    {
      name: "rabotka-business-sign-up",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (state) => {
        const persisted: Partial<SignUpState> = { ...state };
        delete persisted.previews;
        // Not kept either: a reload after the account exists shows an empty
        // form, not the done screen with nothing behind it.
        delete persisted.done;
        delete persisted.signInRequired;
        delete persisted.doneEmail;
        return persisted;
      },
    },
  ),
);
