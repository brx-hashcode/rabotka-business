import type { OfferStatus } from "./offer-controller";

/**
 * The signed-in person, as `auth/mobile/verify-otp` returns them
 * (MobileSessionUser in rabotka-backend). Snake case: it is the backend's own
 * shape, passed through unchanged.
 */
export type SessionUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  avatar_url: string | null;
  profile_type: string;
  description: string;
  domains: { id: string; name: string }[];
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

/** `GET public/business/catalog` (businessCatalog in rabotka-backend). */
export type DocumentRequirement = {
  /** « One of » groups: any one type of a group satisfies it. */
  required: string[][];
  optional: string[];
};

export type BusinessCatalog = {
  categories: {
    value: string;
    label: string;
    legalForms: string[];
    documents: DocumentRequirement;
  }[];
  legalForms: { value: string; label: string }[];
  documentTypes: { value: string; label: string }[];
  sizes: string[];
};

/** `POST profile/kyc-upload`: the stored file. `url` is a preview that expires. */
export type UploadedFile = { url: string; key: string };

export type BusinessSignUpBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  countryCode: string;
  city?: string;
  profileType: "EMPLOYER";
  readAndApprovedPolicies: true;
  signupToken: string;
  business: {
    name: string;
    category: string;
    legalForm?: string;
    size?: string;
    registrationNumber?: string;
    taxId?: string;
    statisticalId?: string;
    address: string;
    email?: string;
    phone?: string;
    website?: string;
    description?: string;
    documents: {
      documentType: string;
      url: string;
      key: string;
      fileName?: string;
    }[];
  };
};

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type BusinessDocumentVersion = {
  id: string;
  documentType: string;
  label: string;
  fileName: string | null;
  mimeType: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

/** `GET business/me` (the same shape the admin reviews). */
export type MyBusiness = {
  id: string;
  name: string;
  /** The account's profile picture, used as the logo. */
  logoUrl: string | null;
  category: string;
  categoryLabel: string;
  legalForm: string | null;
  legalFormLabel: string | null;
  size: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  statisticalId: string | null;
  address: string;
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  /** The person who opened the account and signs in with it. */
  owner?: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    directPhone: string | null;
    createdAt: string;
  };
  /** The current papers, each with what it replaced (newest first). */
  documents: (BusinessDocumentVersion & {
    resubmitted: boolean;
    previousVersions: BusinessDocumentVersion[];
  })[];
  requiredDocuments: { type: string; label: string }[][];
  missingDocuments: { type: string; label: string }[][];
};

/** `PATCH business/me`: only what changed; null empties an optional field. */
export type UpdateMyBusiness = Partial<{
  name: string;
  category: string;
  legalForm: string | null;
  size: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  statisticalId: string | null;
  address: string;
  countryCode: string;
  city: string | null;
  website: string | null;
  description: string | null;
}>;

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type BillingPeriod = "TRIAL" | "MONTHLY" | "ANNUAL";

/** A business plan (`GET business/plans`). Null quota: unlimited. */
export type BusinessPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceFcfa: number;
  annualPriceFcfa: number;
  unlocksPerPeriod: number | null;
  activeOffersLimit: number | null;
  /** CVs the AI sorting reads per period. Null: unlimited; 0: not in the plan. */
  cvScreeningsPerPeriod: number | null;
  cvBatchMax: number;
  cvFileMaxMb: number;
  cvRetentionDays: number;
  cvChatQuestions: number;
  includesPreselection: boolean;
  includesFieldAgents: boolean;
  priorityVisibility: boolean;
};

export type SubscriptionPeriod = {
  id: string;
  planName: string;
  planCode: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  startsAt: string;
  endsAt: string;
  unlocksUsed: number;
  paid: boolean;
  granted: boolean;
};

/** `GET business/me/subscription`. */
export type MySubscription = {
  entitlements: {
    plan: { id: string; code: string; name: string } | null;
    status: SubscriptionStatus | null;
    endsAt: string | null;
    unlocksRemaining: number | null;
    unlocksQuota: number | null;
    unlocksUsed: number;
    activeOffersLimit: number | null;
    activeOffers: number;
    /** CVs the AI sorting may still read this period. Null: unlimited; 0: none. */
    cvRemaining: number | null;
    cvQuota: number | null;
    cvUsed: number;
    cvBatchMax: number;
    cvFileMaxMb: number;
    cvRetentionDays: number;
    /** Questions about one analysed CV; 0: no chat. */
    cvChatQuestions: number;
    includesPreselection: boolean;
    includesFieldAgents: boolean;
    priorityVisibility: boolean;
  };
  upcoming: SubscriptionPeriod[];
  history: SubscriptionPeriod[];
  plans: BusinessPlan[];
  trialUsed: boolean;
};

/** One mobile-money network the active gateway charges (`GET payment-gateways`). */
export type PaymentOperator = {
  code: string;
  label: string;
  country?: string;
  countryName?: string;
  /** The gateway's flag image for the country. */
  countryFlag?: string;
  dialCode?: string;
  logo?: string;
  currency?: string;
};

export type PaymentGateways = {
  active: string | null;
  gateways: { key: string; label: string; requiresOperator: boolean; operators: PaymentOperator[] }[];
};

/** `GET pay/:token` (fails once the request is settled). */
export type PaymentByToken = {
  id: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
  gateway: string | null;
  amount: number | null;
  description: string | null;
  payerCountry?: string | null;
};

