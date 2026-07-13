const RESEND_FUNCTION_URL = `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/resend-email`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

type EmailType =
  | "welcome"
  | "verify_email"
  | "password_reset"
  | "booking_confirmation"
  | "booking_reminder"
  | "purchase_confirmation"
  | "newsletter_welcome"
  | "signup_confirmation";

interface SendEmailOptions {
  type: EmailType;
  to: { email: string; name?: string };
  data?: Record<string, unknown>;
}

export async function sendBrevoEmail(options: SendEmailOptions): Promise<void> {
  try {
    const res = await fetch(RESEND_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Email send failed:", err);
    }
  } catch (err) {
    // Non-blocking: log but don't throw so the main flow continues
    console.error("Email send failed:", err);
  }
}
