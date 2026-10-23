"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { BusinessLockup } from "#/components/business-lockup";
import { sessionUserKey } from "#/hooks/use-session-user";
import { friendlyError, httpStatusOf } from "#/lib/api/friendly-error";
import {
  getBusinessCatalog,
  reportSignUpProgress,
  sendSignUpCode,
} from "#/lib/api/signup-controller";
import { signUpSession } from "#/lib/auth/session-client";
import { toInternational } from "#/lib/phone";
import { AccountStep, type AccountValues } from "./account-step";
import { DocumentsStep, type DocumentsValue } from "./documents-step";
import { OrganisationStep, type OrganisationValues } from "./organisation-step";
import { ReviewStep, SignUpDone } from "./review-step";
import { ProgressHeader, StepPhotoPanel } from "./sign-up-chrome";
import { VerifyStep } from "./verify-step";

/**
 * The business sign-up: account holder → email code → organisation →
 * documents → review. Everything stays in this component's state until the
 * last step, which creates the profile, the business and its documents in
 * one request (src/app/session/sign-up) and signs the person in.
 *
 * Not persisted: the signup token behind the uploads lives an hour and is
 * not something to leave in storage. A reload starts over.
 */
export function SignUpWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: catalog } = useQuery({
    queryKey: ["business-catalog"],
    queryFn: getBusinessCatalog,
    staleTime: Infinity,
  });

  const [step, setStep] = useState(0);
  const [account, setAccount] = useState<AccountValues>();
  const [token, setToken] = useState<string | null>(null);
  const [organisation, setOrganisation] = useState<OrganisationValues>();
  const [documents, setDocuments] = useState<DocumentsValue>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /** Where to go once the email is verified again (an expired token). */
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  function applyPreview(preview: string) {
    setAccount({ firstName: "Awa", lastName: "Mabiala", email: "awa.mabiala@ecole-lauriers.cg", phone: "06 123 45 67" });
    setToken("preview");
    setOrganisation({
      name: "École Les Lauriers",
      category: "SCHOOL",
      legalForm: "ASSOCIATION",
      size: "21-100",
      registrationNumber: "",
      taxId: "M2024000123456A",
      statisticalId: "",
      address: "45 avenue de la Paix, Poto-Poto",
      city: "Brazzaville",
      website: "https://ecole-lauriers.cg",
      description: "",
    });
    setDocuments(
      Number(preview) >= 5 || preview === "done"
        ? { AGREMENT: { url: "", key: "", fileName: "agrement-ministere-2024.pdf" } }
        : {},
    );
    if (preview === "done") setDone(true);
    else setStep(Math.min(Math.max(Number(preview) - 1, 0), 4));
  }

  // Development only: /auth/sign-up?preview=<1-5|done> opens that step with
  // sample data, to review a screen without filling the ones before it.
  // Dead code in a production build (NODE_ENV is inlined).
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const preview = new URLSearchParams(globalThis.location.search).get("preview");
    if (!preview) return;
    const timer = setTimeout(() => applyPreview(preview), 0);
    return () => clearTimeout(timer);
  }, []);


  // Each step starts at the top of the form, not where the last one ended.
  useEffect(() => {
    globalThis.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [step, done]);

  function go(next: number) {
    setSubmitError(null);
    setStep(next);
    if (token && next === 3) void reportSignUpProgress("DOCUMENTS", token);
    if (token && next === 4) void reportSignUpProgress("CONFIRMATION", token);
  }

  async function submit() {
    if (!account || !organisation || !token) return;
    setSubmitting(true);
    setSubmitError(null);
    const phone = toInternational(account.phone, "CG");
    try {
      const { user } = await signUpSession({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone,
        address: organisation.address,
        countryCode: "CG",
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
      queryClient.setQueryData(sessionUserKey, user);
      setDone(true);
      router.refresh();
    } catch (err) {
      // The signup token lives an hour; past that the email has to be
      // verified again. A new code goes out and, once it is entered, the
      // review comes back with everything as it was.
      if (httpStatusOf(err) === 403) {
        setToken(null);
        setResumeAt(4);
        await sendSignUpCode({
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
        }).catch(() => undefined);
        toast.info("Pour finaliser, confirmez à nouveau votre adresse : un nouveau code vous a été envoyé.");
        setStep(1);
        return;
      }
      setSubmitError(friendlyError(err, "La création du compte a échoué. Réessayez."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      <div className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-svh">
        <StepPhotoPanel index={step} done={done} />
      </div>

      <section className="flex min-h-svh min-w-0 flex-col px-5 py-6 sm:px-10">
        <div className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col">
          {/* Below lg there is no photo panel, and so no brand: it goes here. */}
          <Link href="/" aria-label="Rabotka Business — accueil" className="mb-8 self-start lg:hidden">
            <BusinessLockup compact />
          </Link>

          <ProgressHeader index={step} done={done} />

          <div className="flex-1 pt-12 pb-10 lg:pt-[9vh]">
            <div key={done ? "done" : step} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300">
              {done && account ? (
                <SignUpDone email={account.email} />
              ) : step === 0 ? (
                <AccountStep
                  defaultValues={account}
                  onDone={async (values) => {
                    // The same, already verified address keeps its token: no
                    // second code for correcting a name.
                    if (token && values.email === account?.email) {
                      setAccount(values);
                      go(organisation ? 4 : 2);
                      return;
                    }
                    await sendSignUpCode({
                      email: values.email,
                      firstName: values.firstName,
                      lastName: values.lastName,
                    });
                    setToken(null);
                    setAccount(values);
                    go(1);
                  }}
                />
              ) : step === 1 && account ? (
                <VerifyStep
                  account={account}
                  onBack={() => go(0)}
                  onDone={(signupToken) => {
                    setToken(signupToken);
                    go(resumeAt ?? 2);
                    setResumeAt(null);
                  }}
                />
              ) : step === 2 ? (
                <OrganisationStep
                  catalog={catalog}
                  defaultValues={organisation}
                  onBack={() => go(0)}
                  onDone={(values) => {
                    // Another category asks for other papers.
                    if (values.category !== organisation?.category) setDocuments({});
                    setOrganisation(values);
                    go(3);
                  }}
                />
              ) : step === 3 && catalog && organisation && token ? (
                <DocumentsStep
                  catalog={catalog}
                  category={organisation.category}
                  signupToken={token}
                  value={documents}
                  onChange={setDocuments}
                  onBack={() => go(2)}
                  onDone={() => go(4)}
                />
              ) : step === 4 && catalog && account && organisation ? (
                <ReviewStep
                  catalog={catalog}
                  account={account}
                  organisation={organisation}
                  documents={documents}
                  pending={submitting}
                  error={submitError}
                  onEdit={go}
                  onBack={() => go(3)}
                  onSubmit={() => void submit()}
                />
              ) : null}
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
