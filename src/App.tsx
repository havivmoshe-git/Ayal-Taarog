import { useContent } from './content/ContentContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MobileBar from './components/MobileBar';
import SectionRenderer from './components/SectionRenderer';

/**
 * The page is now assembled from the content document rather than hard-coded.
 * `visible` has already dropped anything switched off or outside its date
 * window, so this only has to render what is left, in order.
 */
export default function App() {
  const { visible } = useContent();

  return (
    <>
      <Header />
      <main>
        {visible.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
