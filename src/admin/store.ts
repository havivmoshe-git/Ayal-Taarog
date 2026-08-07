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

export interface ContentStore {
  /** Whether this store keeps content anywhere other people can see. */
  readonly isRemote: boolean;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  /** Lets the owner change their own password without visiting Supabase. */
  changePassword(next: string): Promise<void>;
  currentSession(): Promise<Session | null>;
  loadDraft(): Promise<SiteContent>;
  saveDraft(content: SiteContent): Promise<void>;
  publish(content: SiteContent): Promise<void>;
  /** Returns the public URL of the stored file. */
  uploadImage(path: string, blob: Blob): Promise<string>;
}

/* ── Local store ──────────────────────────────────────────────────────── */

const LOCAL_DRAFT = 'ayal:draft';
const LOCAL_PUBLISHED = 'ayal:published';
const LOCAL_SESSION = 'ayal:session';

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

  async publish(content: SiteContent) {
    const stamped = { ...content, updatedAt: new Date().toISOString() };
    localStorage.setItem(LOCAL_PUBLISHED, JSON.stringify(stamped));
    localStorage.setItem(LOCAL_DRAFT, JSON.stringify(stamped));
  }

  async uploadImage(_path: string, blob: Blob): Promise<string> {
    // Object URLs survive only this page load; enough to see the layout work,
    // and honestly signalled by the "not connected" banner in the panel.
    return URL.createObjectURL(blob);
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

  async publish(content: SiteContent) {
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
}

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'אימייל או סיסמה שגויים';
  if (/email not confirmed/i.test(message)) return 'המשתמש טרם אושר — סמנו Auto Confirm ב-Supabase';
  return message;
}

export const store: ContentStore = isConfigured ? new SupabaseStore() : new LocalStore();
export { isConfigured };
