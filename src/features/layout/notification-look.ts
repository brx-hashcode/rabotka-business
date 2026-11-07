import {
  IconBellFilled,
  IconBrandLinkedin,
  IconBrandLinkedinFilled,
  IconCalendarFilled,
  IconCalendarOff,
  IconCreditCardFilled,
  IconCreditCardOff,
  IconCrownFilled,
  IconCirclePlusFilled,
  IconFileAlert,
  IconFileSearch,
  IconGiftFilled,
  IconHourglassFilled,
  IconLockOpen,
  IconMailFilled,
  IconMessageCircleQuestion,
  IconMessageFilled,
  IconRosetteDiscountCheckFilled,
  IconShieldOff,
  IconSpeakerphone,
  IconUserFilled,
  IconUserMinus,
  IconUserPlus,
  type Icon,
} from "@tabler/icons-react";

export type Look = { icon: Icon; tone: string };

// One colour per kind of news, so the bell reads at a glance.
const CANDIDATE = "bg-chip-violet text-chip-violet-foreground";
const INTERVIEW = "bg-chip-sky text-chip-sky-foreground";
const GOOD = "bg-chip-green text-chip-green-foreground";
const WATCH = "bg-chip-amber text-chip-amber-foreground";
const BAD = "bg-destructive/10 text-destructive";
const NEUTRAL = "bg-page text-foreground";
/** LinkedIn's own blue: the post is on LinkedIn. */
const LINKEDIN = "bg-[#0a66c2] text-white";

/** Each notification type's icon and tint in the bell; anything else gets a plain bell. */
const LOOK: Record<string, Look> = {
  NEW_APPLICATION: { icon: IconUserPlus, tone: CANDIDATE },
  APPLICATION_CANCELLED: { icon: IconUserMinus, tone: WATCH },
  APPLICATION_ACCEPTED: { icon: IconUserFilled, tone: GOOD },
  MISSION_COMPLETED: { icon: IconUserFilled, tone: GOOD },
  CONTACT_UNLOCKED: { icon: IconLockOpen, tone: GOOD },
  UNLOCK_CONVERTED_TO_CREDIT: { icon: IconLockOpen, tone: GOOD },
  CV_SCREENING_DONE: { icon: IconFileSearch, tone: CANDIDATE },
  LINKEDIN_POST: { icon: IconBrandLinkedinFilled, tone: LINKEDIN },
  INTERVIEW_INVITED: { icon: IconCalendarFilled, tone: INTERVIEW },
  INTERVIEW_ANSWERED: { icon: IconMessageCircleQuestion, tone: INTERVIEW },
  INTERVIEW_CANCELLED: { icon: IconCalendarOff, tone: WATCH },
  JOB_INVITATION: { icon: IconMailFilled, tone: CANDIDATE },
  JOB_OFFER_EXPIRING: { icon: IconHourglassFilled, tone: WATCH },
  JOB_OFFER_EXPIRED: { icon: IconHourglassFilled, tone: WATCH },
  NEW_MESSAGE: { icon: IconMessageFilled, tone: NEUTRAL },
  PAYMENT_SUCCEEDED: { icon: IconCreditCardFilled, tone: GOOD },
  PAYMENT_FAILED: { icon: IconCreditCardOff, tone: BAD },
  BUSINESS_VERIFIED: { icon: IconRosetteDiscountCheckFilled, tone: GOOD },
  BUSINESS_REJECTED: { icon: IconShieldOff, tone: BAD },
  BUSINESS_DOCUMENT_REJECTED: { icon: IconFileAlert, tone: BAD },
  BUSINESS_TRIAL_STARTED: { icon: IconGiftFilled, tone: GOOD },
  BUSINESS_SUBSCRIPTION_ACTIVE: { icon: IconCrownFilled, tone: GOOD },
  BUSINESS_CREDITS_ADDED: { icon: IconCirclePlusFilled, tone: GOOD },
  BUSINESS_SUBSCRIPTION_GRANTED: { icon: IconCrownFilled, tone: GOOD },
  BUSINESS_SUBSCRIPTION_EXPIRING: { icon: IconHourglassFilled, tone: WATCH },
  BUSINESS_SUBSCRIPTION_EXPIRED: { icon: IconHourglassFilled, tone: BAD },
  BUSINESS_SUBSCRIPTION_CANCELLED: { icon: IconHourglassFilled, tone: BAD },
  CLAIM_COMMENTED: { icon: IconMessageFilled, tone: NEUTRAL },
  CLAIM_STATUS_CHANGED: { icon: IconMessageFilled, tone: NEUTRAL },
  ACCOUNT_SUSPENDED: { icon: IconShieldOff, tone: BAD },
  ANNOUNCEMENT: { icon: IconSpeakerphone, tone: NEUTRAL },
};

/**
 * The icon and tint of a notification. A LinkedIn post that did not go out
 * (its title says « non aboutie », notification-catalog.ts) is not LinkedIn
 * blue but a warning.
 */
export function notificationLook(type: string, title = ""): Look {
  if (type === "LINKEDIN_POST" && /non abouti/i.test(title)) {
    return { icon: IconBrandLinkedin, tone: WATCH };
  }
  return LOOK[type] ?? { icon: IconBellFilled, tone: NEUTRAL };
}
