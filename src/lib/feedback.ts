/**
 * Submitting guest feedback.
 *
 * Plain HTTP against the RPC, not the Supabase SDK — the feedback page is a
 * link sent over WhatsApp to someone on a phone, and 35KB of client library to
 * make one POST is a poor trade. Unlike the analytics beacon this one is
 * allowed to fail loudly: the guest is waiting for an answer, and silently
 * swallowing their words would be worse than telling them to try again.
 */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type FeedbackDraft = {
  name: string;
  context: string;
  rating: number;
  quote: string;
  note: string;
  phone: string;
  consent: boolean;
};

function device(): string {
  const w = window.innerWidth;
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

export async function submitFeedback(draft: FeedbackDraft): Promise<void> {
  if (!URL_BASE || !KEY) throw new Error('הטופס אינו מחובר לשרת');

  const res = await fetch(`${URL_BASE}/rest/v1/rpc/submit_feedback`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_name: draft.name,
      p_rating: draft.rating,
      p_quote: draft.quote || null,
      p_private_note: draft.note || null,
      p_context: draft.context || null,
      p_phone: draft.phone || null,
      p_consent: draft.consent,
      p_device: device(),
    }),
  });

  if (res.ok) return;

  // The database's own guards produce the useful messages; surface the one
  // case a guest can act on and keep the rest generic.
  const body = await res.text().catch(() => '');
  if (/too many submissions/i.test(body)) {
    throw new Error('נשלחו הרבה פניות ברגע זה. נסו שוב בעוד דקה.');
  }
  throw new Error('השליחה נכשלה. נסו שוב, או שלחו לנו הודעה בוואטסאפ.');
}