/** `GET business/me/stats`: recruitment figures, each with the previous period. */
export type StatsPeriod = 7 | 30 | 90;
export type BusinessStats = {
  period: { days: StatsPeriod; from: string; to: string };
  offers: { open: number; total: number; openPositions: number; published: number; publishedPrevious: number };
  applications: { received: number; receivedPrevious: number; toReview: number; overdue: number; perOffer: number | null };
  hires: { count: number; previous: number };
  funnel: { received: number; viewed: number; hired: number; started: number; completed: number };
  timing: {
    firstApplicantHours: number | null;
    firstApplicantHoursPrevious: number | null;
    responseHours: number | null;
    responseHoursPrevious: number | null;
    timeToHireDays: number | null;
    timeToHireDaysPrevious: number | null;
  };
  quality: {
    fillRate: number | null;
    positionsProposed: number;
    positionsFilled: number;
    noShowRate: number | null;
    missionsEnded: number;
    ratingGiven: number | null;
    ratingsGivenCount: number;
    ratingReceived: number | null;
    ratingsReceivedCount: number;
  };
  contacts: { unlocked: number; unlockedPrevious: number };
  series: { date: string; applications: number; hires: number }[];
  topOffers: {
    id: string;
    title: string;
    status: OfferStatus;
    quantity: number;
    hired: number;
    applications: number;
    toReview: number;
    createdAt: string;
  }[];
  categories: { name: string; applications: number }[];
};

/** `GET business/me/contacts`: a worker whose contact the business unlocked. */
export type ContactedProfile = {
  workerId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  /** The number WhatsApp runs on. */
  phone: string;
  /** A number for calls, when it is not the WhatsApp one. */
  directPhone?: string | null;
  email: string | null;
  city: string | null;
  categoryName: string | null;
  unlockedAt: string;
  origin: "MISSION" | "DIRECT" | string;
  offers: { id: string; title: string }[];
};

/** « Analyse de CV » (`business/me/cv-screenings`). */
export type CvResumeStatus = "QUEUED" | "SCORED" | "UNREADABLE" | "FAILED";
export type CvCriterion = "skills" | "experience" | "training" | "location" | "languages";

export type CvScreeningSummary = {
  id: string;
  jobTitle: string;
  offerId: string | null;
  status: "PROCESSING" | "DONE";
  createdAt: string;
  /** When the files and contact details go; the scores stay. */
  expiresAt: string;
  purged: boolean;
  total: number;
  done: number;
  scored: number;
  bestScore: number | null;
  /** The name the best CV gives, when it gives one. */
  bestCandidate: string | null;
  averageScore: number | null;
  /** Scored CVs per verdict: ≥80, 60–79, 40–59, <40. */
  bands: { very: number; good: number; partial: number; low: number };
};

export type CvResume = {
  id: string;
  /** 1 for the best scored CV; null until scored, or when it could not be read. */
  rank: number | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hasFile: boolean;
  status: CvResumeStatus;
  score: number | null;
  criteria: Partial<Record<CvCriterion, number>> | null;
  summary: string | null;
  strengths: string[];
  gaps: string[];
  candidate: {
    name: string | null;
    currentTitle: string | null;
    city: string | null;
    yearsExperience: number | null;
    email: string | null;
    phone: string | null;
  } | null;
  error: string | null;
};

export type CvScreening = CvScreeningSummary & { jobText: string; resumes: CvResume[] };

/** A business's conversation about one analysed CV. */
export type CvChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
export type CvChat = {
  messages: CvChatMessage[];
  /** Questions the plan allows per CV, and those left for this one. */
  limit: number;
  remaining: number;
  /** False once the CV's file was purged: the conversation stays readable, no new question. */
  available: boolean;
};

/** A conversation comparing 2 to 5 CVs of one analysis (one per selection). */
export type CvComparison = CvChat & { id: string; resumeIds: string[] };

/** « Entretiens » (`business/me/interviews`). */
export type InterviewMode = "IN_PERSON" | "PHONE" | "VIDEO";
export type InterviewStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "RESCHEDULE_REQUESTED" | "CANCELLED";
export type InterviewAnswer = "CONFIRMED" | "DECLINED" | "RESCHEDULE_REQUESTED";

export type InterviewSlot = {
  startsAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  /** The address, the video link, or the number to call. */
  location?: string;
  message?: string;
};

export type InterviewInput = InterviewSlot & {
  /** One of the two: an analysed CV or an application. */
  cvResumeId?: string;
  applicationId?: string;
  /** For an analysed CV: where the invitation goes. */
  candidateEmail?: string;
};

export type Interview = {
  id: string;
  cvResumeId: string | null;
  applicationId: string | null;
  offerId: string | null;
  jobTitle: string;
  candidateName: string;
  /** Null for an applicant: their e-mail is never shown here. */
  candidateEmail: string | null;
  startsAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  location: string | null;
  message: string | null;
  status: InterviewStatus;
  responseNote: string | null;
  respondedAt: string | null;
  createdAt: string;
};

/** What the candidate sees behind their private link. */
export type InterviewInvitation = {
  businessName: string;
  businessLogoUrl: string | null;
  jobTitle: string;
  candidateName: string;
  startsAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  location: string | null;
  message: string | null;
  status: InterviewStatus;
  responseNote: string | null;
  past: boolean;
};
