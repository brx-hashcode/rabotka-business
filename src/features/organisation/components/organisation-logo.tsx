"use client";

import { useRef, useState } from "react";
import { IconBuilding, IconCamera } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { uploadMyBusinessLogo } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The organisation's logo — the account's profile picture, the image
 * candidates see on its offers. Sent as soon as it is picked.
 */
export function OrganisationLogo({
  name,
  logoUrl,
  onUploaded,
}: Readonly<{ name: string; logoUrl: string | null; onUploaded: (url: string) => void }>) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function send(file: File) {
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non accepté : envoyez une image JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde : 5 Mo maximum.");
      return;
    }
    setPending(true);
    try {
      const { avatarUrl } = await uploadMyBusinessLogo(file);
      onUploaded(avatarUrl);
      toast.success("Logo mis à jour.");
    } catch (err) {
      toast.error(friendlyError(err, "Le logo n'a pas pu être envoyé. Réessayez."));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <Avatar className="size-20">
          {logoUrl && <AvatarImage src={logoUrl} alt={name} className="object-cover" />}
          <AvatarFallback className="bg-page">
            <IconBuilding className="size-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          aria-label="Changer le logo"
          className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink/90 disabled:opacity-100"
        >
          {pending ? <Loader className="size-4 animate-spin" /> : <IconCamera className="size-4" />}
        </button>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-medium">Logo</p>
        <p className="text-muted-foreground text-sm">
          Visible par les candidats sur vos offres. JPG, PNG ou WEBP, 5 Mo maximum.
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send(file);
        }}
      />
    </div>
  );
}
