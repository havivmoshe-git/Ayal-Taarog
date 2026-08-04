import { strapline } from './data/content';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import Included from './components/Included';
import Rooms from './components/Rooms';
import ImageBreak from './components/ImageBreak';
import Gallery from './components/Gallery';
import ShabbatTimeline from './components/ShabbatTimeline';
import Menu from './components/Menu';
import Location from './components/Location';
import Faq from './components/Faq';
import Downloads from './components/Downloads';
import LeadForm from './components/LeadForm';
import Footer from './components/Footer';
import MobileBar from './components/MobileBar';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Included />
        <Rooms />

        {/* Full-bleed breaks divide the page into three acts — the place, the
            experience, the practicalities — so it reads as chapters rather
            than one continuous column. */}
        <ImageBreak
          slug="synagogue-main"
          alt="בית הכנסת חסדי שמואל מבפנים"
          line={strapline}
          attribution="בית הכנסת ״חסדי שמואל״"
        />

        <Gallery />
        <ShabbatTimeline />
        <Menu />

        <ImageBreak
          slug="hall-place-setting"
          alt="שולחן ערוך לסעודת שבת עם כוסות יין וסכו״ם מוזהב"
          line="הכול מוכן. אתם רק צריכים להגיע."
        />

        <Location />
        <Faq />
        <Downloads />
        <LeadForm />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
