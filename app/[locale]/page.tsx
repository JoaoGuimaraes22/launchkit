import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import ProfileSidebar from "./components/ProfileSidebar";
import HeroFull from "./components/HeroFull";
import Work from "./components/Work";
import Testimonials from "./components/Testimonials";
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
    <>
      {/* Full-viewport parallax hero — no sidebar */}
      <HeroFull hero={dict.hero} />

      {/* Sidebar layout — starts after hero */}
      <div className="md:flex xl:mx-auto xl:max-w-350">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-88 md:shrink-0 md:flex-col md:justify-center md:p-4">
          <ProfileSidebar hero={dict.hero} locale={locale} />
        </aside>

        <main className="min-w-0 flex-1">
          {/* Mobile profile card */}
          <div className="md:hidden">
            <ProfileSidebar hero={dict.hero} locale={locale} mobile />
          </div>

          <div className="xl:max-w-4xl 2xl:max-w-5xl">
            <Work work={dict.work} locale={locale} />
            <Testimonials testimonials={dict.testimonials} />
            <Services services={dict.services} />
            <Process process={dict.process} />
            <About about={dict.about} />
            <Contact contact={dict.contact} />
          </div>
        </main>
      </div>
    </>
  );
}
