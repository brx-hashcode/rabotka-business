"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormControl, FormField, FormItem, FormMessage } from "#/components/ui/form";
import { Textarea } from "#/components/ui/textarea";
import { FieldLabel, StepActions, TextField } from "#/features/sign-up/components/form-bits";
import { claimsKey, createClaim, uploadClaimImages } from "#/lib/api/claim-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { ImagePicker } from "./claim-bits";

/** The client app's rules. */
const schema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200, "Titre trop long"),
  description: z.string().trim().min(10, "10 caractères au moins").max(2000, "2 000 caractères au plus"),
});
type Values = z.infer<typeof schema>;

export function NewClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", description: "" } });

  const send = useMutation({
    mutationFn: async (v: Values) => {
      // Photos first: the claim references the urls the server wrote them to.
      const attachment_urls = files.length ? await uploadClaimImages(files) : undefined;
      return createClaim({ title: v.title, description: v.description, attachment_urls });
    },
    onSuccess: (claim) => {
      void queryClient.invalidateQueries({ queryKey: claimsKey });
      toast.success("Réclamation envoyée. L'équipe Rabotka vous répond ici.");
      router.push(`/espace/reclamations/${claim.id}`);
    },
    onError: (err) => toast.error(friendlyError(err, "La réclamation n'a pas pu être envoyée.")),
  });

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/reclamations" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Réclamations
      </Link>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Nouvelle réclamation</h1>
        <p className="text-muted-foreground">Dites-nous ce qui ne va pas : l&apos;équipe Rabotka vous répond dans votre espace.</p>
      </div>

      <section className="max-w-3xl rounded-3xl bg-card p-5 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => send.mutate(v))} noValidate className="space-y-6">
            <TextField control={form.control} name="title" label="Objet" placeholder="Ex. : candidat absent le jour de la mission" autoFocus />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel>Description</FieldLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={6}
                      placeholder="Ce qui s'est passé, l'offre ou le candidat concerné, ce que vous attendez…"
                      className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FieldLabel optional>Photos</FieldLabel>
              <ImagePicker files={files} onChange={setFiles} disabled={send.isPending} />
              <p className="text-muted-foreground text-xs">Jusqu&apos;à 3 photos, JPG, PNG ou WEBP, 5 Mo chacune.</p>
            </div>
            <StepActions onBack={() => router.push("/espace/reclamations")} continueLabel="Envoyer" pending={send.isPending} />
          </form>
        </Form>
      </section>
    </div>
  );
}
