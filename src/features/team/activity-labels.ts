/**
 * How a line of « Activité » reads: the API logs `METHOD /route/:pattern`
 * (stable), the space words it. Ordered: the first rule that matches wins.
 * A change not listed here still shows, as « a fait une modification ».
 */
const RULES: [RegExp, string][] = [
  // Offers
  [/^POST \/job-offers$/, "a publié une offre"],
  [/^POST \/job-offers\/:\w+\/close$/, "a fermé une offre"],
  [/^POST \/job-offers\/:\w+\/republish$/, "a republié une offre"],
  [/^PATCH \/profile\/job-offers\/:\w+$/, "a modifié une offre"],
  [/^DELETE \/profile\/job-offers\/:\w+$/, "a supprimé une offre"],
  [/^POST \/profile\/job-offers\/:\w+\/confirm-hire$/, "a confirmé une embauche"],
  // Candidates
  [/^POST \/profile\/applications\/:\w+\/accept$/, "a retenu un candidat"],
  [/^POST \/business\/me\/external-applications\/:\w+\/retain$/, "a retenu un candidat"],
  [/^POST \/profile\/applications\/:\w+\/reject$/, "a refusé un candidat"],
  [/^POST \/business\/me\/external-applications\/:\w+\/refuse$/, "a refusé un candidat"],
  [/^POST \/business\/me\/offers\/:\w+\/applications\/refuse$/, "a refusé des candidats"],
  [/^POST \/profile\/applications\/:\w+\/rate$/, "a noté un candidat"],
  [/\/unlock\//, "a obtenu un contact"],
  [/^POST \/business\/me\/contacts\/:\w+$/, "a obtenu un contact"],
  [/^POST \/business\/me\/applications\/:\w+\/:\w+\/notes$/, "a laissé une note"],
  [/^PATCH \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "a modifié une note"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "a supprimé une note"],
  [/^PUT \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "a donné son avis"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "a retiré son avis"],
  // Interviews
  [/^POST \/business\/me\/interviews\/calendar\/reset$/, "a changé le lien de l'agenda"],
  [/^POST \/business\/me\/interviews$/, "a proposé un entretien"],
  [/^PATCH \/business\/me\/interviews\/:\w+$/, "a déplacé un entretien"],
  [/^POST \/business\/me\/interviews\/:\w+\/cancel$/, "a annulé un entretien"],
  // CVs and profiles
  [/^POST \/business\/me\/cv-screenings\/:\w+\/comparisons$/, "a comparé des CV"],
  [/^POST \/business\/me\/(cv-screenings|external-applications\/analyse)$/, "a lancé une analyse de CV"],
  [/^DELETE \/business\/me\/cv-screenings\/:\w+$/, "a supprimé une analyse de CV"],
  [/^PUT \/business\/me\/talents\/:\w+$/, "a ajouté un profil à Mes profils"],
  [/^DELETE \/business\/me\/talents\/:\w+$/, "a retiré un profil de Mes profils"],
  [/^POST \/business\/me\/talents\/:\w+\/invite$/, "a invité un profil à postuler"],
  [/^POST \/business\/me\/mailboxes\/:\w+\/connect$/, "a connecté une messagerie"],
  [/^DELETE \/business\/me\/mailboxes\/:\w+$/, "a déconnecté une messagerie"],
  // The account
  [/^POST \/business\/me\/team$/, "a invité un membre"],
  [/^POST \/business\/me\/team\/:\w+\/resend$/, "a renvoyé une invitation"],
  [/^PATCH \/business\/me\/team\/:\w+$/, "a changé un rôle"],
  [/^DELETE \/business\/me\/team\/:\w+$/, "a retiré un membre"],
  [/^\w+ \/business\/me\/careers-page/, "a modifié la page carrières"],
  [/^POST \/business\/me\/documents$/, "a envoyé un document"],
  [/^POST \/profile\/avatar$/, "a changé le logo"],
  [/^PATCH \/business\/me$/, "a modifié l'organisation"],
  [/^POST \/business\/me\/subscription/, "a choisi une formule"],
];

export function activityLabel(action: string): string {
  return RULES.find(([r]) => r.test(action))?.[1] ?? "a fait une modification";
}

/** The offer a line is about, to link to it; null when it is about something else. */
export function activityOfferId(action: string, targetId: string | null): string | null {
  if (!targetId) return null;
  return /^\w+ \/(job-offers|profile\/job-offers|business\/me\/offers)\/:\w+/.test(action) ? targetId : null;
}
