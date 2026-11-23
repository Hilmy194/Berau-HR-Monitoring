/**
 * Corporate email domains allowed to access/login to Harmoni:
 * 1. beraucoal.co.id       (PT Berau Coal - email kantor utama)
 * 2. beraucoalenergy.co.id (PT Berau Coal Energy Tbk)
 * 3. techconnect.co.id     (Techconnect)
 * 4. mtl.co.id             (PT Mutiara Tanjung Lestari)
 */

export const ALLOWED_EMAIL_DOMAINS = [
  "beraucoal.co.id",
  "beraucoalenergy.co.id",
  "techconnect.co.id",
  "mtl.co.id",
] as const;

export type AllowedEmailDomain = (typeof ALLOWED_EMAIL_DOMAINS)[number];

export const ALLOWED_EMAIL_DOMAINS_DISPLAY =
  "@beraucoal.co.id, @beraucoalenergy.co.id, @techconnect.co.id, @mtl.co.id";

export const INVALID_EMAIL_DOMAIN_ERROR = "Akun tidak ditemukan";

/**
 * Validates whether an email belongs to the permitted corporate domains.
 * Allows corporate domains, as well as explicit SUPER_ADMIN_EMAIL / harmoni.com in dev mode.
 */
export function isAllowedLoginEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;

  const normalized = email.toLowerCase().trim();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex === -1) return false;

  const domain = normalized.slice(atIndex + 1);
  if (!domain) return false;

  // Check against allowed corporate domains (supports exact domain or corporate subdomains)
  const isCorporateDomain = ALLOWED_EMAIL_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );

  if (isCorporateDomain) {
    return true;
  }

  // Allow explicit SUPER_ADMIN_EMAIL if configured in environment
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();
  if (superAdminEmail && normalized === superAdminEmail) {
    return true;
  }

  // In non-production environments (development/test), allow harmoni.com for seeded dev accounts
  if (
    process.env.NODE_ENV !== "production" &&
    (domain === "harmoni.com" || normalized === "superadmin@harmoni.com")
  ) {
    return true;
  }

  return false;
}
