'use client';

import Link from 'next/link';
import {
  Brain,
  Database,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Scale,
  Eye,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Database,
    title: 'Explore Datasets',
    description: 'Browse real-world fairness datasets and see where AI models can go wrong.',
  },
  {
    icon: Eye,
    title: 'Uncover Bias',
    description: 'Automatically detect structural disparities hidden in your data before any model is trained.',
  },
  {
    icon: MessageSquare,
    title: 'Share Your Values',
    description: 'Answer contextual questions so the platform understands what fairness means to you.',
  },
  {
    icon: BarChart3,
    title: 'See the Impact',
    description: 'Get personalized model recommendations and compare your values with the community.',
  },
];

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    stat: 'Real Datasets',
    description: 'Canonical fairness benchmarks from COMPAS, Census & more',
  },
  {
    icon: Scale,
    stat: 'Your Voice Matters',
    description: 'Every survey response shapes the community recommendation',
  },
  {
    icon: Brain,
    stat: 'AI-Powered',
    description: 'Structural analysis, Monte Carlo simulations & GPT insights',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Fairness in AI starts with you
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            VoxPop{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              AI
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-4 animate-fade-in leading-relaxed max-w-2xl mx-auto">
            Understand how AI decisions impact different communities — and have your say in making them fairer.
          </p>

          <p className="text-base text-muted-foreground/70 mb-10 animate-fade-in max-w-xl mx-auto">
            Explore real datasets, uncover hidden biases, and contribute your values so that machine learning models reflect what people actually care about.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link
              href="/datasets"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all"
            >
              Explore Datasets
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border text-foreground font-semibold text-base hover:bg-secondary hover:border-primary/40 transition-all"
            >
              Take the Survey
            </Link>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-2xl mx-auto animate-fade-in">
            {HIGHLIGHTS.map((h) => (
              <div key={h.stat} className="text-center">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <h.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-bold mb-1">{h.stat}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{h.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Four steps from raw data to a community-informed, fair AI model.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="relative flex flex-col items-center text-center p-5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-1">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
        VoxPop AI — Making AI fairer, one voice at a time.
      </footer>
    </div>
  );
}
