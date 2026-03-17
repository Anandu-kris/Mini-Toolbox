export function maskMobileNumber(mobile?: string | null) {
  if (!mobile) return "Not linked";

  const clean = mobile.replace(/\s+/g, "");

  if (clean.length <= 7) return clean;

  const start = clean.slice(0, 5);       
  const end = clean.slice(-2);          
  const masked = "X".repeat(clean.length - 7);

  return start + masked + end;          
}