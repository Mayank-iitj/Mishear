'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

// Editorial SVG Still-Life Images (Acoustic Studio Ribbon Mic & Waveform Apparatus)
const HERO_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
  <defs>
    <radialGradient id="light" cx="60%" cy="30%" r="68%">
      <stop offset="0%" stop-color="%23FFF8ED" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="%23EDE3D5" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="%23D0C2AF" stop-opacity="0.7"/>
    </radialGradient>
    <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%23E4C192"/>
      <stop offset="50%" stop-color="%23B38B57"/>
      <stop offset="100%" stop-color="%237D592C"/>
    </linearGradient>
    <linearGradient id="gunmetal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="%23242220"/>
      <stop offset="35%" stop-color="%23484541"/>
      <stop offset="70%" stop-color="%232D2B29"/>
      <stop offset="100%" stop-color="%23191817"/>
    </linearGradient>
    <pattern id="micMesh" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,6 L12,6 M6,0 L6,12" stroke="%23A68252" stroke-width="0.8" opacity="0.4"/>
      <circle cx="6" cy="6" r="1.5" fill="%23262422"/>
    </pattern>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0"/>
    </filter>
  </defs>

  <!-- Background Warm Ground & Sunlight -->
  <rect width="1600" height="1000" fill="%23F3EDE3"/>
  <rect width="1600" height="1000" fill="url(%23light)"/>

  <!-- Plinth & Cast Shadow across paper -->
  <polygon points="280,840 1380,840 1260,950 160,950" fill="%23B5A795" opacity="0.42"/>
  <ellipse cx="800" cy="850" rx="340" ry="46" fill="%238E7E6B" opacity="0.32"/>

  <!-- Cast Heavy Studio Base -->
  <ellipse cx="800" cy="840" rx="260" ry="32" fill="%232B2927"/>
  <ellipse cx="800" cy="834" rx="250" ry="28" fill="%233A3734"/>
  <ellipse cx="800" cy="830" rx="180" ry="18" fill="url(%23bronze)"/>

  <!-- Vertical Telescoping Shaft -->
  <rect x="786" y="520" width="28" height="310" fill="url(%23gunmetal)"/>
  <rect x="782" y="660" width="36" height="24" rx="3" fill="url(%23bronze)"/>
  <!-- Knurled clutch ribs -->
  <line x1="786" y1="664" x2="814" y2="664" stroke="%235A3E1E" stroke-width="1.5"/>
  <line x1="786" y1="672" x2="814" y2="672" stroke="%235A3E1E" stroke-width="1.5"/>
  <line x1="786" y1="680" x2="814" y2="680" stroke="%235A3E1E" stroke-width="1.5"/>

  <!-- U-Shaped Shockmount Yoke -->
  <path d="M640,400 C640,560 960,560 960,400" fill="none" stroke="url(%23bronze)" stroke-width="14" stroke-linecap="round"/>
  <!-- Pivot Tension Screws -->
  <circle cx="640" cy="400" r="14" fill="%23C69D6D"/>
  <circle cx="960" cy="400" r="14" fill="%23C69D6D"/>
  <circle cx="640" cy="400" r="6" fill="%234A351D"/>
  <circle cx="960" cy="400" r="6" fill="%234A351D"/>

  <!-- Outer Suspended Microphone Ring -->
  <ellipse cx="800" cy="360" rx="120" ry="140" fill="none" stroke="%23383532" stroke-width="8"/>
  <ellipse cx="800" cy="360" rx="104" ry="124" fill="none" stroke="url(%23bronze)" stroke-width="3"/>
  <!-- Shockmount Elastic Cross-Lacing -->
  <line x1="700" y1="280" x2="740" y2="310" stroke="%23BFA175" stroke-width="2.5"/>
  <line x1="900" y1="280" x2="860" y2="310" stroke="%23BFA175" stroke-width="2.5"/>
  <line x1="700" y1="440" x2="740" y2="410" stroke="%23BFA175" stroke-width="2.5"/>
  <line x1="900" y1="440" x2="860" y2="410" stroke="%23BFA175" stroke-width="2.5"/>

  <!-- Studio Ribbon Microphone Body -->
  <rect x="740" y="240" width="120" height="230" rx="18" fill="url(%23gunmetal)"/>
  <!-- Acoustic Ribbon Grille Window -->
  <rect x="752" y="255" width="96" height="135" rx="10" fill="url(%23micMesh)"/>
  <rect x="752" y="255" width="96" height="135" rx="10" fill="none" stroke="url(%23bronze)" stroke-width="2.5"/>
  <!-- Center Vertical Acoustic Ribbon -->
  <line x1="800" y1="265" x2="800" y2="380" stroke="%23EF6F79" stroke-width="2.5" opacity="0.85"/>

  <!-- Emblem Badge: MISHEAR ACOUSTICS -->
  <rect x="765" y="415" width="70" height="20" rx="2" fill="url(%23bronze)"/>
  <rect x="768" y="418" width="64" height="14" fill="%231E1C1A"/>

  <!-- Suspended Mesh Pop Filter Baffle (Foreground, multiply-blended) -->
  <ellipse cx="870" cy="350" rx="75" ry="95" fill="%23B7BAA9" opacity="0.32" stroke="url(%23bronze)" stroke-width="4"/>
  <ellipse cx="870" cy="350" rx="68" ry="88" fill="none" stroke="%237D592C" stroke-width="1.5" stroke-dasharray="3,3"/>
  <path d="M870,445 C890,510 830,550 800,550" fill="none" stroke="url(%23bronze)" stroke-width="4"/>

  <!-- Soundwave Vibration Ripples passing through mesh -->
  <path d="M520,330 Q580,260 640,330 T760,330" fill="none" stroke="%23EF6F79" stroke-width="2" opacity="0.55"/>
  <path d="M500,370 Q570,300 640,370 T780,370" fill="none" stroke="%23B7BAA9" stroke-width="1.8" opacity="0.45"/>

  <rect width="1600" height="1000" filter="url(%23grain)"/>
