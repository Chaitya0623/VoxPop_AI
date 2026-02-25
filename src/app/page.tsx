'use client';

import Link from 'next/link';
import {
  Brain,
  Upload,
  Layers,
  BarChart3,
  ArrowRight,
  Sparkles,
  Users,
  Cpu,
} from 'lucide-react';

const STEPS = [
  { icon: Upload, title: 'Upload Dataset', description: 'Upload a CSV/JSON dataset for analysis' },
  { icon: Brain, title: 'AI Analysis', description: 'LLM agents detect task type, risk, and tradeoffs' },
  { icon: Layers, title: 'Scenarios & Vote', description: 'Explore 3 optimization philosophies and cast your vote' },
  { icon: BarChart3, title: 'Dashboard', description: 'See community alignment and preference drift' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Community-Driven ML Alignment
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4 animate-fade-in">
            VoxPop{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              AI
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 animate-fade-in leading-relaxed">
            Collective Intelligence for Machine Learning.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all"
            >
              Run Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-md mx-auto animate-fade-in">
            {[
              { icon: Cpu, label: 'AutoML Engine', value: 'Simulated' },
              { icon: Users, label: 'Community Votes', value: 'Aggregated' },
              { icon: Brain, label: 'AI Agents', value: 'GPT-Powered' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center p-4 rounded-xl border border-border bg-card animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
        VoxPop AI — Community-Driven ML Alignment · Built with Next.js, OpenAI, Tailwind CSS, Zustand, Recharts
      </footer>
    </div>
  );
}
