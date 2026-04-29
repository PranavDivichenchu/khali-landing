// Khali Landing Page
// Warm editorial aesthetic — premium newspaper meets modern iOS app

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Khali — Personalized AI News, Balanced",
};

// ─── SVG Icons (inline, outline style) ──────────────────────────────────────

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function IconHeadphones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function IconScale() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M12 3v18M3 9l9-6 9 6M5 12l-2 6h4l-2-6zM19 12l-2 6h4l-2-6z" />
    </svg>
  );
}

function IconVote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconArticle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5">
      <path d="M9 12h6M9 8h6M9 16h4M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconMenuOpen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <IconSpark />,
    label: "AI-Powered Feed",
    headline: "News that learns you.",
    body: "Your feed adapts to every like, view, and swipe. The more you read, the smarter it gets — delivering only what matters to you across 10 categories.",
    accent: "#b8882e",
  },
  {
    icon: <IconPlay />,
    label: "Short-Form Video",
    headline: "The story in 60 seconds.",
    body: "Every story has a 15–60 second video clip. Scan the headlines in your morning commute without reading a single paragraph.",
    accent: "#8a6030",
  },
  {
    icon: <IconHeadphones />,
    label: "Podcast Audio",
    headline: "Listen while you live.",
    body: "Pop in your earbuds and let Khali read the news to you. Podcast-style audio for every story — commute, gym, or coffee.",
    accent: "#7a5025",
  },
  {
    icon: <IconScale />,
    label: "Both Sides",
    headline: "Left. Right. You decide.",
    body: "Every political story surfaces credible perspectives from both sides of the aisle. No filter bubble. No algorithmic bias. Just context.",
    accent: "#9a6e1c",
  },
  {
    icon: <IconArticle />,
    label: "AI Summaries",
    headline: "The facts, instantly.",
    body: "AI-generated bullet points distill every story to its essence. Know what happened in three lines before you decide to read further.",
    accent: "#a07030",
  },
  {
    icon: <IconVote />,
    label: "Vote & Shape",
    headline: "Your opinion matters.",
    body: "Vote, react, and ask questions. Your interactions train your feed and contribute to the community pulse on every major story.",
    accent: "#b07828",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your categories",
    body: "Pick from 10 news categories on sign-up. Politics, Tech, Sports, Business, Science, Culture, World, Health, Entertainment, and more.",
  },
  {
    number: "02",
    title: "Khali learns your taste",
    body: "As you watch, listen, swipe, and vote, Khali's AI maps your preferences and refines what it surfaces — every session, every day.",
  },
  {
    number: "03",
    title: "Stay informed, not influenced",
    body: "Read short summaries, watch clips, and for political stories, always see both sides. News that informs without a hidden agenda.",
  },
];

