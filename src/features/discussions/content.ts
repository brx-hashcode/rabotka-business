/**
 * The discussions' words. The client app's, except where a business differs:
 * it gets a candidate's details by retaining them on an offer, in « Profils
 * contactés » — never over WhatsApp.
 */
export const discussionsContent = {
  list: {
    title: "Discussions",
    emptyTitle: "Aucune discussion",
    emptyDescription: "Écrivez à un candidat depuis l'une de vos offres : vos échanges apparaîtront ici.",
    closed: "Discussion close",
    searchPlaceholder: "Rechercher un candidat, une offre…",
    filterAll: "Toutes",
    filterUnread: "Non lues",
    noSearchResult: "Aucune discussion ne correspond à votre recherche.",
    noUnread: "Vous avez tout lu.",
    pick: "Choisissez une discussion pour l'afficher.",
    delete: "Supprimer la discussion",
    deleteConfirm: "Oui, supprimer",
    /** Said before, because « supprimer » here is for you only, as on WhatsApp. */
    deleteExplain:
      "La discussion disparaîtra de votre liste uniquement. Votre interlocuteur la conserve, et elle réapparaîtra s'il vous écrit de nouveau.",
    deleted: "Discussion supprimée",
    deleteFailed: "La discussion n'a pas pu être supprimée",
  },
  thread: {
    placeholder: "Écrivez votre message…",
    send: "Envoyer",
    closed: "Cette discussion est close, vous ne pouvez plus écrire.",
    empty: "Écrivez le premier message.",
    older: "Messages précédents",
    olderLoading: "Chargement…",
    online: "en ligne",
    deleted: "Ce message a été supprimé",
    actionsDelete: "Supprimer le message",
    actionsDeleteConfirm: "Oui, supprimer",
    /** The opposite of the conversation-level one: this reaches the other side too. */
    actionsDeleteExplain: "Le message sera retiré des deux côtés. Votre interlocuteur verra qu'un message a été supprimé.",
    actionsDeleted: "Message supprimé",
    actionsDeleteFailed: "Le message n'a pas pu être supprimé",
    sendFailed: "Le message n'a pas pu être envoyé",
    viewOffer: "Voir l'offre",
    viewProfile: "Voir le profil",
  },
  /** The standing rule, said before it is enforced, and how to get details instead. */
  warning: {
    header: "Numéros et e-mails sont toujours masqués ici. Pour obtenir les coordonnées, retenez le candidat sur votre offre.",
    sender: "Ce fragment n'a pas été transmis. Les coordonnées ne s'échangent pas dans la discussion.",
    recipient:
      "Les coordonnées sont toujours masquées ici. Elles s'obtiennent en retenant le candidat, puis s'affichent avec « Contact » sur sa candidature.",
    held: "Ce message n'a pas été transmis : il contenait des coordonnées.",
    reportCta: "Signaler une erreur",
    reportConfirm: "Confirmer le signalement",
    reportDone: "Merci, votre signalement a été enregistré.",
  },
};
