import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { RoadmapPreview } from "@/components/landing/RoadmapPreview";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <ParticlesBackground />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <RoadmapPreview />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
