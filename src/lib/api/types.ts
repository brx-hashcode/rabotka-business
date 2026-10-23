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
