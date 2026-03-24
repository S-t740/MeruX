import Link from "next/link";
import { ArrowRight, BookOpen, Rocket, Users, Database, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-hub-indigo/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-hub-purple/20 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-hub-indigo">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hub-indigo opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hub-indigo"></span>
            </span>
            MeruX Platform Live
          </div>

          <h1 className="text-5xl md:text-7xl font-outfit font-bold tracking-tight">
            The Future of <br />
            <span className="gradient-text">Innovation & Learning</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            A unified ecosystem for academic excellence, technical training,
            research collaboration, and startup incubation. Built for Meru Tech & Innovation Hub.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-8 py-3 rounded-full bg-hub-indigo text-white font-semibold hover:bg-hub-indigo/90 transition-all flex items-center gap-2 shadow-lg shadow-hub-indigo/20"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#vision"
              className="px-8 py-3 rounded-full bg-white/5 border border-white/10 font-semibold hover:bg-white/10 transition-all text-white"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="vision" className="px-6 py-24 bg-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold">5 Platforms, One Ecosystem</h2>
            <p className="text-muted-foreground">Breaking down silos between education and the real world.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6 text-hub-indigo" />}
              title="LMS"
              description="Course delivery, cohorts, and automated grading."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-hub-teal" />}
              title="Project Lab"
              description="Team collaboration on real-world industry tasks."
            />
            <FeatureCard
              icon={<Database className="w-6 h-6 text-hub-purple" />}
              title="Research Hub"
              description="Dataset storage and collaborative paper drafting."
            />
            <FeatureCard
              icon={<Rocket className="w-6 h-6 text-hub-amber" />}
              title="Incubator"
              description="Startup profiles, pitch decks, and funding tracking."
            />
            <FeatureCard
              icon={<GraduationCap className="w-6 h-6 text-hub-rose" />}
              title="Mentorship"
              description="Industry expert reviews and professional guidance."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p>© 2026 Meru Tech & Innovation Hub. All rights reserved.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="premium-card p-6 flex flex-col gap-4 group cursor-default">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-outfit font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
