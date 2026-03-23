import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import Hero from "./components/Hero";
import About from "./components/About";
import Menu from "./components/Menu";
import Reviews from "./components/Reviews";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  return (
    <>
      <Hero hero={dict.hero} />
      <About about={dict.about} />
      <Menu menu={dict.menu} />
      <Reviews reviews={dict.reviews} />
      <FAQ faq={dict.faq} />
      <Contact contact={dict.contact} contactMap={dict.contactMap} />
      <Footer footer={dict.footer} logo={dict.navbar.logo} />
    </>
  );
}
