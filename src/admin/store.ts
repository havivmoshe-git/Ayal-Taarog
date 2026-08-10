import type { SiteContent } from '../content/schema';
import { snapshot } from '../content/snapshot';
import { PUBLISHED_OBJECT, STORAGE_BUCKET, getSupabase, isConfigured } from '../lib/supabase';

/**
 * The panel's backend, behind one interface.
 *
 * Two implementations: Supabase once the project's keys are supplied, and
 * localStorage until then. The panel is therefore fully usable and testable
 * before any account exists — and the day the keys arrive, nothing above this
 * file changes.
 */

export type Session = { email: string };

export type VersionKind = 'autosave' | 'publish' | 'restore';

export type Version = {
  id: number;
  kind: VersionKind;
  note: string | null;
  createdAt: string;
};

export type LeadIntent = {
  id: number;
  at: string;
  sent: boolean;
  filled: number;
  name: string | null;
  phone: string | null;
  dateGreg: string | null;
  dateHeb: string | null;
  guests: string | null;
  kind: string | null;
  notes: string | null;
  device: string | null;
};

export type FeedbackStatus = 'pending' | 'approved' | 'rejected';

export type Feedback = {
  id: number;
  at: string;
  status: FeedbackStatus;
  name: string | null;
  context: string | null;
  rating: number | null;
  quote: string | null;
  privateNote: string | null;
  phone: string | null;
  consent: boolean;
  device: string | null;
  publishedAt: string | null;
};

export type Insights = {
  days: number;
  visits: number;
  visitors: number;
  sessions: number;
  returning: number;
  by_hour: Record<string, number>;
  by_day: { day: string; visits: number; visitors: number }[];
  by_device: Record<string, number>;
  referrers: { source: string; visits: number }[];
  sections: { label: string; visitors: number }[];
  scroll_depth: number;
  clicks: Record<string, number>;
  form: { started: number; sent: number; abandoned: number };
};

export interface ContentStore {
  /** Whether this store keeps content anywhere other people can see. */
  readonly isRemote: boolean;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  /** Lets the owner change their own password without visiting Supabase. */
  changePassword(next: string): Promise<void>;
  currentSession(): Promise<Session | null>;
  loadDraft(): Promise<SiteContent>;
  /** The document currently live, for diffing the draft against. */
  loadPublished(): Promise<SiteContent | null>;
  saveDraft(content: SiteContent): Promise<void>;
  /** Publishing always snapshots, so history cannot be forgotten at the call site. */
  publish(content: SiteContent, note?: string): Promise<void>;
  /** Returns the public URL of the stored file. */
  uploadImage(path: string, blob: Blob): Promise<string>;

  /* History */
  listVersions(limit?: number): Promise<Version[]>;
  loadVersion(id: number): Promise<SiteContent>;
  saveVersion(content: SiteContent, kind: VersionKind, note?: string): Promise<void>;

  /* Insights */
  insights(days: number): Promise<Insights | null>;
  leads(limit?: number): Promise<LeadIntent[]>;
  deleteLead(id: number): Promise<void>;

  /* Guest feedback */
  feedback(): Promise<Feedback[]>;
  setFeedbackStatus(id: number, status: FeedbackStatus, publishedAt?: string | null): Promise<void>;
  deleteFeedback(id: number): Promise<void>;
}

/* ── Local store ──────────────────────────────────────────────────────── */

const LOCAL_DRAFT = 'ayal:draft';
const LOCAL_PUBLISHED = 'ayal:published';
const LOCAL_SESSION = 'ayal:session';
const LOCAL_VERSIONS = 'ayal:versions';

/**
 * Stand-in used until Supabase is configured. Everything lives in this
 * browser, so "publish" is visible only here — which is exactly the right
 * behaviour for a panel that is not connected to anything yet.
 */
class LocalStore implements ContentStore {
  readonly isRemote = false;

  async signIn(email: string): Promise<Session> {
    const session = { email };
    localStorage.setItem(LOCAL_SESSION, JSON.stringify(session));
    return session;
  }

  async signOut() {
    localStorage.removeItem(LOCAL_SESSION);
  }

  async changePassword() {
    // Nothing to change without a real account; the panel says as much.
  }

  async currentSession(): Promise<Session | null> {
    const raw = localStorage.getItem(LOCAL_SESSION);
    return raw ? (JSON.parse(raw) as Session) : null;
  }

