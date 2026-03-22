import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Process from "./components/Process";
import About from "./components/About";
import Contact from "./components/Contact";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  return (
    <main>
      <Hero hero={dict.hero} />
      <Services services={dict.services} />
      <Process process={dict.process} />
      <About about={dict.about} />
      <Contact contact={dict.contact} />
    </main>
  );
}