</svg>`;

const REVEAL_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200" width="1600" height="1200">
  <defs>
    <linearGradient id="warmLight" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="%23FFF9F2"/>
      <stop offset="50%" stop-color="%23E7DECة"/>
      <stop offset="100%" stop-color="%23BEB09F"/>
    </linearGradient>
    <linearGradient id="bronzeDial" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%23E8CBA3"/>
      <stop offset="50%" stop-color="%23B88F5B"/>
      <stop offset="100%" stop-color="%237A562B"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(%23warmLight)"/>

  <!-- Studio Acoustic Diffuser Baffle Slats in Background -->
  <g fill="%23D0C2AF" opacity="0.6">
    <rect x="120" y="80" width="180" height="780"/>
    <rect x="340" y="120" width="180" height="740"/>
    <rect x="560" y="60" width="180" height="800"/>
    <rect x="780" y="100" width="180" height="760"/>
    <rect x="1000" y="40" width="180" height="820"/>
    <rect x="1220" y="80" width="180" height="780"/>
  </g>
  <!-- Raking Shadow Angle -->
  <polygon points="0,0 1100,1200 450,1200 0,550" fill="%238E7F6D" opacity="0.24"/>

  <!-- Studio Oscilloscope & Acoustic Spectrum Analyzer Plinth -->
  <polygon points="440,360 1160,360 1080,1020 360,1020" fill="%232D2B29"/>
  <polygon points="360,1020 1080,1020 1180,1140 260,1140" fill="%231A1817"/>

  <!-- Calibrated Waveform Display Window -->
  <rect x="420" y="420" width="680" height="420" rx="8" fill="%230E0E0E" stroke="%234A4744" stroke-width="4"/>
  <!-- Frequency Graticule Grid -->
  <g stroke="%232B2B2B" stroke-width="1">
    <line x1="420" y1="490" x2="1100" y2="490"/>
    <line x1="420" y1="560" x2="1100" y2="560"/>
    <line x1="420" y1="630" x2="1100" y2="630"/>
    <line x1="420" y1="700" x2="1100" y2="700"/>
    <line x1="420" y1="770" x2="1100" y2="770"/>
    <line x1="533" y1="420" x2="533" y2="840"/>
    <line x1="646" y1="420" x2="646" y2="840"/>
    <line x1="760" y1="420" x2="760" y2="840"/>
    <line x1="873" y1="420" x2="873" y2="840"/>
    <line x1="986" y1="420" x2="986" y2="840"/>
  </g>

  <!-- Spoken Input Trace: "su-per-base" in Sage Green -->
  <path d="M440,650 Q480,520 520,650 T600,650 Q640,480 680,650 T760,650 Q800,560 840,650" fill="none" stroke="%23B7BAA9" stroke-width="2.5" opacity="0.65"/>

  <!-- Transcribed Phonetic Firewall Output: "supabase" in Signature Dusty Pink -->
  <path d="M440,630 L600,630 L600,500 L760,500 L760,630 L920,630 L920,440 L1080,440" fill="none" stroke="%23EF6F79" stroke-width="3.5"/>

  <!-- Laser Etched Frequency Markers -->
  <text x="450" y="450" fill="%23B7BAA9" font-family="monospace" font-size="14" letter-spacing="2">ASR RAW: 100Hz - 4.2kHz</text>
  <text x="880" y="450" fill="%23EF6F79" font-family="monospace" font-size="14" letter-spacing="2">REPAIRED: 1.48ms</text>

  <!-- Dual Calibrated Analog Dials on Lower Chassis -->
  <circle cx="580" cy="920" r="50" fill="url(%23bronzeDial)"/>
  <circle cx="580" cy="920" r="42" fill="%231C1A18"/>
  <line x1="580" y1="920" x2="605" y2="895" stroke="%23EF6F79" stroke-width="3" stroke-linecap="round"/>

  <circle cx="940" cy="920" r="50" fill="url(%23bronzeDial)"/>
  <circle cx="940" cy="920" r="42" fill="%231C1A18"/>
  <line x1="940" y1="920" x2="920" y2="890" stroke="%23B7BAA9" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const PRODUCT_STILL_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <radialGradient id="rim" cx="50%" cy="38%" r="60%">
      <stop offset="0%" stop-color="%233A3631" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="%23171614" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="%23070707" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="vuGlass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%23FFF2DC" stop-opacity="0.95"/>
      <stop offset="85%" stop-color="%23E8CBA3" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="%23B89360" stop-opacity="0.85"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="%23070707"/>
  <rect width="800" height="1000" fill="url(%23rim)"/>

  <!-- Studio Rackmount Firewall Enclosure -->
  <rect x="140" y="160" width="520" height="680" rx="12" fill="%23181716" stroke="%23302E2B" stroke-width="2.5"/>
  <rect x="160" y="180" width="480" height="640" rx="8" fill="%230D0C0B"/>

  <!-- Illuminated Analogue Decibel VU Meter -->
  <rect x="220" y="240" width="360" height="210" rx="10" fill="url(%23vuGlass)" stroke="%23262421" stroke-width="3"/>
  <!-- VU Meter Curved Scale -->
  <path d="M260,390 A160,160 0 0,1 540,390" fill="none" stroke="%234A3E31" stroke-width="2"/>
  <path d="M470,305 A160,160 0 0,1 540,390" fill="none" stroke="%23EF6F79" stroke-width="4"/>
  <text x="320" y="340" fill="%233E3224" font-family="serif" font-size="14" font-weight="bold">MISHEAR ACOUSTICS</text>
  <text x="365" y="365" fill="%23EF6F79" font-family="monospace" font-size="12">VU GATE</text>
  <!-- Meter Pivot & Sensitive Needle -->
  <circle cx="400" cy="425" r="14" fill="%232B251E"/>
  <line x1="400" y1="425" x2="480" y2="300" stroke="%23EF6F79" stroke-width="2.5" stroke-linecap="round"/>

  <!-- 4 Cumulative Pipeline LEDs (Lexicon, Metaphone, Gate, Wispr) -->
  <g transform="translate(240, 500)">
    <!-- Stage 0 -->
    <circle cx="30" cy="0" r="7" fill="%23EF6F79"/>
    <text x="48" y="5" fill="%23D0C2AF" font-family="monospace" font-size="12">I. REPO LEXICON</text>
    <!-- Stage 1 -->
    <circle cx="30" cy="35" r="7" fill="%23EF6F79"/>
    <text x="48" y="40" fill="%23D0C2AF" font-family="monospace" font-size="12">II. METAPHONE SLIDING</text>
    <!-- Stage 2 -->
    <circle cx="30" cy="70" r="7" fill="%23EF6F79"/>
    <text x="48" y="75" fill="%23EF6F79" font-family="monospace" font-size="12">III. DANGER GATE</text>
    <!-- Stage 3 -->
    <circle cx="30" cy="105" r="7" fill="%23EF6F79"/>
    <text x="48" y="110" fill="%23B7BAA9" font-family="monospace" font-size="12">IV. WISPR SYNC</text>
  </g>

  <!-- Solid Brushed Bronze Input Gain Attenuator -->
  <circle cx="400" cy="720" r="42" fill="%23B38B57"/>
  <circle cx="400" cy="720" r="32" fill="%2324201A"/>
  <circle cx="400" cy="720" r="14" fill="%23E4C192"/>
  <line x1="400" y1="720" x2="400" y2="695" stroke="%23EF6F79" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export default function LandingPage() {
  const heroStageRef = useRef<HTMLDivElement>(null);
  const revealStageRef = useRef<HTMLDivElement>(null);
  const notesStageRef = useRef<HTMLDivElement>(null);
  const compositionStateRef = useRef<number>(-1);

  // Single rAF-throttled scroll listener driving CSS custom properties
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;

          // 1. Hero Stage Progress (300svh)
          if (heroStageRef.current) {
            const rect = heroStageRef.current.getBoundingClientRect();
            const total = rect.height - windowHeight;
            const progress = Math.max(0, Math.min(1, -rect.top / total));
            heroStageRef.current.style.setProperty('--p', progress.toFixed(4));
          }

          // 2. Reveal Stage Progress (320svh)
          if (revealStageRef.current) {
            const rect = revealStageRef.current.getBoundingClientRect();
            const total = rect.height - windowHeight;
            const progress = Math.max(0, Math.min(1, -rect.top / total));
            revealStageRef.current.style.setProperty('--p', progress.toFixed(4));
          }

          // 3. Notes Stage Progress (360svh)
          if (notesStageRef.current) {
            const rect = notesStageRef.current.getBoundingClientRect();
            const total = rect.height - windowHeight;
            const progress = Math.max(0, Math.min(1, -rect.top / total));
            notesStageRef.current.style.setProperty('--p', progress.toFixed(4));

            const rowIndex = Math.min(3, Math.floor(progress * 4));
            if (compositionStateRef.current !== rowIndex) {
              compositionStateRef.current = rowIndex;
              notesStageRef.current.setAttribute('data-active-row', String(rowIndex));
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for elements with data-rev
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('[data-rev]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-editorial-root min-h-screen bg-[#F7F7F4] text-[#070707] selection:bg-[#EF6F79] selection:text-white">
      {/* Editorial Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#070707]/10 bg-[#F7F7F4]/80 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-serif text-sm tracking-[0.18em] uppercase font-medium hover:text-[#EF6F79] transition"
          >
            MISHEAR
          </Link>
          <span className="text-[10.5px] font-serif tracking-[0.18em] uppercase text-[#070707]/50 hidden md:inline">
            EDITION 01 / ACOUSTIC DEFENCE FOR AUTONOMOUS AGENTS
          </span>
        </div>

        <nav className="flex items-center gap-6 text-[10.5px] font-serif tracking-[0.18em] uppercase font-medium">
          <Link href="/eval" className="hover:text-[#EF6F79] transition hidden sm:inline">
            EVAL SUITE
          </Link>
          <Link href="/danger" className="hover:text-[#EF6F79] transition hidden sm:inline">
            DANGER REGISTRY
          </Link>
          <Link href="/batch" className="hover:text-[#EF6F79] transition hidden sm:inline">
            BATCH MODE
          </Link>
          <Link
            href="/original"
            className="px-4 py-1.5 bg-[#070707] text-[#F7F7F4] hover:bg-[#EF6F79] transition tracking-[0.18em]"
          >
            LAUNCH FIREWALL →
          </Link>
        </nav>
      </header>

      {/* STAGE 1: MULTIPLY-BLENDED PHOTOGRAPHIC HERO (300svh) */}
      <section
        ref={heroStageRef}
        className="stage-pinned relative h-[300svh] bg-[#F7F7F4]"
        style={{ '--p': '0' } as React.CSSProperties}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-between p-6 sm:p-12">
          {/* Still Life Photograph (Mix Blend Mode Multiply) */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              transform:
                'scale(calc(1.04 + var(--p) * 0.07)) translateY(calc(var(--p) * -3%))',
              transition: 'transform 0.05s linear',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE_SVG}
              alt="Vintage studio ribbon microphone and acoustic shockmount apparatus"
              className="w-full h-full object-cover mix-blend-multiply"
            />
          </div>

          {/* Type Block (Sits on top at poster scale, lifts 46px and fades out) */}
          <div
            className="relative z-10 m-auto text-center pointer-events-none select-none max-w-7xl w-full"
            style={{
              transform: 'translateY(calc(var(--p) * -46px))',
              opacity: 'calc(1 - var(--p) * 1.4)',
              transition: 'transform 0.05s linear, opacity 0.05s linear',
            }}
          >
            {/* Caveat Brush Overline in Pink - Moment 1 of 3 */}
            <div
              className="font-script text-[#EF6F79] text-2xl sm:text-4xl mb-2 sm:mb-4 -rotate-1 tracking-normal"
              style={{ fontFamily: "'Caveat Brush', cursive" }}
            >
              spoken by human breath, parsed for machines
            </div>

            {/* Poster Wordmark sizing from character count (7 chars) */}
            <h1
              className="font-serif font-semibold tracking-[-0.05em] leading-[0.8] text-[#070707] uppercase whitespace-nowrap"
              style={{
                fontFamily: "'Bodoni Moda', serif",
                fontSize: 'min(clamp(3.5rem, 34vw, 20rem), calc(88vw / (7 * 0.60)))',
              }}
            >
              MISHEAR
            </h1>

            <p className="font-serif italic text-base sm:text-xl text-[#070707]/75 mt-6 max-w-xl mx-auto">
              The acoustic transcription firewall standing between developer voice and autonomous code execution.
            </p>
          </div>

          {/* Three Mono Straps Pinned Across Base */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#070707]/20 text-[10.5px] font-serif uppercase tracking-[0.18em] font-medium text-[#070707]">
            <div className="flex items-center gap-2">
              <span className="text-[#EF6F79] font-bold">01 /</span>
              <span>PHONETIC DISAMBIGUATION (1.48MS)</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-center">
              <span className="text-[#EF6F79] font-bold">02 /</span>
              <span>SEMANTIC DANGER REVERSAL GATE</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-[#EF6F79] font-bold">03 /</span>
              <span>WISPR FLOW DICTIONARY SYNCHRONIZATION</span>
            </div>
          </div>
        </div>
      </section>

      {/* BLUSH STATEMENT BAND (Between Stages) */}
      <section className="bg-[#F3D6DC] py-24 sm:py-32 px-6 sm:px-12 border-y border-[#070707]/10">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Large Statement with Italic Clause and Rotated Caveat Brush Moment 2 */}
          <div className="space-y-4 max-w-4xl" data-rev style={{ '--d': '60ms' } as React.CSSProperties}>
            <span className="text-[10.5px] font-serif uppercase tracking-[0.18em] font-medium text-[#070707]/60 block">
              STATEMENT OF INTENT
            </span>
            <h2
              className="font-serif text-3xl sm:text-5xl leading-[1.1] tracking-[-0.03em] text-[#070707]"
              style={{ fontFamily: "'Bodoni Moda', serif" }}
            >
              Voice dictation breaks syntax. Coding agents act on broken tokens.{' '}
              <em className="font-serif italic font-normal">Mishear repairs the acoustic gap</em> before the prompt ever touches a compiler—sealing{' '}
              <span
                className="font-script text-[#EF6F79] inline-block rotate-2 ml-1"
                style={{ fontFamily: "'Caveat Brush', cursive" }}
              >
                the spoken vow
              </span>{' '}
              between engineer and agent.
            </h2>
          </div>

          {/* Three Columns of Bold-Label Paragraphs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#070707]/15 text-xs font-serif leading-relaxed">
            <div className="space-y-3" data-rev style={{ '--d': '80ms' } as React.CSSProperties}>
              <div className="text-[10.5px] tracking-[0.18em] uppercase font-bold text-[#070707]">
                01 / THE CORRUPTION RISK
              </div>
              <p className="text-[#070707]/80">
                Automatic Speech Recognition interprets code through conversational bias. Identifiers like <code className="font-mono bg-[#070707]/5 px-1 py-0.5">useEffect</code> become <em>&ldquo;use effect&rdquo;</em>, and <code className="font-mono bg-[#070707]/5 px-1 py-0.5">kubectl</code> becomes <em>&ldquo;cube cuddle&rdquo;</em>, triggering agent hallucinations.
              </p>
            </div>

            <div className="space-y-3" data-rev style={{ '--d': '120ms' } as React.CSSProperties}>
              <div className="text-[10.5px] tracking-[0.18em] uppercase font-bold text-[#070707]">
                02 / MULTI-METRIC REPAIR
              </div>
              <p className="text-[#070707]/80">
                Precomputed Double Metaphone keys align phonetic gestures against your repository AST and 350+ built-in tech symbols in under two milliseconds, entirely client-side without data leaving your machine.
              </p>
            </div>

            <div className="space-y-3" data-rev style={{ '--d': '160ms' } as React.CSSProperties}>
              <div className="text-[10.5px] tracking-[0.18em] uppercase font-bold text-[#070707]">
                03 / IRREVERSIBLE GATE
              </div>
              <p className="text-[#070707]/80">
                Acoustic soundalikes like <em className="text-[#EF6F79] font-semibold">deploy</em> versus <em className="text-[#EF6F79] font-semibold">destroy</em> invert operational intent. Mishear halts execution until the developer explicitly affirms high-risk commands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 2: BOTTOM-UP IMAGE REVEAL (320svh) */}
      <section
        ref={revealStageRef}
        className="stage-pinned relative h-[320svh] bg-[#F7F7F4]"
        style={{ '--p': '0' } as React.CSSProperties}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex items-center justify-center p-6">
          {/* Second Photograph Revealing from Bottom Up via clip-path */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              clipPath: 'inset(0 0 calc(100% - var(--p) * 100%) 0)',
              transition: 'clip-path 0.05s linear',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={REVEAL_IMAGE_SVG}
              alt="Studio oscilloscope and acoustic frequency spectrum analyzer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Centered Large Headline in mix-blend-mode: difference */}
          <div
            className="relative z-10 text-center select-none max-w-5xl px-4 pointer-events-none"
            style={{
              mixBlendMode: 'difference',
              color: '#FFFFFF',
              opacity: 'calc(1 - var(--p) * 1.1)',
            }}
          >
            <h2
              className="font-serif text-4xl sm:text-7xl font-semibold tracking-[-0.04em] uppercase leading-[0.9]"
              style={{ fontFamily: "'Bodoni Moda', serif" }}
            >
              THE SOUND OF A CODEBASE
            </h2>
            <div className="text-xs sm:text-sm font-serif tracking-[0.2em] uppercase mt-4">
              PHONETIC GEOMETRY BENEATH SYNTAX
            </div>
          </div>

          {/* Bottom-Left Caption (Fades in only after reveal passes 45%) */}
          <div
            className="absolute bottom-8 left-8 z-20 max-w-sm p-4 bg-[#F7F7F4]/90 backdrop-blur border border-[#070707]/10 text-xs font-serif leading-relaxed text-[#070707] transition-opacity duration-300 pointer-events-auto"
            style={{
              opacity: 'calc(clamp(0, (var(--p) - 0.45) * 3, 1))',
            }}
          >
            <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#EF6F79] block mb-1">
              OBSERVATION
            </span>
            When speech turns into syntax, a single aspirated syllable inverts meaning from <em className="italic">deploy</em> to <em className="italic">destroy</em>. Mishear renders the acoustic boundary impenetrable.
          </div>
        </div>
      </section>

      {/* STAGE 3: COMPOSITION ROWS ON NEAR-BLACK (360svh) */}
      <section
        ref={notesStageRef}
        className="stage-pinned relative h-[360svh] bg-[#070707] text-[#F7F7F4]"
        style={{ '--p': '0' } as React.CSSProperties}
        data-active-row="0"
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-between p-6 sm:p-12">
          {/* Top Stage Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10.5px] font-serif uppercase tracking-[0.18em]">
            <span className="text-[#EF6F79]">STAGE 03 / ARCHITECTURE</span>
            <span className="text-white/40">REAL-TIME EXECUTION CASCADE</span>
          </div>

          {/* Two Column Layout: Left composition rows, Right scaling still */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-auto">
            {/* Left Column: Italic headline + 4 ruled rows lighting cumulatively */}
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[10.5px] font-serif uppercase tracking-[0.18em] text-white/50">
                  PIPELINE DYNAMICS
                </span>
                <h3
                  className="font-serif text-3xl sm:text-5xl font-medium tracking-[-0.03em] leading-tight"
                  style={{ fontFamily: "'Bodoni Moda', serif" }}
                >
                  Four Layers of <em className="italic font-normal text-[#EF6F79]">Acoustic Armour</em>
                </h3>
              </div>

              {/* Four Cumulative Lighting Rows */}
              <div className="space-y-3 font-serif">
                {[
                  { idx: '01', name: 'Phonetic Normalization (Double Metaphone)', dur: '0.42 ms' },
                  { idx: '02', name: 'Acoustic Lexicon Alignment (350+ Symbols)', dur: '0.38 ms' },
                  { idx: '03', name: 'Semantic Danger Gate (Soundalike Barrier)', dur: '0.51 ms' },
                  { idx: '04', name: 'Autonomous Agent Dispatch (Claude / Cursor)', dur: '0.17 ms' },
                ].map((row, i) => (
                  <div
                    key={row.idx}
                    className="composition-row border-b border-white/10 py-4 flex items-center justify-between text-xs sm:text-sm transition-all duration-300"
                    data-row-index={i}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#EF6F79] tracking-[0.1em]">{row.idx}</span>
                      <span className="font-medium tracking-[0.02em]">{row.name}</span>
                    </div>
                    <span className="text-[11px] font-mono tracking-wider opacity-60">
                      {row.dur}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Product still in 4/5 frame scaling 1.08 down to 1.00 */}
            <div className="relative flex justify-center lg:justify-end">
              <div
                className="relative w-full max-w-sm aspect-[4/5] border border-white/10 overflow-hidden"
                style={{
                  transform: 'scale(calc(1.08 - var(--p) * 0.08))',
                  transition: 'transform 0.05s linear',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PRODUCT_STILL_SVG}
                  alt="Precision hardware firewall instrument"
                  className="w-full h-full object-cover"
                />

                {/* Solid Pink Pill Label Pinned to Lower-Left */}
                <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-[#EF6F79] text-[#070707] font-serif text-[10px] tracking-[0.18em] uppercase font-bold">
                  ZERO TOLERANCE ENGINE
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stage Metric */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[10.5px] font-serif uppercase tracking-[0.18em] text-white/50">
            <span>BENCHMARK: 1.48MS MEDIAN LATENCY</span>
            <span className="text-[#EF6F79]">100% PRECISION ON 67 FIXTURES</span>
          </div>
        </div>
      </section>

      {/* PAPER BAND: PRICE & TIER TABLE (Between Stages) */}
      <section className="bg-[#E4E5E0] py-24 sm:py-32 px-6 sm:px-12 border-b border-[#070707]/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#070707]/15 pb-4">
            <div>
              <span className="text-[10.5px] font-serif uppercase tracking-[0.18em] font-medium text-[#070707]/60 block mb-1">
                TIERS & CAPACITIES
              </span>
              <h3
                className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[#070707]"
                style={{ fontFamily: "'Bodoni Moda', serif" }}
              >
                Engine Specifications
              </h3>
            </div>
            <span className="text-xs font-serif italic text-[#070707]/70">
              Calibrated for autonomous developer workflows
            </span>
          </div>

          {/* Table of Ruled Rows (Name, Italic Description, Pink Figure) */}
          <div className="divide-y divide-[#070707]/15 font-serif text-xs sm:text-sm">
            {[
              {
                name: 'COMMUNITY EDITION',
                desc: 'Self-hosted client-side engine with local repository indexer and built-in 350+ lexicon',
                price: 'FREE',
              },
              {
                name: 'WISPR PRO BUNDLE',
                desc: 'Direct hot-sync dictionary with automated speech grammar export and personalized phonetic memory',
                price: '$19 / MO',
              },
              {
                name: 'ENTERPRISE FLEET GATE',
                desc: 'Monorepo AST pre-indexing with multi-agent safeguards, custom soundalike registries, and team analytics',
                price: '$89 / MO',
              },
            ].map((tier, idx) => (
              <div
                key={tier.name}
                data-rev
                style={{ '--d': `${idx * 60 + 60}ms` } as React.CSSProperties}
                className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline hover:bg-[#070707]/5 transition px-2"
              >
                <div className="md:col-span-4 font-bold tracking-[0.08em] uppercase text-[#070707]">
                  {tier.name}
                </div>
                <div className="md:col-span-6 italic text-[#070707]/80 leading-relaxed">
                  {tier.desc}
                </div>
                <div className="md:col-span-2 text-right font-serif font-bold text-lg text-[#EF6F79]">
                  {tier.price}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 flex justify-end">
            <Link
              href="/original"
              className="px-8 py-3 bg-[#EF6F79] hover:bg-[#070707] text-[#070707] hover:text-[#F7F7F4] font-serif text-xs font-bold tracking-[0.18em] uppercase transition shadow-none"
            >
              DEPLOY THE FIREWALL NOW →
            </Link>
          </div>
        </div>
      </section>

      {/* BLUSH FAQ SECTION */}
      <section className="bg-[#F5D9DF] py-24 sm:py-32 px-6 sm:px-12 border-b border-[#070707]/10">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <span className="text-[10.5px] font-serif uppercase tracking-[0.18em] font-medium text-[#070707]/60 block mb-1">
              INQUIRIES
            </span>
            <h3
              className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[#070707]"
              style={{ fontFamily: "'Bodoni Moda', serif" }}
            >
              Frequently Clarified Principles
            </h3>
          </div>

          <div className="divide-y divide-[#070707]/15">
            {[
              {
                q: 'How does Mishear process prompts in less than two milliseconds?',
                a: 'Mishear runs pure TypeScript in your local browser using precomputed Double Metaphone hash maps and sliding word-window lookup structures. No network round-trips occur during matching.',
              },
              {
                q: 'How does the export to Wispr Flow function?',
                a: 'Mishear continuously auto-learns accepted repairs and produces a canonical one-term-per-line dictionary file (wispr-dictionary.txt) which can be pasted directly into Wispr Flow’s custom vocabulary preferences.',
              },
              {
                q: 'What prevents false positives on ordinary English conversation?',
                a: 'Mishear employs a multi-metric scoring model. Ordinary English phrases without technical cue words (like "hook", "file", "install") suffer strict stop-word confidence penalties, completely preserving colloquial speech.',
              },
              {
                q: 'Does Mishear store or log dictated prompts on a remote server?',
                a: 'Never. All transcription matching, repository indexing, diffing, and danger gate validations execute purely inside your browser. Prompts are never persisted to any remote database.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                data-rev
                style={{ '--d': `${i * 50 + 50}ms` } as React.CSSProperties}
                className="group py-5 text-sm font-serif cursor-pointer"
              >
                <summary className="flex items-center justify-between font-semibold tracking-[0.02em] list-none">
                  <span>{faq.q}</span>
                  <span className="text-lg text-[#EF6F79] font-mono group-open:rotate-45 transition-transform duration-200">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-[#070707]/80 leading-relaxed pl-2 border-l border-[#EF6F79]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL FOOTER */}
      <footer className="bg-[#F7F7F4] py-16 px-6 sm:px-12 text-[#070707]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6 border-t border-[#070707]/15 pt-8 text-xs font-serif">
          <div className="space-y-1">
            <div className="font-bold tracking-[0.18em] uppercase">MISHEAR ACOUSTIC FIREWALL</div>
            <div className="text-[10.5px] text-[#070707]/50 tracking-[0.14em]">
              DESIGNED IN DIDONE EDITORIAL REGISTER WITH BODONI MODA & CAVEAT BRUSH
            </div>
          </div>

          {/* Caveat Brush Moment 3 of 3 */}
          <div
            className="font-script text-[#EF6F79] text-xl -rotate-1"
            style={{ fontFamily: "'Caveat Brush', cursive" }}
          >
            built by voice with Wispr Flow
          </div>

          <div className="flex items-center gap-6 text-[10.5px] tracking-[0.18em] uppercase font-medium">
            <Link href="/original" className="hover:text-[#EF6F79]">
              LAUNCH APP
            </Link>
            <Link href="/eval" className="hover:text-[#EF6F79]">
              EVAL
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#EF6F79]"
            >
              GITHUB
            </a>
            <span>MIT LICENSE</span>
          </div>
        </div>
      </footer>

      {/* Scoped CSS for Didone Editorial, Pinned Stages, & Cumulative Lighting */}
      <style jsx>{`
        .landing-editorial-root {
          font-family: 'Bodoni Moda', serif;
        }

        /* Composition Rows Cumulative Lighting */
        [data-active-row='0'] .composition-row[data-row-index='0'],
        [data-active-row='1'] .composition-row[data-row-index='0'],
        [data-active-row='1'] .composition-row[data-row-index='1'],
        [data-active-row='2'] .composition-row[data-row-index='0'],
        [data-active-row='2'] .composition-row[data-row-index='1'],
        [data-active-row='2'] .composition-row[data-row-index='2'],
        [data-active-row='3'] .composition-row[data-row-index='0'],
        [data-active-row='3'] .composition-row[data-row-index='1'],
        [data-active-row='3'] .composition-row[data-row-index='2'],
        [data-active-row='3'] .composition-row[data-row-index='3'] {
          opacity: 1 !important;
          border-color: rgba(239, 111, 121, 0.4) !important;
        }

        .composition-row {
          opacity: 0.28;
        }

        /* Staggered Intersection Observer Transitions */
        [data-rev] {
          opacity: 0;
          transform: translateY(0.4em);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transition-delay: var(--d, 0ms);
        }

        [data-rev].is-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Prefers Reduced Motion Fallbacks */
        @media (prefers-reduced-motion: reduce) {
          .stage-pinned {
            height: auto !important;
          }
          .stage-pinned > div {
            position: static !important;
            height: auto !important;
          }
          [data-rev] {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .composition-row {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