const categories = [
  { name: "Politics",       icon: "🏛", color: "bg-[#f0e4c8] text-[#5c3d2e]" },
  { name: "World",          icon: "🌍", color: "bg-[#e8eedc] text-[#3a5232]" },
  { name: "Technology",     icon: "💡", color: "bg-[#e4ecf4] text-[#2c4464]" },
  { name: "Business",       icon: "📈", color: "bg-[#f0e8e0] text-[#5a3420]" },
  { name: "Science",        icon: "🔬", color: "bg-[#e4e8f4] text-[#2c3464]" },
  { name: "Health",         icon: "🩺", color: "bg-[#ece4f0] text-[#4a2c64]" },
  { name: "Sports",         icon: "⚡", color: "bg-[#f4e8dc] text-[#6a3420]" },
  { name: "Culture",        icon: "🎭", color: "bg-[#f0ecd8] text-[#5a4420]" },
  { name: "Entertainment",  icon: "🎬", color: "bg-[#f4dce8] text-[#642c4a]" },
  { name: "Environment",    icon: "🌿", color: "bg-[#dcf0e4] text-[#1e5032]" },
];

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Categories", href: "#categories" },
    { label: "Download", href: "#download" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "#" },
  ],
};

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 480 }}>
      {/* Phone shell */}
      <div
        className="absolute inset-0 rounded-[2.5rem] shadow-warm-lg"
        style={{
          background: "linear-gradient(145deg, #3d2314 0%, #231409 100%)",
          border: "6px solid #5c3d2e",
        }}
      />
      {/* Screen */}
      <div
        className="absolute rounded-[2rem] overflow-hidden phone-screen-bg"
        style={{ inset: "10px 8px" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[9px] font-dm-sans font-semibold text-[#5c3d2e]">9:41</span>
          <div className="w-14 h-3 bg-[#3d2314] rounded-full" /> {/* notch */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-[#5c3d2e]" />
            <div className="w-1 h-1 rounded-full bg-[#5c3d2e]" />
          </div>
        </div>

        {/* App header */}
        <div className="px-4 pt-1 pb-2 border-b border-[#e4cfa0]">
          <p className="font-playfair text-base font-bold text-[#1a120b] tracking-wide">
            Good morning, Alex.
          </p>
          <p className="text-[9px] font-dm-sans text-[#8a7060] mt-0.5">Top stories for you • Wed, Apr 2</p>
        </div>

        {/* Story card 1 */}
        <div className="mx-3 mt-2.5 rounded-xl bg-white/70 shadow-warm-sm overflow-hidden">
          <div className="h-14 bg-gradient-to-br from-[#e4cfa0] to-[#d4b47a] flex items-center justify-center">
            <div className="flex items-center gap-1 text-[#5c3d2e]">
              <span className="text-[9px] font-dm-sans font-semibold uppercase tracking-wider">World</span>
              <div className="w-8 h-0.5 bg-[#5c3d2e]/30" />
            </div>
          </div>
          <div className="px-2.5 py-2">
            <p className="font-playfair text-[10px] font-semibold text-[#1a120b] leading-tight">
              EU Leaders Reach Historic Climate Agreement
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8882e]" />
              <p className="text-[8px] font-dm-sans text-[#8a7060]">2 min read · AI Summary</p>
            </div>
          </div>
        </div>

        {/* Story card 2 — "Both Sides" badge */}
        <div className="mx-3 mt-2 rounded-xl bg-white/70 shadow-warm-sm overflow-hidden">
          <div className="px-2.5 pt-2 pb-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-dm-sans font-semibold text-[#8a7060] uppercase tracking-wider">Politics</span>
              <span
                className="text-[7px] font-dm-sans font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={{ background: "#f0e4c8", color: "#b8882e" }}
              >
                Both Sides ⚖
              </span>
            </div>
            <p className="font-playfair text-[10px] font-semibold text-[#1a120b] leading-tight">
              Senate Debates New Healthcare Bill
            </p>
            <div className="flex gap-1.5 mt-1.5">
              <div className="flex-1 rounded-lg px-1.5 py-1" style={{ background: "#e8f0f8" }}>
                <p className="text-[7.5px] font-dm-sans font-semibold text-[#2c4464]">◀ Left view</p>
                <p className="text-[7px] text-[#4a5a74] leading-tight mt-0.5">Expands coverage for 30M uninsured</p>
              </div>
              <div className="flex-1 rounded-lg px-1.5 py-1" style={{ background: "#f8ece8" }}>
                <p className="text-[7.5px] font-dm-sans font-semibold text-[#6a2c1c]">Right view ▶</p>
                <p className="text-[7px] text-[#7a3c2c] leading-tight mt-0.5">Raises taxes on small businesses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-5 h-1 rounded-full bg-[#b8882e]" />
          <div className="w-1 h-1 rounded-full bg-[#d4b47a]" />
          <div className="w-1 h-1 rounded-full bg-[#d4b47a]" />
          <div className="w-1 h-1 rounded-full bg-[#d4b47a]" />
        </div>
      </div>

      {/* Side buttons */}
      <div
        className="absolute rounded-r-sm"
        style={{ width: 3, height: 48, background: "#4a2c18", right: -9, top: 100 }}
      />
      <div
        className="absolute rounded-l-sm"
        style={{ width: 3, height: 32, background: "#4a2c18", left: -9, top: 100 }}
      />
      <div
        className="absolute rounded-l-sm"
        style={{ width: 3, height: 28, background: "#4a2c18", left: -9, top: 144 }}
      />
    </div>
  );
}

// ─── Section: Navigation ─────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[#fdfaf4]/95 backdrop-blur-md border-b border-[#e4cfa0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" aria-label="Khali home">
            {/* Logomark — stylised "K" in a warm circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
            >
              <span className="font-playfair text-sm font-bold text-white tracking-tight">K</span>
            </div>
            <span className="font-playfair text-xl font-bold text-[#1a120b] tracking-wide">
              Khali
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {["Features", "How it works", "Both Sides", "Categories"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="nav-link font-dm-sans text-sm font-medium text-[#4a3728] hover:text-[#1a120b] transition-colors"
              >
                {item}
              </a>
            ))}
            <Link
              href="/feed"
              className="nav-link font-dm-sans text-sm font-semibold text-[#b8882e] hover:text-[#9a6e1c] transition-colors"
            >
              ▶ Live Feed
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#download"
              className="appstore-btn hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-dm-sans text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
            >
              <IconApple />
              Download Free
            </a>
            <button
              className="md:hidden text-[#4a3728] hover:text-[#1a120b] transition-colors"
              aria-label="Open menu"
            >
              <IconMenuOpen />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--cream-50)" }}>
      {/* Subtle editorial grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(180,140,80,0.04) 0px, rgba(180,140,80,0.04) 1px, transparent 1px, transparent 80px)",
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Dateline — like a newspaper masthead */}
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#b8882e]" />
              <span className="font-dm-sans text-xs font-semibold uppercase tracking-[0.15em] text-[#b8882e]">
                Now on iOS
              </span>
              <div className="h-px w-8 bg-[#b8882e]" />
            </div>

            {/* Headline */}
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-[#1a120b] leading-[1.07] tracking-tight mb-6">
              The news,
              <br />
              <em className="not-italic" style={{ color: "var(--gold-500)" }}>your way.</em>
              <br />
              Both sides.
            </h1>

            {/* Deck — newspaper subhead */}
            <div className="rule-above border-[#e4cfa0] max-w-lg mx-auto lg:mx-0">
              <p className="font-dm-sans text-base sm:text-lg text-[#4a3728] leading-relaxed">
                Khali delivers bite-sized stories through short videos, podcasts,
                and articles — with built-in political balance so you always see
                both sides. Personalized by AI. Trusted as a broadsheet.
              </p>
            </div>

            {/* App store buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mt-10">
              <a
                href="#"
                className="appstore-btn inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl font-dm-sans text-sm font-semibold text-white shadow-warm"
                style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
                aria-label="Download on the App Store"
              >
                <IconApple />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-normal opacity-80">Download on the</span>
                  <span className="text-sm font-bold">App Store</span>
                </span>
              </a>
              <a
                href="#features"
                className="appstore-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-dm-sans text-sm font-semibold text-[#1a120b] border border-[#d4b47a] hover:bg-[#f0e4c8] transition-colors"
                style={{ background: "var(--cream-100)" }}
              >
                See how it works
                <IconArrowRight />
              </a>
              <Link
                href="/feed"
                className="appstore-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-dm-sans text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #1a120b 0%, #3d2314 100%)", border: "1px solid #5c3d2e" }}
              >
                <span>▶</span>
                Live Feed
              </Link>
            </div>

            {/* Social proof line */}
            <p className="font-dm-sans text-xs text-[#8a7060] mt-8">
              Free to download &nbsp;·&nbsp; iOS 16+ &nbsp;·&nbsp; No ads, no noise
            </p>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex-shrink-0 relative">
            {/* Decorative circle behind phone */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 320,
                height: 320,
                background: "radial-gradient(circle, #f0e4c8 0%, transparent 70%)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden="true"
            />
            {/* Small ornamental rings */}
            <div
              className="absolute rounded-full border border-[#e4cfa0] pointer-events-none"
              style={{ width: 380, height: 380, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              aria-hidden="true"
            />
            <div
              className="absolute rounded-full border border-dashed border-[#ddd0b8] pointer-events-none"
              style={{ width: 450, height: 450, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              aria-hidden="true"
            />
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4b47a] to-transparent" aria-hidden="true" />
    </section>
  );
}

// ─── Section: Features ────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-[#f8f2e3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="font-dm-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#b8882e] mb-4">
            What makes Khali different
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-[#1a120b] leading-tight mb-6">
            News built for the{" "}
            <em className="italic">way you actually read.</em>
          </h2>
          <div className="w-16 h-px bg-[#d4b47a] mx-auto" />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <article
              key={feature.label}
              className="feature-card bg-[#fdfaf4] rounded-2xl p-7 border border-[#e4cfa0] shadow-warm-sm"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-white"
                style={{ background: `linear-gradient(135deg, ${feature.accent}dd 0%, ${feature.accent} 100%)` }}
              >
                {feature.icon}
              </div>
              {/* Label */}
              <p className="font-dm-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7060] mb-2">
                {feature.label}
              </p>
              {/* Headline */}
              <h3 className="font-playfair text-xl font-bold text-[#1a120b] mb-3 leading-snug">
                {feature.headline}
              </h3>
              {/* Body */}
              <p className="font-dm-sans text-sm text-[#5c4030] leading-relaxed">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: How it works ────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32" style={{ background: "var(--cream-50)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="font-dm-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#b8882e] mb-4">
            Up and running in minutes
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-[#1a120b] leading-tight mb-6">
            How Khali works
          </h2>
          <div className="w-16 h-px bg-[#d4b47a] mx-auto" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col items-center text-center md:px-4 ${i < steps.length - 1 ? "step-connector" : ""}`}
            >
              {/* Step number ring */}
              <div className="relative mb-6">
                <div
                  className="w-14 h-14 rounded-full border-2 border-[#d4b47a] bg-[#fdfaf4] flex items-center justify-center shadow-warm-sm"
                >
                  <span className="font-dm-serif text-lg font-normal text-[#b8882e]">
                    {step.number}
                  </span>
                </div>
                {/* Tick at center */}
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#b8882e] flex items-center justify-center"
                >
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" aria-hidden="true">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#1a120b] mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="font-dm-sans text-sm text-[#5c4030] leading-relaxed max-w-xs">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Both Sides Spotlight ───────────────────────────────────────────

function BothSides() {
  return (
    <section
      id="both-sides"
      className="py-24 lg:py-32"
      style={{ background: "linear-gradient(160deg, #3d2314 0%, #1a120b 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#d4a847]" />
              <span className="font-dm-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a847]">
                Our key feature
              </span>
              <div className="h-px w-8 bg-[#d4a847]" />
            </div>

            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-[#fdfaf4] leading-tight mb-6">
              Every political story.{" "}
              <em className="italic text-[#d4a847]">Both sides.</em>
            </h2>

            <p className="font-dm-sans text-base text-[#d4b47a] leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              We live in a world of filter bubbles. Most news apps amplify the
              views you already hold. Khali is different. For every political
              story, we surface credible left and right perspectives — so you can
              form your own opinion, not inherit someone else&apos;s.
            </p>

            {/* Bullet list */}
            <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
              {[
                "Sourced from credible outlets across the political spectrum",
                "AI balances perspective weight — no side gets amplified",
                "You see the story, not the spin",
                "Vote on which perspective you find more compelling",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(212,168,71,0.2)", border: "1px solid #d4a847" }}
                  >
                    <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5" aria-hidden="true">
                      <path d="M2 6l2.5 2.5 5.5-5" stroke="#d4a847" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="font-dm-sans text-sm text-[#e4cfa0] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Demo card */}
          <div className="flex-shrink-0 w-full max-w-sm">
            {/* "Newspaper" card showing both sides */}
            <div
              className="rounded-2xl overflow-hidden shadow-warm-lg"
              style={{ background: "#fdfaf4", border: "1px solid #e4cfa0" }}
            >
              {/* Card header */}
              <div
                className="px-6 py-4 border-b border-[#e4cfa0]"
                style={{ background: "#f8f2e3" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-[#8a7060]">
                    Politics
                  </span>
                  <span
                    className="flex items-center gap-1.5 font-dm-sans text-xs font-bold text-[#b8882e] px-2.5 py-1 rounded-full"
                    style={{ background: "#f0e4c8", border: "1px solid #d4b47a" }}
                  >
                    <span>⚖</span>
                    Both Sides
                  </span>
                </div>
                <h3 className="font-playfair text-base font-bold text-[#1a120b] leading-snug">
                  Senate Passes Landmark Climate Legislation
                </h3>
                <p className="font-dm-sans text-xs text-[#8a7060] mt-1.5">
                  4 hours ago &nbsp;·&nbsp; 2 min read
                </p>
              </div>

              {/* Both sides split */}
              <div className="grid grid-cols-2 divide-x divide-[#e4cfa0]">
                {/* Left */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3b60c4]" />
                    <span className="font-dm-sans text-xs font-bold text-[#3b60c4] uppercase tracking-wider">
                      Left view
                    </span>
                  </div>
                  <p className="font-dm-sans text-xs text-[#2c3a5a] leading-relaxed">
                    &ldquo;A generational win for climate action. The bill
                    invests $500B in clean energy and creates 2M jobs.&rdquo;
                  </p>
                  <p className="font-dm-sans text-[10px] text-[#8a7060] mt-2.5 font-medium">
                    — The Guardian, NYT, MSNBC
                  </p>
                </div>

                {/* Right */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#c43b3b]" />
                    <span className="font-dm-sans text-xs font-bold text-[#c43b3b] uppercase tracking-wider">
                      Right view
                    </span>
                  </div>
                  <p className="font-dm-sans text-xs text-[#5a2c2c] leading-relaxed">
                    &ldquo;Regulatory overreach at taxpayer expense. Energy
                    prices will spike 20%, hitting the middle class hardest.&rdquo;
                  </p>
                  <p className="font-dm-sans text-[10px] text-[#8a7060] mt-2.5 font-medium">
                    — WSJ, Fox News, National Review
                  </p>
                </div>
              </div>

              {/* AI summary bar */}
              <div
                className="px-5 py-3.5 border-t border-[#e4cfa0]"
                style={{ background: "#f8f2e3" }}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
                  >
                    <span className="text-white text-[9px] font-bold">AI</span>
                  </div>
                  <p className="font-dm-sans text-xs text-[#4a3728] leading-relaxed">
                    <span className="font-semibold">Khali summary:</span> The Senate
                    passed a $500B climate bill (51–49). Supporters cite job creation;
                    critics warn of energy cost spikes. Implementation begins 2026.
                  </p>
                </div>
              </div>

              {/* Voting row */}
              <div className="px-5 py-3 border-t border-[#e4cfa0] flex items-center justify-between">
                <p className="font-dm-sans text-xs text-[#8a7060]">Which view is more compelling?</p>
                <div className="flex items-center gap-2">
                  <button
                    className="font-dm-sans text-[10px] font-semibold text-[#3b60c4] bg-[#e8eef8] hover:bg-[#d4dcf0] transition-colors px-3 py-1.5 rounded-full"
                    aria-label="Vote for left view"
                  >
                    ◀ Left
                  </button>
                  <button
                    className="font-dm-sans text-[10px] font-semibold text-[#c43b3b] bg-[#f8e8e8] hover:bg-[#f0d4d4] transition-colors px-3 py-1.5 rounded-full"
                    aria-label="Vote for right view"
                  >
                    Right ▶
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Categories ─────────────────────────────────────────────────────

function Categories() {
  return (
    <section id="categories" className="py-24 lg:py-32 bg-[#f8f2e3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="font-dm-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#b8882e] mb-4">
            10 categories, one app
          </p>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-[#1a120b] leading-tight mb-4">
            Cover every story that matters.
          </h2>
          <p className="font-dm-sans text-base text-[#5c4030] max-w-xl mx-auto leading-relaxed">
            Pick your categories on sign-up. Mix tech with politics, sports with
            science — Khali pulls the best stories across all of them.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`category-pill ${cat.color} rounded-2xl px-4 py-5 flex flex-col items-center gap-2.5 border border-[#ddd0b8] shadow-warm-sm cursor-default`}
            >
              <span className="text-2xl" role="img" aria-label={cat.name}>
                {cat.icon}
              </span>
              <span className="font-dm-sans text-xs font-semibold text-center leading-tight">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Download CTA ────────────────────────────────────────────────────

function DownloadCTA() {
  return (
    <section
      id="download"
      className="py-24 lg:py-32 relative overflow-hidden"
      style={{ background: "var(--cream-50)" }}
    >
      {/* Decorative large circle */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, #f0e4c8 0%, transparent 65%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Ornamental rule */}
        <div className="flex items-center justify-center gap-4 mb-8" aria-hidden="true">
          <div className="h-px w-12 bg-[#d4b47a]" />
          <span className="text-[#d4a847] text-lg">✦</span>
          <div className="h-px w-12 bg-[#d4b47a]" />
        </div>

        <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1a120b] leading-tight mb-6">
          Read smarter.
          <br />
          <em className="italic text-[#b8882e]">Stay balanced.</em>
        </h2>

        <p className="font-dm-sans text-base sm:text-lg text-[#4a3728] leading-relaxed mb-10 max-w-xl mx-auto">
          Join readers who get their news in bite-sized format — short videos,
          clean summaries, and always, always both sides.
        </p>

        {/* App store CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#"
            className="appstore-btn inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-dm-sans font-semibold text-white shadow-warm-lg"
            style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
            aria-label="Download Khali on the App Store"
          >
            <IconApple />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-normal opacity-80">Download on the</span>
              <span className="text-base font-bold">App Store</span>
            </span>
          </a>
        </div>

        {/* Fine print */}
        <p className="font-dm-sans text-xs text-[#8a7060] mt-8">
          Free &nbsp;·&nbsp; iOS 16 and above &nbsp;·&nbsp; No credit card required
        </p>

        {/* Another rule */}
        <div className="flex items-center justify-center gap-4 mt-10" aria-hidden="true">
          <div className="h-px w-12 bg-[#d4b47a]" />
          <span className="text-[#d4a847] text-lg">✦</span>
          <div className="h-px w-12 bg-[#d4b47a]" />
        </div>
      </div>
    </section>
  );
}

// ─── Section: Footer ─────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t border-[#e4cfa0]"
      style={{ background: "#f0e4c8" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #d4a847 0%, #9a6e1c 100%)" }}
              >
                <span className="font-playfair text-sm font-bold text-white">K</span>
              </div>
              <span className="font-playfair text-xl font-bold text-[#1a120b]">Khali</span>
            </div>
            <p className="font-dm-sans text-sm text-[#5c4030] leading-relaxed mb-5 max-w-[200px]">
              Personalized, AI-powered news. Both sides, always.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                { label: "Twitter / X", symbol: "𝕏" },
                { label: "Instagram",   symbol: "◉" },
                { label: "LinkedIn",    symbol: "in" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-[#fdfaf4] border border-[#d4b47a] flex items-center justify-center font-dm-sans text-xs font-bold text-[#5c3d2e] hover:bg-[#f0e4c8] transition-colors"
                >
                  {s.symbol}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-dm-sans text-xs font-bold uppercase tracking-[0.14em] text-[#8a7060] mb-4">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-dm-sans text-sm text-[#4a3728] hover:text-[#1a120b] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom rule */}
        <div className="border-t border-[#d4b47a] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-dm-sans text-xs text-[#8a7060]">
            © {new Date().getFullYear()} Khali. All rights reserved.
          </p>
          <p className="font-dm-sans text-xs text-[#8a7060]">
            Made with care for curious minds.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <BothSides />
        <Categories />
        <DownloadCTA />
      </main>
      <Footer />
    </>
  );
}
