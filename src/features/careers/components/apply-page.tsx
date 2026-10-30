"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IconArrowLeft, IconCheck, IconFileText, IconUpload, IconX } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Bone } from "#/components/page-skeletons";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { applyToOffer, getCareersOffer, type CareersQuestion } from "#/lib/api/careers-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";
import { CareersShell } from "./careers-shell";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const field = "h-12 rounded-xl border-0 bg-page px-4 text-base shadow-none md:text-[15px]";
const label = "font-medium text-sm";

/** Step 2: who they are, their CV, and the offer's own questions. No account. */
export function ApplyPage({ slug, reference }: Readonly<{ slug: string; reference: string }>) {
  const query = useQuery({
    queryKey: ["careers", slug, reference],
    queryFn: () => getCareersOffer(slug, reference),
    retry: false,
  });
  const page = query.data;
  const [details, setDetails] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const questions = page?.offer.questions ?? [];
  const missing = questions.some((q) => q.required && !answers[q.id]?.trim());
  const ready = !!cv && consent && !missing && Object.values(details).every((v) => v.trim());

  const send = useMutation({
    mutationFn: () =>
      applyToOffer(slug, reference, {
        ...details,
        cv: cv as File,
        website: trap,
        answers: questions.flatMap((q) => (answers[q.id]?.trim() ? [{ questionId: q.id, value: answers[q.id].trim() }] : [])),
      }),
  });

  function pick(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setCvError("Ce fichier dépasse 10 Mo.");
      return;
    }
    setCvError("");
    setCv(file);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ready) send.mutate();
  }

  return (
    <CareersShell>
      <section className="space-y-7 rounded-3xl bg-card p-6 sm:p-10">
        {query.isLoading ? (
          <div className="space-y-4">
            <Bone className="h-6 w-2/3" />
            <Bone className="h-48 w-full rounded-2xl" />
          </div>
        ) : !page ? (
          <div className="space-y-3 text-center">
            <h1 className="font-semibold text-lg">Cette offre n&apos;est plus ouverte</h1>
            <Link href={`/carrieres/${slug}`} className="inline-block font-medium text-sm underline underline-offset-2">
              Voir les autres offres
            </Link>
          </div>
        ) : send.isSuccess ? (
          <div className="space-y-5">
            <div className="flex gap-3 rounded-2xl bg-brand-lime p-5 text-[#0f2414]">
              <IconCheck className="mt-0.5 size-6 shrink-0" />
              <div className="space-y-1">
                <h1 className="font-semibold text-lg">Candidature envoyée</h1>
                <p className="text-[15px]">
                  {page.company.name} a bien reçu votre dossier. Un e-mail de confirmation vous a été envoyé.
                </p>
              </div>
            </div>
            <Link href={`/carrieres/${slug}`} className="inline-block font-medium text-sm underline underline-offset-2">
              Voir les autres offres de {page.company.name}
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <Link
              href={`/carrieres/${slug}/${reference}`}
              className="inline-flex items-center gap-1.5 font-medium text-foreground/70 text-sm hover:text-foreground"
            >
              <IconArrowLeft className="size-4" />
              Retour à l&apos;offre
            </Link>
            <div>
              <h1 className="font-semibold text-2xl tracking-tight">Votre candidature</h1>
              <p className="font-medium text-foreground/70">
                {page.offer.title} · {page.company.name}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField title="Prénom" autoComplete="given-name" value={details.firstName} onChange={(v) => setDetails({ ...details, firstName: v })} />
              <TextField title="Nom" autoComplete="family-name" value={details.lastName} onChange={(v) => setDetails({ ...details, lastName: v })} />
              <TextField title="E-mail" type="email" autoComplete="email" value={details.email} onChange={(v) => setDetails({ ...details, email: v })} />
              <TextField title="Téléphone" type="tel" autoComplete="tel" value={details.phone} onChange={(v) => setDetails({ ...details, phone: v })} />
            </div>

            <div className="space-y-1.5">
              <p className={label}>CV</p>
              <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
              {cv ? (
                <div className="flex items-center gap-3 rounded-xl bg-page p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-[#0f2414]">
                    <IconFileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-sm">{cv.name}</span>
                  <button
                    type="button"
                    aria-label="Retirer ce CV"
                    onClick={() => {
                      setCv(null);
                      if (input.current) input.current.value = "";
                    }}
                    className="rounded-lg p-2 hover:bg-card"
                  >
                    <IconX className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl bg-page px-4 py-7 text-center transition-colors hover:bg-page/70"
                >
                  <IconUpload className="size-6" />
                  <span className="font-medium">Ajouter votre CV</span>
                  <span className="text-foreground/60 text-xs">PDF ou Word, 10 Mo au plus</span>
                </button>
              )}
              {cvError && <p className="text-destructive text-sm">{cvError}</p>}
            </div>

            {questions.map((q) => (
              <QuestionField key={q.id} question={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
            ))}

            {/* Out of sight and of tab order: only a bot fills it. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
            />

            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} className="mt-0.5" />
              <span>
                J&apos;accepte que {page.company.name} traite ces informations pour ma candidature.{" "}
                <a href="https://www.rabotka.work/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Confidentialité
                </a>
              </span>
            </label>

            {send.isError && (
              <p className="text-destructive text-sm">{friendlyError(send.error, "La candidature n'a pas pu être envoyée. Réessayez.")}</p>
            )}

            <button
              type="submit"
              disabled={!ready || send.isPending}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-[17px] text-white disabled:opacity-50"
            >
              {send.isPending && <Loader className="size-5 animate-spin" />}
              Envoyer ma candidature
            </button>
          </form>
        )}
      </section>
    </CareersShell>
  );
}

function TextField({
  title,
  value,
  onChange,
  type = "text",
  autoComplete,
}: Readonly<{ title: string; value: string; onChange: (v: string) => void; type?: string; autoComplete?: string }>) {
  return (
    <label className="block space-y-1.5">
      <span className={label}>{title}</span>
      <Input type={type} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} required className={field} />
    </label>
  );
}

function QuestionField({
  question: q,
  value,
  onChange,
}: Readonly<{ question: CareersQuestion; value: string; onChange: (v: string) => void }>) {
  const title = (
    <p className={label}>
      {q.label}
      {q.required && <span className="text-destructive"> *</span>}
    </p>
  );
  if (q.kind === "YES_NO") {
    return (
      <div className="space-y-1.5">
        {title}
        <div className="flex gap-2">
          {[
            { value: "yes", text: "Oui" },
            { value: "no", text: "Non" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "h-11 flex-1 rounded-full font-medium text-sm transition-colors sm:flex-none sm:px-8",
                value === o.value ? "bg-ink text-white" : "bg-page hover:bg-page/70",
              )}
            >
              {o.text}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (q.kind === "CHOICE") {
    return (
      <div className="space-y-1.5">
        {title}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={cn(field, "w-full")}>
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {q.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {title}
      <Input value={value} maxLength={300} onChange={(e) => onChange(e.target.value)} aria-label={q.label} className={field} />
    </div>
  );
}
