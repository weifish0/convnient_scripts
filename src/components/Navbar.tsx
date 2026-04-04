import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <nav className="border-b border-black/5 dark:border-white/10 w-full bg-white/70 dark:bg-black/20 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-500">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors drop-shadow-sm dark:drop-shadow-md">
            Convenient Scripts
          </Link>
          <div className="flex gap-4">
            <Link href="/md2pdf" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors drop-shadow-none dark:drop-shadow-sm font-medium tracking-wide">
              Markdown to PDF
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
