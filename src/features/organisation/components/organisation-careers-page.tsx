"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPhotoPlus, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Input } from "#/components/ui/input";
import {
  addCareersPhoto,
  careersPageKey,
  getCareersPage,
  removeCareersCover,
  removeCareersPhoto,
  setCareersBenefits,
  uploadCareersCover,
  type CareersPage,
} from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const MAX_PHOTOS = 6;
const MAX_BENEFITS = 8;
const MAX_BYTES = 8 * 1024 * 1024;

/** One image picked from the device, checked before it is sent. */
function usePicker(onFile: (file: File) => void) {
  const input = useRef<HTMLInputElement>(null);
  const element = (
    <input
      ref={input}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.size > MAX_BYTES) toast.error("Cette photo dépasse 8 Mo.");
        else onFile(file);
      }}
    />
  );
  return { open: () => input.current?.click(), element };
}

/**
 * What the careers page shows of the organisation besides its offers: a wide
 * cover photo, up to six photos and a few benefits.
 */
export function OrganisationCareersPage() {
  const queryClient = useQueryClient();
  const page = useQuery({ queryKey: careersPageKey, queryFn: getCareersPage });
  const [benefit, setBenefit] = useState("");
  const done = (next: CareersPage) => queryClient.setQueryData(careersPageKey, next);
  const save = useMutation({
    mutationFn: (run: () => Promise<CareersPage>) => run(),
    onSuccess: done,
    onError: (err) => toast.error(friendlyError(err, "La page n'a pas pu être mise à jour.")),
  });
  const cover = usePicker((file) => save.mutate(() => uploadCareersCover(file)));
  const photo = usePicker((file) => save.mutate(() => addCareersPhoto(file)));

  const data = page.data;
  if (!data) return null;

  const addBenefit = () => {
    const text = benefit.trim();
    if (!text) return;
    save.mutate(() => setCareersBenefits([...data.benefits, text]));
    setBenefit("");
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">Votre page carrières</h2>
        <p className="text-muted-foreground text-sm">Ce que les candidats voient de vous, à côté de vos offres.</p>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">Photo de couverture</p>
        {data.coverUrl ? (
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- the business's own upload */}
            <img src={data.coverUrl} alt="" className="aspect-[3/1] w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button type="button" onClick={cover.open} className="rounded-full bg-card/90 px-3 py-1.5 font-medium text-xs">
                Changer
              </button>
              <button
                type="button"
                aria-label="Retirer la photo de couverture"
                onClick={() => save.mutate(removeCareersCover)}
                className="rounded-full bg-card/90 p-1.5"
              >
                <IconX className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={cover.open}
            disabled={save.isPending}
            className="flex aspect-[3/1] w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-page text-muted-foreground text-sm hover:text-foreground"
          >
            <IconPhotoPlus className="size-6" />
            Ajouter une photo large (bureaux, équipe, chantier…)
          </button>
        )}
        {cover.element}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">
          Photos <span className="font-normal text-muted-foreground">({data.photos.length}/{MAX_PHOTOS})</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {data.photos.map((src, i) => (
            <div key={src} className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- the business's own upload */}
              <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                aria-label={`Retirer la photo ${i + 1}`}
                onClick={() => save.mutate(() => removeCareersPhoto(i))}
                className="absolute top-1.5 right-1.5 rounded-full bg-card/90 p-1"
              >
                <IconTrash className="size-3.5" />
              </button>
            </div>
          ))}
          {data.photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={photo.open}
              disabled={save.isPending}
              aria-label="Ajouter une photo"
              className="flex aspect-[4/3] items-center justify-center rounded-xl bg-page text-muted-foreground hover:text-foreground"
            >
              <IconPlus className="size-5" />
            </button>
          )}
        </div>
        {photo.element}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-sm">Avantages</p>
        {data.benefits.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {data.benefits.map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5 rounded-full bg-page py-1.5 pr-1.5 pl-3 font-medium text-sm">
                {b}
                <button
                  type="button"
                  aria-label={`Retirer ${b}`}
                  onClick={() => save.mutate(() => setCareersBenefits(data.benefits.filter((x) => x !== b)))}
                  className="rounded-full p-0.5 text-muted-foreground hover:bg-card hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {data.benefits.length < MAX_BENEFITS && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addBenefit();
            }}
            className="flex gap-2"
          >
            <Input
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              maxLength={80}
              placeholder="Repas offert, transport, formation…"
              className="h-11 rounded-xl border-0 bg-page px-4 shadow-none"
            />
            <button type="submit" disabled={!benefit.trim() || save.isPending} className="h-11 shrink-0 rounded-xl bg-ink px-4 font-medium text-sm text-white disabled:opacity-50">
              Ajouter
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
