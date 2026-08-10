import { useEffect } from 'react';
import { useContent } from '../content/ContentContext';

/**
 * Applies the panel's SEO fields to the live document.
 *
 * They were editable and wired to nothing: the title and description came
 * only from the static `index.html`, so changing them in the panel did
 * nothing at all. Now the published values win at runtime, which is what
 * Google uses once it renders the page.
 *
 * The static tags still matter and are still the ones set well by hand — they
 * are what WhatsApp reads (it does not run JavaScript) and what a crawler sees
 * on its first pass. This only overrides them when the owner has actually
 * changed something.
 */
export default function DocumentHead() {
  const { content } = useContent();
  const { title, description } = content.seo;

  useEffect(() => {
    if (title && document.title !== title) document.title = title;
    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    if (tag && tag.getAttribute('content') !== description) {
      tag.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
}
