import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContactInfo, Section, SectionOf, SectionType, SiteContent } from './schema';
import { fetchPublished, navFromSections, snapshot, visibleSections } from './load';

type ContentState = {
  content: SiteContent;
  /** True once remote content has replaced the bundled snapshot. */
  isRemote: boolean;
  /** Sections that pass both the enabled flag and their schedule. */
  visible: Section[];
  nav: { href: string; label: string }[];
};

const ContentContext = createContext<ContentState | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Preview mode supplies a draft directly and skips the published fetch. */
  override?: SiteContent | null;
  /**
   * Rendering inside the panel's preview pane. The draft arrives by message,
   * so fetching the published copy would only show the visitor's version for
   * a moment before the draft replaced it.
   */
  previewMode?: boolean;
};

export function ContentProvider({ children, override, previewMode }: ProviderProps) {
  const [content, setContent] = useState<SiteContent>(override ?? snapshot);
  const [isRemote, setIsRemote] = useState(Boolean(override));

  // Live preview: the panel posts the draft on every keystroke, so the preview
  // pane reflects an edit as it is typed rather than on save.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type?: string; content?: SiteContent };
      if (msg?.type === 'ayal:preview' && msg.content) {
        setContent(msg.content);
        setIsRemote(true);
      }
    };
    window.addEventListener('message', onMessage);
    // Tell the opener we are ready for the first frame.
    window.parent?.postMessage({ type: 'ayal:preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (override) {
      setContent(override);
      setIsRemote(true);
      return;
    }
    if (previewMode) return;

    // Fires after first paint: the snapshot is already rendered, so this can
    // only ever improve what is on screen, never delay it.
    let cancelled = false;
    fetchPublished().then((remote) => {
      if (!cancelled && remote) {
        setContent(remote);
        setIsRemote(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [override, previewMode]);

  const value = useMemo<ContentState>(() => {
    const visible = visibleSections(content);
    return { content, isRemote, visible, nav: navFromSections(visible) };
  }, [content, isRemote]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}

export function useContact(): ContactInfo {
  return useContent().content.contact;
}

/** Look up a single section by type — for the chrome (header, footer) that
 *  needs one section's data without being rendered as part of the list. */
export function useSection<T extends SectionType>(type: T): SectionOf<T> | undefined {
  const { content } = useContent();
  return content.sections.find((s) => s.type === type) as SectionOf<T> | undefined;
}
