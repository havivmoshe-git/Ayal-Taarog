import Header from './components/Header';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import Included from './components/Included';
import Rooms from './components/Rooms';
import Gallery from './components/Gallery';
import ShabbatTimeline from './components/ShabbatTimeline';
import Menu from './components/Menu';
import Location from './components/Location';
import Faq from './components/Faq';
import Downloads from './components/Downloads';
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
        <Rooms />
        <Gallery />
        <ShabbatTimeline />
        <Menu />
        <Location />
        <Faq />
        <Downloads />
        <LeadForm />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
