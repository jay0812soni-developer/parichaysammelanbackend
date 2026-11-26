import { z } from 'zod';

export const entryBodySchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(255),
  age: z.coerce.number().int().min(18).max(80),
  whatsapp: z.string().trim().min(8).max(30),
  gender: z.enum(['Male', 'Female']),
  height_cm: z.coerce.number().int().min(120).max(220),
  manglik: z.enum(['Yes', 'No']),
  marital_status: z.string().trim().min(1).max(255),
  study: z.string().trim().min(1).max(255),
  yearly_income: z.coerce.number().min(0),
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  father_name: z.string().trim().min(1).max(255),
  father_gautra: z.string().trim().min(1).max(255),
  mother_name: z.string().trim().min(1).max(255),
  mother_father_name: z.string().trim().min(1).max(255),
  mother_gautra: z.string().trim().min(1).max(255),
  mother_parents_address: z.string().trim().min(1),
  present_address: z.string().trim().min(1),
  permanent_address: z.string().trim().min(1),
  photo_url: z.string().url().optional(),
  cloudinary_public_id: z.string().optional().nullable(),
});

export const ownerParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  email: z.string().email(),
});

/** Mask Aadhaar for list views: show last 4 only */
export function maskAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length < 4) return '****';
  return `XXXXXXXX${aadhaar.slice(-4)}`;
}

export function publicEntry(row, { fullAadhaar = false } = {}) {
  if (!row) return null;
  const { aadhaar, ...rest } = row;
  return {
    ...rest,
    aadhaar: fullAadhaar ? aadhaar : maskAadhaar(aadhaar),
  };
}
