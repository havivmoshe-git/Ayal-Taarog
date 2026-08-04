import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import Included from './components/Included';
import Gallery from './components/Gallery';
import ShabbatTimeline from './components/ShabbatTimeline';
import Location from './components/Location';
import Faq from './components/Faq';
import LeadForm from './components/LeadForm';
import Footer from './components/Footer';
import WhatsAppFab from './components/WhatsAppFab';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Included />
        <Gallery />
        <ShabbatTimeline />
        <Location />
        <Faq />
        <LeadForm />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
