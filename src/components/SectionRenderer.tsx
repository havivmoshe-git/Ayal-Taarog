import type { Section } from '../content/schema';
import Hero from './Hero';
import TrustBar from './TrustBar';
import Included from './Included';
import Rooms from './Rooms';
import Gallery from './Gallery';
import ShabbatTimeline from './ShabbatTimeline';
import Menu from './Menu';
import Location from './Location';
import Faq from './Faq';
import Downloads from './Downloads';
import LeadForm from './LeadForm';
import ImageBreak from './ImageBreak';
import Banner from './Banner';
import RichText from './RichText';
import Testimonials from './Testimonials';

/**
 * Maps a stored section onto its component.
 *
 * The order of sections on the page is now a property of the content, not of
 * App.tsx — which is what makes reordering and adding sections something the
 * owner can do without a developer.
 */
export default function SectionRenderer({ section }: { section: Section }) {
  const { id } = section;

  switch (section.type) {
    case 'hero':
      return <Hero id={id} data={section.data} />;
    case 'trustBar':
      return <TrustBar id={id} data={section.data} />;
    case 'included':
      return <Included id={id} data={section.data} />;
    case 'rooms':
      return <Rooms id={id} data={section.data} />;
    case 'gallery':
      return <Gallery id={id} data={section.data} />;
    case 'timeline':
      return <ShabbatTimeline id={id} data={section.data} />;
    case 'menu':
      return <Menu id={id} data={section.data} />;
    case 'location':
      return <Location id={id} data={section.data} />;
    case 'faq':
      return <Faq id={id} data={section.data} />;
    case 'downloads':
      return <Downloads id={id} data={section.data} />;
    case 'leadForm':
      return <LeadForm id={id} data={section.data} />;
    case 'imageBreak':
      return <ImageBreak id={id} data={section.data} />;
    case 'banner':
      return <Banner id={id} data={section.data} />;
    case 'richText':
      return <RichText id={id} data={section.data} />;
    case 'testimonials':
      return <Testimonials id={id} data={section.data} />;
    default:
      // An unknown type means content written by a newer build. Render nothing
      // rather than crashing the page around it.
      return null;
  }
}
