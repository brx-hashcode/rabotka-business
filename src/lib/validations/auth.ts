import { z } from "zod";

export const emailSchema = z.email("Saisissez une adresse email valide");

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "Le code contient 6 chiffres");
