export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return '/projects';
  if (['/', '/projects', '/projects/new', '/orders', '/account'].includes(value)) return value;
  if (/^\/projects\/cloud\/[0-9a-f]{24}$/.test(value)) return value;
  return /^\/projects\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : '/projects';
}

export function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@\x00-\x1f]+@[^\s@\x00-\x1f]+\.[^\s@\x00-\x1f]+$/.test(value);
}

export function validCode(value: unknown): value is string {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

export function profileInput(value: unknown): { display_name: string; phone: string | null } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['display_name', 'phone'].includes(key))) return null;
  if (typeof input.display_name !== 'string' || input.display_name.trim().length > 80 || /[\x00-\x1f\x7f]/.test(input.display_name)) return null;
  if (typeof input.phone !== 'string') return null;
  const phone = input.phone.trim();
  if (phone && (!/^\+?[0-9 ()-]{7,25}$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, '')))) return null;
  return { display_name: input.display_name.trim(), phone: input.phone.trim() || null };
}

export function authErrorMessage(code: string | undefined, status?: number): string {
  if (status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'Too many attempts. Wait a minute before trying again.';
  if (code === 'otp_expired' || code === 'otp_disabled' || code === 'validation_failed') return 'That code is invalid or has expired. Check it or request a new code.';
  if (code === 'email_address_not_authorized') return 'Email delivery is restricted. Contact the studio owner to enable this address.';
  if (code === 'signup_disabled') return 'New accounts are currently unavailable. Contact the studio owner.';
  return 'Sign-in could not be completed. Check your connection and try again.';
}
