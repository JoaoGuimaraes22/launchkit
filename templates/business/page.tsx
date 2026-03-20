import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import HeroContent from "./components/HeroContent";
import About from "./components/About";
import Services from "./components/Services";
import Reviews from "./components/Reviews";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import FloatingCTA from "./components/FloatingCTA";

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  return (
    <>
      <HeroContent hero={dict.hero} />
      <About about={dict.about} />
      <Services services={dict.services} />
      <Reviews reviews={dict.reviews} />
      <FAQ faq={dict.faq} />
      <Contact contact={dict.contact} />
      <Footer footer={dict.footer} logo={dict.navbar.logo} />
      <FloatingCTA cta={dict.cta} />
    </>
  );
}
