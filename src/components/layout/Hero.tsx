import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-8 px-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-purple-950/30 border border-purple-900/50 rounded-full text-xs font-semibold text-purple-300 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Premium Fullstack Coworking Workspace Boilerplate</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
          Smart Space Booking <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-300">
            Made Simple & Professional
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
          An elegant, reactive booking application constructed with React, Tailwind CSS v4, shadcn, and Express node environment connected to PostgreSQL.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#spaces">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 border-0 px-6 cursor-pointer">
              Explore Workspaces <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </a>
          <a href="http://localhost:5000/api-docs" target="_blank" rel="noreferrer">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer">
              Interactive API Docs (Swagger)
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
