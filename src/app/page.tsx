"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  Rocket,
  Users,
  Database,
  GraduationCap,
  Award,
  BarChart3,
  Trophy,
  Calendar,
  Briefcase,
  Shield,
  Code2,
  Lightbulb,
  Target,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  Zap,
  Globe,
  FlaskConical,
  UserCheck,
  ClipboardCheck,
  Layers,
  Sparkles,
} from "lucide-react";

/* ─────────────────────── Animated Counter ─────────────────────── */
function AnimatedCounter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let current = 0;
          const step = Math.max(1, Math.floor(end / 60));
          const timer = setInterval(() => {
            current += step;
            if (current >= end) {
              current = end;
              clearInterval(timer);
            }
            setCount(current);
          }, 20);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-outfit font-bold gradient-text">
        {count}
        {suffix}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</div>
    </div>
  );
}

/* ─────────────────────── Section Reveal ─────────────────────── */
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </section>
  );
}

/* ─────────────────────── Module Card ─────────────────────── */
function ModuleCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group relative premium-card p-6 flex flex-col gap-4 cursor-default hover:-translate-y-1 transition-all duration-500">
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-outfit font-bold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────── Role Card ─────────────────────── */
function RoleCard({
  icon,
  title,
  features,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  features: string[];
  accent: string;
}) {
  return (
    <div className="premium-card p-6 space-y-4 hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <h3 className="font-outfit font-bold text-lg">{title}</h3>
      </div>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ChevronRight className="w-4 h-4 mt-0.5 text-hub-indigo shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────── Flow Step ─────────────────────── */
function FlowStep({
  step,
  icon,
  title,
  description,
  color,
  isLast = false,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center relative group">
      <div
        className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500 relative z-10`}
      >
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-hub-indigo text-white text-xs font-bold flex items-center justify-center z-20">
        {step}
      </div>
      <h4 className="font-outfit font-bold text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-[140px]">{description}</p>
      {!isLast && (
        <div className="hidden lg:block absolute top-8 left-[calc(100%_-_8px)] w-[calc(100%_-_48px)] h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*                         MAIN PAGE                                */
/* ═════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Detect preference
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light") {
      setDarkMode(false);
    } else if (saved === "dark") {
      setDarkMode(true);
    } else if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <main className="flex-1 bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* ───────────────── Floating Navbar ───────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src={darkMode ? "/brand/merux-lms-logo-full-dark.svg" : "/brand/merux-lms-logo-full.svg"}
              alt="Merux LMS"
              width={200}
              height={60}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Features", id: "features" },
              { label: "Modules", id: "modules" },
              { label: "Ecosystem", id: "ecosystem" },
              { label: "Roles", id: "roles" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="nav-link text-sm"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-xl bg-accent/50 hover:bg-accent flex items-center justify-center transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/login"
              className="hidden sm:flex px-5 py-2 rounded-xl bg-hub-indigo text-white text-sm font-semibold hover:bg-hub-indigo/90 transition-all items-center gap-1.5 shadow-lg shadow-hub-indigo/20"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-accent/50 hover:bg-accent flex items-center justify-center transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 mx-auto max-w-7xl px-6 py-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-lg space-y-1 animate-fade-in">
            {["features", "modules", "ecosystem", "roles"].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-accent/50 transition-colors capitalize"
              >
                {id}
              </button>
            ))}
            <Link
              href="/login"
              className="block w-full text-center mt-2 px-5 py-2.5 rounded-xl bg-hub-indigo text-white text-sm font-semibold hover:bg-hub-indigo/90 transition-all"
            >
              Get Started →
            </Link>
          </div>
        )}
      </nav>

      {/* ───────────────── Hero Section ───────────────── */}
      <section className="relative isolate px-6 pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden min-h-[600px] md:min-h-[700px]">
        {/* Background image - absolute positioning */}
        <Image
          src="/brand/hero-bg.jpg"
          alt="Hero background"
          fill
          priority
          quality={100}
          className="absolute inset-0 object-cover z-0 w-full h-full"
          style={{ objectFit: "cover" }}
        />
        {/* Overlay gradient (dark mode only) */}
        {darkMode && (
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/50 via-background/35 to-background/70" />
        )}

        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in relative z-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hub-indigo/10 border border-hub-indigo/20 text-sm font-semibold text-hub-indigo">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hub-indigo opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hub-indigo" />
            </span>
            Merux LMS Platform Live
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-outfit font-bold tracking-tight leading-[1.05]">
            The Future of <br />
            <span className="gradient-text">Innovation &amp; Learning</span>
          </h1>

          {/* Sub */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
            A unified ecosystem for academic excellence, technical training, research collaboration,
            startup incubation, and professional certification. Built for{" "}
            <span className="font-semibold text-foreground">Meru Tech &amp; Innovation Hub</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full bg-hub-indigo text-white font-semibold hover:bg-hub-indigo/90 transition-all flex items-center gap-2 shadow-xl shadow-hub-indigo/25 text-base"
            >
              Start Learning <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo("modules")}
              className="px-8 py-3.5 rounded-full bg-accent/50 border border-border/60 font-semibold hover:bg-accent transition-all text-base"
            >
              Explore Platform
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────── Stats Bar ───────────────── */}
      <RevealSection className="px-6 py-16 border-y border-border/40">
        <div
          id="features"
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
        >
          <AnimatedCounter end={12} suffix="+" label="Modules" />
          <AnimatedCounter end={50} suffix="+" label="Courses" />
          <AnimatedCounter end={200} suffix="+" label="Projects" />
          <AnimatedCounter end={30} suffix="+" label="Certifications" />
          <AnimatedCounter end={40} suffix="+" label="Events" />
          <AnimatedCounter end={25} suffix="+" label="Mentors" />
        </div>
      </RevealSection>

      {/* ───────────────── Core Modules ───────────────── */}
      <RevealSection className="px-6 py-24">
        <div id="modules" className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-indigo/10 border border-hub-indigo/20 text-xs font-bold uppercase tracking-widest text-hub-indigo">
              <Layers className="w-3.5 h-3.5" /> Platform Modules
            </div>
            <h2 className="text-3xl md:text-5xl font-outfit font-bold tracking-tight">
              Everything You Need,{" "}
              <span className="gradient-text">One Ecosystem</span>
            </h2>
            <p className="text-muted-foreground">
              12 integrated modules that take you from learning to launching — no silos, no friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <ModuleCard
              icon={<BookOpen className="w-6 h-6 text-hub-indigo" />}
              title="Learning Management"
              description="Structured courses with rich content delivery, cohort-based learning paths, and automated progress tracking."
              color="bg-hub-indigo/10"
            />
            <ModuleCard
              icon={<Target className="w-6 h-6 text-hub-rose" />}
              title="Assessment Engine"
              description="Multi-format quizzes, timed skill assessments, weighted scoring, and industry-standard competency validation."
              color="bg-hub-rose/10"
            />
            <ModuleCard
              icon={<Award className="w-6 h-6 text-hub-amber" />}
              title="Certifications & Badges"
              description="Verifiable digital certificates, skill badges, credential wallet, and public certificate verification."
              color="bg-hub-amber/10"
            />
            <ModuleCard
              icon={<FlaskConical className="w-6 h-6 text-hub-teal" />}
              title="Research Hub"
              description="Collaborative paper drafting, dataset storage, research project management, and academic publishing tools."
              color="bg-hub-teal/10"
            />
            <ModuleCard
              icon={<Rocket className="w-6 h-6 text-hub-purple" />}
              title="AI Project Incubator"
              description="Transform learner Skill DNA into real-world project pitches, then iterate with milestones, mentors, and launch-ready deliverables."
              color="bg-hub-purple/10"
            />
            <ModuleCard
              icon={<Users className="w-6 h-6 text-hub-indigo" />}
              title="Mentorship Network"
              description="AI-powered mentor matching, session scheduling, industry expert reviews, and professional guidance."
              color="bg-hub-indigo/10"
            />
            <ModuleCard
              icon={<BarChart3 className="w-6 h-6 text-hub-teal" />}
              title="Analytics & Insights"
              description="Personal learning analytics, system-wide dashboards, performance reports, and data-driven insights."
              color="bg-hub-teal/10"
            />
            <ModuleCard
              icon={<Trophy className="w-6 h-6 text-yellow-500" />}
              title="Leaderboard & Reputation"
              description="Global ranking system with reputation tiers (Contributor → Innovator → Expert → Master)."
              color="bg-yellow-500/10"
            />
            <ModuleCard
              icon={<Calendar className="w-6 h-6 text-hub-rose" />}
              title="Events & Workshops"
              description="Seminars, hackathons, pitch nights, bootcamp kickoffs, and full event registration system."
              color="bg-hub-rose/10"
            />
            <ModuleCard
              icon={<Briefcase className="w-6 h-6 text-hub-purple" />}
              title="Portfolio Showcase"
              description="Public developer profiles, project showcases, skill endorsements, and shareable portfolio links."
              color="bg-hub-purple/10"
            />
            <ModuleCard
              icon={<Shield className="w-6 h-6 text-hub-indigo" />}
              title="Multi-Role Dashboards"
              description="Tailored experiences for students, instructors, researchers, mentors, reviewers, and program teams."
              color="bg-hub-indigo/10"
            />
          </div>
        </div>
      </RevealSection>

      {/* ───────────────── Ecosystem Flow ───────────────── */}
      <RevealSection className="px-6 py-24 bg-accent/30 border-y border-border/40">
        <div id="ecosystem" className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-teal/10 border border-hub-teal/20 text-xs font-bold uppercase tracking-widest text-hub-teal">
              <Globe className="w-3.5 h-3.5" /> Connected Ecosystem
            </div>
            <h2 className="text-3xl md:text-5xl font-outfit font-bold tracking-tight">
              From Classroom to <span className="gradient-text">Startup</span>
            </h2>
            <p className="text-muted-foreground">
              A seamless pipeline where every step builds on the last — learning feeds into building, building feeds into research, and research feeds into real ventures.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
            <FlowStep
              step={1}
              icon={<BookOpen className="w-7 h-7 text-hub-indigo" />}
              title="Learn"
              description="Master skills through structured courses & cohorts"
              color="bg-hub-indigo/10"
            />
            <FlowStep
              step={2}
              icon={<Code2 className="w-7 h-7 text-hub-teal" />}
              title="Build"
              description="Apply knowledge in real-world team projects"
              color="bg-hub-teal/10"
            />
            <FlowStep
              step={3}
              icon={<FlaskConical className="w-7 h-7 text-hub-purple" />}
              title="Research"
              description="Explore frontiers through collaborative research"
              color="bg-hub-purple/10"
            />
            <FlowStep
              step={4}
              icon={<Rocket className="w-7 h-7 text-hub-amber" />}
              title="Incubate"
              description="Turn learner progress into AI-guided venture ideas and launch tracks"
              color="bg-hub-amber/10"
            />
            <FlowStep
              step={5}
              icon={<Award className="w-7 h-7 text-hub-rose" />}
              title="Certify"
              description="Earn verifiable credentials & build reputation"
              color="bg-hub-rose/10"
              isLast
            />
          </div>
        </div>
      </RevealSection>

      {/* ───────────────── Role Spotlight ───────────────── */}
      <RevealSection className="px-6 py-24">
        <div id="roles" className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hub-purple/10 border border-hub-purple/20 text-xs font-bold uppercase tracking-widest text-hub-purple">
              <UserCheck className="w-3.5 h-3.5" /> Built For Everyone
            </div>
            <h2 className="text-3xl md:text-5xl font-outfit font-bold tracking-tight">
              Your Role, <span className="gradient-text">Your Dashboard</span>
            </h2>
            <p className="text-muted-foreground">
              Every user gets a tailored experience with tools and insights specific to their role in the ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <RoleCard
              icon={<GraduationCap className="w-5 h-5 text-hub-indigo" />}
              title="Student"
              accent="bg-hub-indigo/10"
              features={[
                "Enroll in courses & join cohorts",
                "Take assessments & earn badges",
                "Track learning progress & analytics",
                "Build portfolio & climb leaderboard",
              ]}
            />
            <RoleCard
              icon={<ClipboardCheck className="w-5 h-5 text-hub-teal" />}
              title="Instructor"
              accent="bg-hub-teal/10"
              features={[
                "Create & manage course content",
                "Build question banks for assessments",
                "Grade submissions & track cohorts",
                "View student performance analytics",
              ]}
            />
            <RoleCard
              icon={<FlaskConical className="w-5 h-5 text-hub-purple" />}
              title="Researcher"
              accent="bg-hub-purple/10"
              features={[
                "Manage research projects & papers",
                "Store & version datasets",
                "Collaborate across disciplines",
                "Publish findings to the community",
              ]}
            />
            <RoleCard
              icon={<Lightbulb className="w-5 h-5 text-hub-amber" />}
              title="Mentor"
              accent="bg-hub-amber/10"
              features={[
                "Guide student projects & startups",
                "Schedule mentorship sessions",
                "Review pitch decks & proposals",
                "Provide industry-specific feedback",
              ]}
            />
            <RoleCard
              icon={<Zap className="w-5 h-5 text-yellow-500" />}
              title="Reviewer"
              accent="bg-yellow-500/10"
              features={[
                "Evaluate project submissions",
                "Score assessment responses",
                "Provide expert review feedback",
                "Participate in grading panels",
              ]}
            />
          </div>
        </div>
      </RevealSection>

      {/* ───────────────── CTA Section ───────────────── */}
      <RevealSection className="px-6 py-24">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-hub-indigo/20 via-hub-purple/10 to-hub-teal/10 border border-border/40 p-12 md:p-16 text-center space-y-8 relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-hub-indigo/20 blur-[80px] rounded-full" />
          <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-hub-purple/20 blur-[80px] rounded-full" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-outfit font-bold tracking-tight">
              Ready to Join the <span className="gradient-text">Innovation Hub</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Whether you&apos;re a student, researcher, or industry mentor — Merux LMS has a place for you. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-hub-indigo text-white font-semibold hover:bg-hub-indigo/90 transition-all flex items-center gap-2 shadow-xl shadow-hub-indigo/25"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => scrollTo("modules")}
                className="px-8 py-3.5 rounded-full bg-accent/50 border border-border/60 font-semibold hover:bg-accent transition-all"
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="px-6 py-16 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/brand/merux-lms-icon.svg" alt="Merux LMS" className="w-10 h-10" />
                <span className="font-outfit font-bold text-xl tracking-tight">
                  Merux
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Innovation-driven learning, research, and incubation infrastructure for the next generation.
              </p>
            </div>

            {/* Platform Links */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Platform</h4>
              <div className="space-y-2">
                {[
                  { label: "Courses", href: "/courses" },
                  { label: "Projects", href: "/projects" },
                  { label: "Research", href: "/research" },
                  { label: "Events", href: "/events" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Links */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Community</h4>
              <div className="space-y-2">
                {[
                  { label: "Leaderboard", href: "/leaderboard" },
                  { label: "Mentorship", href: "/mentorship" },
                  { label: "Certifications", href: "/certifications" },
                  { label: "Cohorts", href: "/cohorts" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* System Links */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground">System</h4>
              <div className="space-y-2">
                {[
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Analytics", href: "/analytics" },
                  { label: "Settings", href: "/settings" },
                  { label: "Help Center", href: "/notifications" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Meru Tech &amp; Innovation Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-8 h-8 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
