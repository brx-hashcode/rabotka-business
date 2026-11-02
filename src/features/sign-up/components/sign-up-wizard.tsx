"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";

import { BusinessLockup } from "#/components/business-lockup";
import { Skeleton } from "#/components/ui/skeleton";
import { sessionUserKey } from "#/hooks/use-session-user";
import { friendlyError, httpStatusOf } from "#/lib/api/friendly-error";
import {
  getBusinessCatalog,
  reportSignUpProgress,
  sendSignUpCode,
} from "#/lib/api/signup-controller";
import { signUpSession } from "#/lib/auth/session-client";
import { toInternational } from "#/lib/phone";
import { useSignUpStore } from "#/stores/sign-up-store";
import { STEPS, type StepId } from "../steps";
import { AccountStep } from "./account-step";
import { DocumentsStep } from "./documents-step";
import { OrganisationStep } from "./organisation-step";
import { ReviewStep, SignUpDone } from "./review-step";
import { ProgressHeader, StepPhotoPanel } from "./sign-up-chrome";
import { VerifyStep } from "./verify-step";

const STEP_IDS = STEPS.map((s) => s.id) as StepId[];
const stepParser = parseAsStringLiteral(STEP_IDS).withDefault("account");

/**
 * The business sign-up: account holder → email code → organisation →
 * documents → review. The last step creates the profile, the business and
 * its documents in one request (src/app/session/sign-up) and signs in.
 *
 * The data lives in the sign-up store (zustand, this tab's sessionStorage),
 * the step in the URL (nuqs, `?etape=`): a reload resumes, and the browser's
 * back button goes back a step. A step the data does not reach yet — a link
 * to `?etape=documents` before the email is verified — shows the furthest
 * one that it does.
 */