  async loadDraft(): Promise<SiteContent> {
    const raw = localStorage.getItem(LOCAL_DRAFT);
    if (!raw) return structuredClone(snapshot);
    try {
      return JSON.parse(raw) as SiteContent;
    } catch {
      return structuredClone(snapshot);
    }
  }

  async saveDraft(content: SiteContent) {
    localStorage.setItem(LOCAL_DRAFT, JSON.stringify(content));
  }

  async publish(content: SiteContent, note?: string) {
    const stamped = { ...content, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_PUBLISHED, JSON.stringify(stamped));
    localStorage.setItem(LOCAL_DRAFT, JSON.stringify(stamped));
    await this.saveVersion(stamped, 'publish', note);
  }

  async loadPublished(): Promise<SiteContent | null> {
    const raw = localStorage.getItem(LOCAL_PUBLISHED);
    return raw ? (JSON.parse(raw) as SiteContent) : null;
  }

  async uploadImage(_path: string, blob: Blob): Promise<string> {
    // Object URLs survive only this page load; enough to see the layout work,
    // and honestly signalled by the "not connected" banner in the panel.
    return URL.createObjectURL(blob);
  }

  async listVersions(limit = 50): Promise<Version[]> {
    const raw = localStorage.getItem(LOCAL_VERSIONS);
    const all = raw ? (JSON.parse(raw) as (Version & { content: SiteContent })[]) : [];
    return all.slice(0, limit).map(({ content: _content, ...v }) => v);
  }

  async loadVersion(id: number): Promise<SiteContent> {
    const raw = localStorage.getItem(LOCAL_VERSIONS);
    const all = raw ? (JSON.parse(raw) as (Version & { content: SiteContent })[]) : [];
    const found = all.find((v) => v.id === id);
    if (!found) throw new Error('הגרסה לא נמצאה');
    return found.content;
  }

  async saveVersion(content: SiteContent, kind: VersionKind, note?: string) {
    const raw = localStorage.getItem(LOCAL_VERSIONS);
    const all = raw ? (JSON.parse(raw) as (Version & { content: SiteContent })[]) : [];
    all.unshift({
      id: Date.now(),
      kind,
      note: note ?? null,
      createdAt: new Date().toISOString(),
      content,
    });
    localStorage.setItem(LOCAL_VERSIONS, JSON.stringify(all.slice(0, 50)));
  }

  async insights(): Promise<Insights | null> {
    return null;
  }

  async leads(): Promise<LeadIntent[]> {
    return [];
  }

  async deleteLead() {
    // Nothing is recorded without a server.
  }

  async feedback(): Promise<Feedback[]> {
    return [];
  }

  async setFeedbackStatus() {
    // Nothing to moderate without a server.
  }

  async deleteFeedback() {
    // Nothing to moderate without a server.
  }
}

/* ── Supabase store ───────────────────────────────────────────────────── */

class SupabaseStore implements ContentStore {
  readonly isRemote = true;

  async signIn(email: string, password: string): Promise<Session> {
    const sb = await getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
    return { email: data.user?.email ?? email };
  }

  async signOut() {
    const sb = await getSupabase();
    await sb.auth.signOut();
  }

  async changePassword(next: string) {
    const sb = await getSupabase();
    const { error } = await sb.auth.updateUser({ password: next });
    if (error) throw new Error(translateAuthError(error.message));
  }

  async currentSession(): Promise<Session | null> {
    const sb = await getSupabase();
    const { data } = await sb.auth.getSession();
    const email = data.session?.user.email;
    return email ? { email } : null;
  }

