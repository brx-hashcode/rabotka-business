"use client";

import { useLocale } from "next-intl";
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
  /**
   * The currency is known: the organisation is loaded and, outside the CFA
   * zone, its rate is in (or failed, FCFA then). Until then a price would
   * show in FCFA and jump: draw a skeleton instead.
   */
  ready: boolean;
} {
  const locale = useLocale();
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const country = business.data?.countryCode ?? null;
  const rate = useQuery({
    queryKey: ["payment-currency", country],
    queryFn: () => getPaymentCurrency(country as string),
    enabled: !!country,
    staleTime: 30 * 60 * 1000,
  });
  const currency = rate.data ?? XAF;
  const ready = !business.isPending && (!country || !rate.isPending);
  return { currency, price: (xaf) => formatPrice(xaf, currency, locale), ready };
}
