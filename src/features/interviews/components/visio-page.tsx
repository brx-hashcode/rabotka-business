"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { IconArrowLeft, IconExternalLink, IconVideo } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { friendlyError, httpStatusOf } from "#/lib/api/friendly-error";
import { joinVisioAsGuest, joinVisioAsHost } from "#/lib/api/interview-controller";
import type { VisioJoin } from "#/lib/api/types";

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** Signed in, but not this room's business (or no longer signed in): a guest. */
async function join(room: string, signedIn: boolean): Promise<VisioJoin> {
  if (!signedIn) return joinVisioAsGuest(room);
  try {
    return await joinVisioAsHost(room);
  } catch (error) {
    const status = httpStatusOf(error);
    if (status === 401 || status === 403 || status === 404) return joinVisioAsGuest(room);
    throw error;
  }
}

/**
 * An interview's video call, inside the app: the business joins as host
 * (from « Entretiens »), the candidate as a guest by the link it was sent.
 */
export function VisioPage({ room, signedIn }: Readonly<{ room: string; signedIn: boolean }>) {
  const router = useRouter();
  const [left, setLeft] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery({
    queryKey: ["visio", room, signedIn],
    queryFn: () => join(room, signedIn),
    retry: false,
    // The token is signed for this visit: never refetched behind the call.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const v = query.data;

  if (v?.provider === "jaas" && !left) {
    return (
      <main className="flex h-svh flex-col bg-page">
        <header className="flex items-center gap-3 px-4 py-3">
          {v.host ? (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Retour aux entretiens"
              render={<Link href="/espace/entretiens" />}
            >
              <IconArrowLeft className="size-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{v.jobTitle}</p>
            <p className="truncate text-muted-foreground text-xs">
              {v.host ? `Avec ${v.candidateName}` : v.businessName} · {when(v.startsAt)}
            </p>
          </div>
        </header>
        <div className="min-h-0 flex-1 px-2 pb-2 sm:px-4 sm:pb-4">
          <div className="h-full overflow-hidden rounded-3xl bg-card">
            <JaaSMeeting
              key={attempt}
              appId={v.appId}
              roomName={v.roomName}
              jwt={v.jwt}
              lang="fr"
              configOverwrite={{
                prejoinConfig: { enabled: true },
                // Stay in the browser on phones, instead of « Get the app ».
                disableDeepLinking: true,
                disableInviteFunctions: true,
                subject: v.jobTitle,
              }}
              interfaceConfigOverwrite={{ SHOW_PROMOTIONAL_CLOSE_PAGE: false }}
              getIFrameRef={(node) => {
                node.style.height = "100%";
                node.style.width = "100%";
              }}
              onReadyToClose={() => (v.host ? router.push("/espace/entretiens") : setLeft(true))}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        <section className="space-y-5 rounded-3xl bg-card p-6 text-center sm:p-8">
          {query.isLoading ? (
            <div className="space-y-4">
              <Bone className="mx-auto h-6 w-2/3" />
              <Bone className="h-12 w-full rounded-full" />
            </div>
          ) : !v ? (
            <div className="space-y-2">
              <h1 className="font-semibold text-lg">Visio indisponible</h1>
              <p className="text-muted-foreground text-sm">
                {friendlyError(query.error, "Ce lien de visio n'est plus valable. Utilisez le dernier e-mail reçu.")}
              </p>
            </div>
          ) : (
            <>
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-page">
                <IconVideo className="size-5 text-muted-foreground" />
              </span>
              <div className="space-y-1">
                <h1 className="font-semibold text-lg">{v.jobTitle}</h1>
                <p className="text-muted-foreground text-sm">
                  {v.host ? `Avec ${v.candidateName}` : v.businessName} · {when(v.startsAt)}
                </p>
              </div>
              {v.provider === "jitsi" ? (
                <Button className="w-full rounded-full" render={<a href={v.url} target="_blank" rel="noreferrer" />}>
                  Rejoindre la visio
                  <IconExternalLink className="size-4" />
                </Button>
              ) : (
                <>
                  <p className="text-sm">Vous avez quitté la visio.</p>
                  <Button
                    className="w-full rounded-full"
                    onClick={() => {
                      setAttempt((n) => n + 1);
                      setLeft(false);
                    }}
                  >
                    Revenir dans la visio
                  </Button>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
