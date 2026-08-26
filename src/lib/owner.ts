/** Único e-mail autorizado a ter sessão no app. Qualquer outro é deslogado. */
export const PLATFORM_OWNER_EMAIL = "oluciano.dosantos@gmail.com";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return (email || "").trim().toLowerCase() === PLATFORM_OWNER_EMAIL;
}