  async loadDraft(): Promise<SiteContent> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('site_content')
      .select('draft')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    // First ever load: seed the row from the content the site already ships.
    if (!data?.draft) {
      const seed = structuredClone(snapshot);
      await this.saveDraft(seed);
      return seed;
    }
    return data.draft as SiteContent;
  }

  async saveDraft(content: SiteContent) {
    const sb = await getSupabase();
    const { error } = await sb
      .from('site_content')
      .upsert({ id: 1, draft: content }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }

  async loadPublished(): Promise<SiteContent | null> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('site_content')
      .select('published')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.published as SiteContent | null) ?? null;
  }

  async publish(content: SiteContent, note?: string) {
    const sb = await getSupabase();
    const stamped: SiteContent = { ...content, updatedAt: new Date().toISOString() };

    const { error } = await sb
      .from('site_content')
      .upsert(
        { id: 1, draft: stamped, published: stamped, published_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
    if (error) throw new Error(error.message);

    // The site reads this file rather than the table: a plain GET against a
    // CDN, with no SDK and no auth round-trip on the visitor's side.
    const { error: uploadError } = await sb.storage
      .from(STORAGE_BUCKET)
      .upload(PUBLISHED_OBJECT, new Blob([JSON.stringify(stamped)], { type: 'application/json' }), {
        upsert: true,
        cacheControl: '60',
        contentType: 'application/json',
      });
    if (uploadError) throw new Error(uploadError.message);

    // Last, and deliberately not awaited into the failure path: the site is
    // already updated, and a history row that failed to write is not a reason
    // to tell the owner the publish failed.
    await this.saveVersion(stamped, 'publish', note).catch(() => {});
  }

  async uploadImage(path: string, blob: Blob): Promise<string> {
    const sb = await getSupabase();
    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, {
      upsert: true,
      cacheControl: '31536000',
      contentType: blob.type,
    });
    if (error) throw new Error(error.message);
    const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /* ── History ──────────────────────────────────────────────────────── */

  async listVersions(limit = 50): Promise<Version[]> {
    const sb = await getSupabase();
    // Deliberately without `content`: the list is a list. Fifty full documents
    // is megabytes, and the panel needs one of them only when asked.
    const { data, error } = await sb
      .from('content_versions')
      .select('id, kind, note, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as number,
      kind: row.kind as VersionKind,
      note: (row.note as string | null) ?? null,
      createdAt: row.created_at as string,
    }));
  }

  async loadVersion(id: number): Promise<SiteContent> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('content_versions')
      .select('content')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data.content as SiteContent;
  }

  async saveVersion(content: SiteContent, kind: VersionKind, note?: string) {
    const sb = await getSupabase();
    const { error } = await sb
      .from('content_versions')
      .insert({ content, kind, note: note ?? null });
    if (error) throw new Error(error.message);
  }

  /* ── Insights ─────────────────────────────────────────────────────── */

  async insights(days: number): Promise<Insights | null> {
    const sb = await getSupabase();
    const { data, error } = await sb.rpc('site_insights', { days });
    if (error) throw new Error(error.message);
    return (data as Insights) ?? null;
  }

  async leads(limit = 100): Promise<LeadIntent[]> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('lead_intents')
      .select('*')
      .order('at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as number,
      at: r.at as string,
      sent: Boolean(r.sent),
      filled: (r.filled as number) ?? 0,
      name: (r.name as string | null) ?? null,
      phone: (r.phone as string | null) ?? null,
      dateGreg: (r.date_greg as string | null) ?? null,
      dateHeb: (r.date_heb as string | null) ?? null,
      guests: (r.guests as string | null) ?? null,
      kind: (r.kind as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
      device: (r.device as string | null) ?? null,
    }));
  }

  async deleteLead(id: number) {
    const sb = await getSupabase();
    const { error } = await sb.from('lead_intents').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  /* ── Guest feedback ───────────────────────────────────────────────── */

  async feedback(): Promise<Feedback[]> {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from('feedback')
      .select('*')
      .order('at', { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as number,
      at: r.at as string,
      status: r.status as FeedbackStatus,
      name: (r.name as string | null) ?? null,
      context: (r.context as string | null) ?? null,
      rating: (r.rating as number | null) ?? null,
      quote: (r.quote as string | null) ?? null,
      privateNote: (r.private_note as string | null) ?? null,
      phone: (r.phone as string | null) ?? null,
      consent: Boolean(r.consent),
      device: (r.device as string | null) ?? null,
      publishedAt: (r.published_at as string | null) ?? null,
    }));
  }

  async setFeedbackStatus(id: number, status: FeedbackStatus, publishedAt?: string | null) {
    const sb = await getSupabase();
    const patch: Record<string, unknown> = { status };
    if (publishedAt !== undefined) patch.published_at = publishedAt;
    const { error } = await sb.from('feedback').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteFeedback(id: number) {
    const sb = await getSupabase();
    const { error } = await sb.from('feedback').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'אימייל או סיסמה שגויים';
  if (/email not confirmed/i.test(message)) return 'המשתמש טרם אושר — סמנו Auto Confirm ב-Supabase';
  return message;
}

export const store: ContentStore = isConfigured ? new SupabaseStore() : new LocalStore();
export { isConfigured };
