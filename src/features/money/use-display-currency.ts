"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyBusiness, myBusinessKey } from "#/lib/api/business-controller";
import { getPaymentCurrency } from "#/lib/api/payment-controller";
import { formatPrice, XAF, type DisplayCurrency } from "./money";

/**
 * The currency this business sees Rabotka's prices in: its organisation's
 * country's (the DRC in dollars), FCFA in the CFA zone or while unknown.
 */
export function useDisplayCurrency(): {
  currency: DisplayCurrency;
  /** An XAF price, said in that currency. */
  price: (xaf: number) => string;
} {
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const country = business.data?.countryCode ?? null;
  const rate = useQuery({
    queryKey: ["payment-currency", country],
    queryFn: () => getPaymentCurrency(country as string),
    enabled: !!country,
    staleTime: 30 * 60 * 1000,
  });
  const currency = rate.data ?? XAF;
  return { currency, price: (xaf) => formatPrice(xaf, currency) };
}
