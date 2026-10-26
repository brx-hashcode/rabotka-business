import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";

export type InvoiceReason = "BUSINESS_SUBSCRIPTION" | "CONTACT_UNLOCK" | "PENALTY" | "WALLET_TOP_UP" | "OTHER";

export type Invoice = {
  id: string;
  paymentRequestId: string | null;
  /** Decimal as a string, FCFA. */
  amount: string;
  reason: InvoiceReason | (string & {});
  status: "PENDING_DOWNLOAD" | "DOWNLOADED";
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
};

/** The client app's invoice endpoints (`invoices`): the account's own, owner only. Never the WhatsApp send. */
class InvoiceController extends BusinessBaseController {
  list(): Promise<Invoice[]> {
    return this.get("/invoices");
  }
}

const controller = new InvoiceController();

export const listInvoices = controller.list.bind(controller);
export const invoicesKey = ["invoices"] as const;

/** The PDF, same-origin: the proxy adds the session. */
export function invoiceDownloadUrl(id: string): string {
  return `${appConfig.apiUrl}/invoices/${encodeURIComponent(id)}/download`;
}
