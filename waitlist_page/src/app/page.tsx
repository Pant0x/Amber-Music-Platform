import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { AppDemoMockups } from '@/components/AppDemoMockups';

export default function Home() {
  return (
    <main className="min-h-screen bg-black selection:bg-white/20">
      <HeroSection />
      <FeaturesSection />
      <AppDemoMockups />

      <footer className="py-8 text-center text-zinc-600 text-sm border-t border-white/5">
        &copy; {new Date().getFullYear()} Panto Studios. All rights reserved.
      </footer>
    </main>
  );
}
