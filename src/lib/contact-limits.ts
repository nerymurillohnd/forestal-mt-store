/**
 * Contact form field length limits — single source of truth.
 *
 * Imported by both ContactFormIsland.tsx (UI maxLength) and contact.ts (server validation).
 * Changing a value here enforces consistency in both layers simultaneously.
 *
 * Phone limits are intentionally asymmetric:
 *   - PHONE_NATIONAL: UI input accepts only the national number part
 *   - PHONE_FULL: backend receives national + dial code prefix (e.g., "+504 96997635")
 */

export const CONTACT_LIMITS = {
  firstName: 100,
  lastName: 100,
  company: 200,
  email: 254,
  country: 100,
  subject: 200,
  message: 5000,
  phoneNational: 30, // UI input — national number only
  phoneFull: 50, // backend — includes dial code prefix
} as const;
