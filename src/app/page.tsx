import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-16 relative">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 -left-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute top-1/3 -right-10 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="space-y-6 text-center z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 drop-shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
          Convenient Scripts
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
          日常工作的好幫手。<br/>在這裡找到各種可以幫您節省時間的小工具！
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl z-10">
        <Link href="/md2pdf" className="block h-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-3xl">
          <div className="h-full flex flex-col p-8 rounded-3xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] backdrop-blur-2xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group-hover:bg-white dark:group-hover:bg-white/[0.06] group-hover:border-indigo-200 dark:group-hover:border-white/[0.15] group-hover:shadow-2xl dark:group-hover:shadow-[0_8px_32px_0_rgba(79,70,229,0.15)] group-hover:-translate-y-1 transition-all duration-700 ease-out-expo">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors mb-4 flex items-center gap-3">
              <span className="text-2xl opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform origin-bottom">📄</span> Markdown 轉 PDF
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light mb-8 flex-grow">
              上傳您的 .md 檔案或是使用所見即所得的畫布，一鍵轉換成排版乾淨、完美支援繁體中文的 PDF 格式。
            </p>
            <div className="w-full py-3 text-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
              開始轉換 →
            </div>
          </div>
        </Link>
        
        {/* 未來的工具卡片 */}
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50/50 dark:bg-white/[0.01] border border-dashed border-slate-300 dark:border-white/10 backdrop-blur-xl opacity-80 dark:opacity-60 cursor-not-allowed select-none hidden md:flex">
          <div className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-200 dark:border-white/5">
            <span className="text-slate-500 text-lg">✨</span>
          </div>
          <p className="text-slate-500 font-medium tracking-widest text-xs uppercase mb-2">Coming Soon</p>
          <p className="text-slate-500 dark:text-slate-600 font-light text-center text-sm">更多實用工具即將推出...</p>
        </div>
      </div>
    </div>
  );
}
