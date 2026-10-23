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
