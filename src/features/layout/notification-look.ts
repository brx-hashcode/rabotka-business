import {
  IconBell,
  IconBrandLinkedin,
  IconRosetteDiscountCheck,
  IconCalendarEvent,
  IconCrown,
  IconGift,
  IconCalendarOff,
  IconCreditCard,
  IconCreditCardOff,
  IconFileAlert,
  IconFileSearch,
  IconHourglass,
  IconLockOpen,
  IconMailForward,
  IconMessage,
  IconMessageCircleQuestion,
  IconShieldOff,
  IconSpeakerphone,
  IconUserCheck,
  IconUserMinus,
  IconUserPlus,
  type Icon,
} from "@tabler/icons-react";

type Look = { icon: Icon; tone: string };

const GREEN = "bg-chip-green text-chip-green-foreground";
const VIOLET = "bg-chip-violet text-chip-violet-foreground";
const AMBER = "bg-chip-amber text-chip-amber-foreground";
const RED = "bg-destructive/10 text-destructive";
const NEUTRAL = "bg-page text-foreground";

/** Each notification type's icon and tint in the bell; anything else gets a plain bell. */
const LOOK: Record<string, Look> = {
  NEW_APPLICATION: { icon: IconUserPlus, tone: VIOLET },
  APPLICATION_CANCELLED: { icon: IconUserMinus, tone: AMBER },
  APPLICATION_ACCEPTED: { icon: IconUserCheck, tone: GREEN },
  MISSION_COMPLETED: { icon: IconUserCheck, tone: GREEN },
  CONTACT_UNLOCKED: { icon: IconLockOpen, tone: GREEN },
  UNLOCK_CONVERTED_TO_CREDIT: { icon: IconLockOpen, tone: GREEN },
  CV_SCREENING_DONE: { icon: IconFileSearch, tone: VIOLET },
  LINKEDIN_POST: { icon: IconBrandLinkedin, tone: VIOLET },
  INTERVIEW_INVITED: { icon: IconCalendarEvent, tone: VIOLET },
  INTERVIEW_ANSWERED: { icon: IconMessageCircleQuestion, tone: VIOLET },
  INTERVIEW_CANCELLED: { icon: IconCalendarOff, tone: AMBER },
  JOB_INVITATION: { icon: IconMailForward, tone: VIOLET },
  JOB_OFFER_EXPIRING: { icon: IconHourglass, tone: AMBER },
  JOB_OFFER_EXPIRED: { icon: IconHourglass, tone: AMBER },
  NEW_MESSAGE: { icon: IconMessage, tone: NEUTRAL },
  PAYMENT_SUCCEEDED: { icon: IconCreditCard, tone: GREEN },
  PAYMENT_FAILED: { icon: IconCreditCardOff, tone: RED },
  BUSINESS_VERIFIED: { icon: IconRosetteDiscountCheck, tone: GREEN },
  BUSINESS_REJECTED: { icon: IconShieldOff, tone: RED },
  BUSINESS_DOCUMENT_REJECTED: { icon: IconFileAlert, tone: RED },
  BUSINESS_TRIAL_STARTED: { icon: IconGift, tone: GREEN },
  BUSINESS_SUBSCRIPTION_ACTIVE: { icon: IconCrown, tone: GREEN },
  BUSINESS_SUBSCRIPTION_GRANTED: { icon: IconCrown, tone: GREEN },
  BUSINESS_SUBSCRIPTION_EXPIRING: { icon: IconHourglass, tone: AMBER },
  BUSINESS_SUBSCRIPTION_EXPIRED: { icon: IconHourglass, tone: RED },
  BUSINESS_SUBSCRIPTION_CANCELLED: { icon: IconHourglass, tone: RED },
  CLAIM_COMMENTED: { icon: IconMessage, tone: NEUTRAL },
  CLAIM_STATUS_CHANGED: { icon: IconMessage, tone: NEUTRAL },
  ACCOUNT_SUSPENDED: { icon: IconShieldOff, tone: RED },
  ANNOUNCEMENT: { icon: IconSpeakerphone, tone: NEUTRAL },
};

export function notificationLook(type: string): Look {
  return LOOK[type] ?? { icon: IconBell, tone: NEUTRAL };
}
