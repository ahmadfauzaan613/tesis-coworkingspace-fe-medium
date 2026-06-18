export function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© 2026 CoSpace Medium Coworking Hub. All rights reserved.</p>
        <div className="flex space-x-4">
          <span className="hover:text-slate-300 transition-colors">React 19</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors">Tailwind CSS v4</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors">Node & Express</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition-colors">PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
