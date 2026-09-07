import { ArdSection } from "@/components/ArdSection";
import { CtaBlock } from "@/components/CtaBlock";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Languages } from "@/components/Languages";
import { Ticker } from "@/components/Ticker";
import { TopBar } from "@/components/TopBar";
import { UnderTheHood } from "@/components/UnderTheHood";

export default function Page() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <Ticker />
        <ArdSection />
        <Languages />
        <UnderTheHood />
        <CtaBlock />
      </main>
      <Footer />
    </>
  );
}