export function SignUpWizard() {
  const queryClient = useQueryClient();
  const { data: catalog } = useQuery({
    queryKey: ["business-catalog"],
    queryFn: getBusinessCatalog,
    staleTime: Infinity,
  });

  const [etape, setEtape] = useQueryState("etape", stepParser.withOptions({ history: "push" }));
  const store = useSignUpStore();
  const { account, token, organisation, documents, previews, done } = store;
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Where to go once the email is verified again (an expired token). */
  const [resumeAt, setResumeAt] = useState<StepId | null>(null);

  // sessionStorage is read after the first render (see the store).
  useEffect(() => {
    void Promise.resolve(useSignUpStore.persist.rehydrate()).then(() => setHydrated(true));
  }, []);

  // Development only: ?preview=<1-5|done> fills the store with sample data,
  // to review a screen without filling the ones before it.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !hydrated) return;
    const preview = new URLSearchParams(globalThis.location.search).get("preview");
    if (!preview) return;
    const s = useSignUpStore.getState();
    s.setAccount({ firstName: "Awa", lastName: "Mabiala", email: "awa.mabiala@ecole-lauriers.cg", phone: "06 123 45 67" });
    s.setToken("preview");
    s.setOrganisation({
      name: "École Les Lauriers",
      category: "SCHOOL",
      legalForm: "ASSOCIATION",
      size: "21-100",
      registrationNumber: "",
      taxId: "M2024000123456A",
      statisticalId: "",
      address: "45 avenue de la Paix, Poto-Poto",
      country: "CG",
      city: "Brazzaville",
      website: "https://ecole-lauriers.cg",
      description: "",
    });
    s.setDocuments(
      Number(preview) >= 5 || preview === "done"
        ? { AGREMENT: { url: "", key: "preview", fileName: "agrement-ministere-2024.pdf", mimeType: "application/pdf" } }
        : {},
    );
    if (preview === "done") s.finish(false);
    else void setEtape(STEP_IDS[Math.min(Math.max(Number(preview) - 1, 0), 4)]);
  }, [hydrated, setEtape]);

  const reachable = !account ? 0 : !token ? 1 : !organisation ? 2 : 4;
  const step = Math.min(STEP_IDS.indexOf(etape), reachable);

  // Each step starts at the top of the form, not where the last one ended.
  useEffect(() => {
    globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [step, done]);

  function go(next: number) {
    setSubmitError(null);
    void setEtape(STEP_IDS[next]);
    if (token && next === 3) void reportSignUpProgress("DOCUMENTS", token);
    if (token && next === 4) void reportSignUpProgress("CONFIRMATION", token);
  }

  async function submit() {
    if (!account || !organisation || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    const phone = toInternational(account.phone, "CG");
    try {
      const { user, signInRequired } = await signUpSession({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone,
        address: organisation.address,
        countryCode: organisation.country,
        city: organisation.city,
        profileType: "EMPLOYER",
        readAndApprovedPolicies: true,
        signupToken: token,
        business: {
          name: organisation.name,
          category: organisation.category,
          legalForm: organisation.legalForm || undefined,
          size: organisation.size || undefined,
          registrationNumber: organisation.registrationNumber || undefined,
          taxId: organisation.taxId || undefined,
          statisticalId: organisation.statisticalId || undefined,
          address: `${organisation.address}, ${organisation.city}`,
          email: account.email,
          phone,
          website: organisation.website || undefined,
          description: organisation.description || undefined,
          documents: Object.entries(documents).map(([documentType, doc]) => ({
            documentType,
            url: doc.url,
            key: doc.key,
            fileName: doc.fileName,
          })),
        },
      });
      if (user) queryClient.setQueryData(sessionUserKey, user);
      // No router.refresh() here: the session cookie now exists, and a
      // refresh re-runs the auth gate, which sends a signed-in visitor of
      // /auth/* to /espace — before the done screen could be read.
      store.finish(signInRequired);
    } catch (err) {
      // The signup token lives an hour; past that the email has to be
      // verified again. A new code goes out and, once it is entered, the
      // review comes back with everything as it was.
      if (httpStatusOf(err) === 403) {
        store.setToken(null);
        setResumeAt("review");
        await sendSignUpCode({
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
        }).catch(() => undefined);
        toast.info("Pour finaliser, confirmez à nouveau votre adresse : un nouveau code vous a été envoyé.");
        void setEtape("verify");
        return;
      }
      setSubmitError(friendlyError(err, "La création du compte a échoué. Réessayez."));
    } finally {
      setSubmitting(false);
    }
  }

  function renderStep() {
    if (!hydrated) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-16 w-3/4 rounded-xl" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      );
    }
    if (done && store.doneEmail) {
      return (
        <SignUpDone
          email={store.doneEmail}
          signInRequired={store.signInRequired}
          onLeave={() => store.reset()}
        />
      );
    }
    switch (step) {
      case 0:
        return (
          <AccountStep
            defaultValues={account}
            onDone={async (values) => {
              // The same, already verified address keeps its token: no
              // second code for correcting a name.
              if (token && values.email === account?.email) {
                store.setAccount(values);
                go(organisation ? 4 : 2);
                return;
              }
              await sendSignUpCode({
                email: values.email,
                firstName: values.firstName,
                lastName: values.lastName,
              });
              store.setToken(null);
              store.setAccount(values);
              go(1);
            }}
          />
        );
      case 1:
        return account ? (
          <VerifyStep
            account={account}
            onBack={() => go(0)}
            onDone={(signupToken) => {
              store.setToken(signupToken);
              go(resumeAt ? STEP_IDS.indexOf(resumeAt) : 2);
              setResumeAt(null);
            }}
          />
        ) : null;
      case 2:
        return (
          <OrganisationStep
            catalog={catalog}
            defaultValues={organisation}
            onBack={() => go(0)}
            onDone={(values) => {
              // Another type asks for other papers.
              if (values.category !== organisation?.category) store.setDocuments({});
              store.setOrganisation(values);
              go(3);
            }}
          />
        );
      case 3:
        return catalog && organisation && token ? (
          <DocumentsStep
            catalog={catalog}
            category={organisation.category}
            signupToken={token}
            value={documents}
            previews={previews}
            onChange={store.setDocuments}
            onPreview={store.setPreview}
            onBack={() => go(2)}
            onDone={() => go(4)}
          />
        ) : null;
      case 4:
        return catalog && account && organisation ? (
          <ReviewStep
            catalog={catalog}
            account={account}
            organisation={organisation}
            documents={documents}
            previews={previews}
            pending={submitting}
            error={submitError}
            onEdit={go}
            onBack={() => go(3)}
            onSubmit={() => void submit()}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      <div className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-svh">
        <StepPhotoPanel index={step} done={done} />
      </div>

      <section className="flex min-h-svh min-w-0 flex-col px-5 pb-6 sm:px-10">
        <div className="mx-auto flex w-full max-w-136 flex-1 flex-col">
          {/* Below lg there is no photo panel, and so no brand: it goes here. */}
          <Link href="/" aria-label="Rabotka Business — accueil" className="mt-6 mb-2 self-start lg:hidden">
            <BusinessLockup compact />
          </Link>

          {/* Pinned while the form scrolls under it: where you are stays in
              view. Frosted rather than opaque, with a short fade below, so
              the fields blur away under it instead of being cut off; a
              little wider than the column so focus rings vanish too. */}
          <div className="sticky top-0 z-20 -mx-3 bg-card/70 px-3 pt-6 pb-4 backdrop-blur-xl backdrop-saturate-150 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-8 after:bg-linear-to-b after:from-card/80 after:to-transparent">
            <ProgressHeader index={step} done={done} onBack={hydrated && step > 0 ? () => go(step - 1) : undefined} />
          </div>

          <div className="flex-1 pt-8 pb-10 lg:pt-[7vh]">
            <div
              key={done ? "done" : step}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300"
            >
              {renderStep()}
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Rabotka · Vos données sont traitées conformément à notre{" "}
            <a href="https://www.rabotka.work/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
