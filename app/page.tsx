import { Navbar } from "@/components/Navbar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { HeroSection } from "@/components/HeroSection";
import { ChatDemo } from "@/components/ChatDemo";
import { FeaturesSection } from "@/components/FeaturesSection";
import { LogoCloud } from "@/components/LogoCloud";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AnnouncementBanner />
      <main>
        <HeroSection />
        <ChatDemo />
        <FeaturesSection />
        <LogoCloud />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

