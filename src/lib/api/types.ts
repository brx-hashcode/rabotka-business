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
