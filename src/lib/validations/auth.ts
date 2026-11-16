import { z } from "zod";

/** Built with the reader's sentence (auth.validation.*): the schema itself has no language. */
export const emailSchema = (message: string) => z.email(message);

export const otpSchema = (message: string) => z.string().regex(/^\d{6}$/, message);
