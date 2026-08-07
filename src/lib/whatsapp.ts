export type Inquiry = {
  name: string;
  phone: string;
  dateGregorian: string;
  dateHebrew: string;
  guests: string;
  type: string;
  notes: string;
};

/** Renders an ISO date (yyyy-mm-dd) as dd/mm/yyyy, which is what Israeli
 *  readers expect. Falls back to the raw value if it isn't a valid date. */
function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Builds the message body the sender sees pre-filled in WhatsApp.
 * It mirrors the four details the office already asks for in the broadcast
 * message, so an inquiry arrives ready to quote against without a back-and-forth.
 */
export function buildInquiryMessage(inquiry: Inquiry): string {
  const lines: string[] = ['שלום, הגעתי דרך האתר ואשמח לקבל הצעה למתחם האירוח ״כאייל תערוג״.', ''];

  if (inquiry.name.trim()) lines.push(`שם: ${inquiry.name.trim()}`);
  if (inquiry.phone.trim()) lines.push(`טלפון: ${inquiry.phone.trim()}`);

  const dates = [inquiry.dateGregorian ? formatDate(inquiry.dateGregorian) : '', inquiry.dateHebrew.trim()]
    .filter(Boolean)
    .join(' | ');
  if (dates) lines.push(`תאריך האירוע: ${dates}`);

  if (inquiry.guests.trim()) lines.push(`כמות אורחים משוערת: ${inquiry.guests.trim()}`);
  if (inquiry.type) lines.push(`סוג האירוע: ${inquiry.type}`);
  if (inquiry.notes.trim()) lines.push(`הערות: ${inquiry.notes.trim()}`);

  lines.push('', 'תודה רבה!');

  return lines.join('\n');
}

/** Full wa.me link with the message encoded. */
export function whatsappLink(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Default opener for the action bar and header CTA. */
export const GENERAL_ENQUIRY =
  'שלום, אשמח לקבל פרטים על מתחם האירוח ״כאייל תערוג״ בהר חומה.';
