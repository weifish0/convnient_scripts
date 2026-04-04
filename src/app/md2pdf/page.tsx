"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface UploadedImage {
  id: string;
  name: string;
  src: string;
}

export default function MarkdownToPdfPage() {
  const [markdown, setMarkdown] = useState<string>("# 歡迎使用\n從這裡開始輸入您的 Markdown...\n- 支援繁體中文\n- [x] 快速轉換\n- 簡單易用\n\n您也可以直接上傳 `.md` 檔案來轉換。");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [marginTop, setMarginTop] = useState<number>(15);
  const [marginBottom, setMarginBottom] = useState<number>(15);
  const [showPageNumbers, setShowPageNumbers] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  const getProcessedMarkdown = () => {
    if (images.length === 0) return markdown;
    
    return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const fileName = url.split('/').pop() || url;
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      
      const matchedImg = images.find(img => 
        img.name === url || 
        img.name === fileName || 
        img.name === baseName
      );
      
      if (matchedImg) {
        return `![${alt}](${matchedImg.src})`;
      }
      return match;
    });
  };

  useEffect(() => {
    const parseAndSanitize = async () => {
      const parsed = await marked.parse(getProcessedMarkdown());
      setPreviewHtml(DOMPurify.sanitize(parsed, { ADD_ATTR: ['target'] }));
    };
    parseAndSanitize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown, images]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setMarkdown(text);
      toast.success("檔案上傳成功");
    };
    reader.onerror = () => {
      toast.error("檔案讀取失敗");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Image = ev.target?.result as string;
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name.split('.')[0] || "image",
          src: base64Image
        };
        setImages(prev => [...prev, newImage]);
        successCount++;
        if (successCount + failCount === files.length) {
          toast.success(`成功載入 ${successCount} 張圖片`);
        }
      };
      reader.onerror = () => {
        toast.error(`圖片 ${file.name} 讀取失敗`);
        failCount++;
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const updateImageName = (id: string, newName: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, name: newName } : img));
  };

  const handlePrint = async () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentWindow) return;
      
      const parsedMarkdown = await marked.parse(getProcessedMarkdown());
      const cleanHtml = DOMPurify.sanitize(parsedMarkdown, { ADD_ATTR: ['target'] });
      
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <title>&#8203;</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
            body {
              font-family: 'Noto Sans TC', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              padding: 0;
              margin: 0;
              color: #333;
            }
            .markdown-body { padding: 40px; }
            h1, h2, h3 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
            pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
            code { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
            blockquote { border-left: 4px solid #dfe2e5; padding: 0 1em; color: #6a737d; margin-left: 0; }
            table.md-table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            table.md-table th, table.md-table td { border: 1px solid #dfe2e5; padding: 6px 13px; }
            table.md-table th { font-weight: 600; background: #f6f8fa; }
            img { max-width: 100%; height: auto; }
            @media print {
              .markdown-body { padding: 0 15mm; }
              @page { 
                margin-top: 0; /* 隱藏最上方的時間與標題 */
                margin-bottom: ${showPageNumbers ? `${marginBottom}mm` : '0'}; /* 決定是否保留底部空間顯示瀏覽器頁數 */
                margin-left: 0;
                margin-right: 0;
              }
            }
          </style>
        </head>
        <body>
          <table style="width: 100%; border: none; border-collapse: collapse;">
            <thead style="display: table-header-group; border: none;">
              <tr><th style="height: ${marginTop}mm; padding: 0; border: none;"></th></tr>
            </thead>
            <tbody style="border: none;">
              <tr><td style="padding: 0; border: none;">
                <div class="markdown-body">
                  ${cleanHtml.replace(/<table/g, '<table class="md-table"')}
                </div>
              </td></tr>
            </tbody>
            ${!showPageNumbers ? `
            <tfoot style="display: table-footer-group; border: none;">
              <tr><td style="height: ${marginBottom}mm; padding: 0; border: none;"></td></tr>
            </tfoot>` : ''}
          </table>
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          // 嘗試清除 iframe 的 URL 記錄，使下方不再印出完整路徑
          iframeRef.current?.contentWindow?.history.replaceState(null, '', '\u200B');
        } catch (_e) {}
        iframeRef.current?.contentWindow?.focus();
        iframeRef.current?.contentWindow?.print();
      }, 500);

    } catch (error) {
      toast.error("轉換過程發生錯誤");
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative z-10">
      <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-200/40 dark:bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse pointer-events-none" />
      
      <div className="flex flex-col items-start gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full gap-6 relative">
          <div className="absolute right-0 top-0 z-50 pt-1" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-3 rounded-full bg-white hover:bg-slate-50 dark:bg-black/20 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all border border-slate-200 dark:border-white/10 shadow-sm"
              title="PDF 輸出設定"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  輸出排版設定
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <label className="text-slate-600 dark:text-slate-400 font-medium text-sm">上邊距 (mm)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={marginTop} 
                        onChange={(e) => setMarginTop(Number(e.target.value))} 
                        className="w-16 px-2 py-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all font-mono text-center text-sm" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <label className="text-slate-600 dark:text-slate-400 font-medium text-sm">下邊距 (mm)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={marginBottom} 
                        onChange={(e) => setMarginBottom(Number(e.target.value))} 
                        className="w-16 px-2 py-1 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all font-mono text-center text-sm" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">顯示頁碼</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">需瀏覽器配合勾選</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={showPageNumbers} 
                        onChange={(e) => setShowPageNumbers(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 w-full md:w-auto pr-16">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Markdown 轉 PDF</h1>
              <p className="text-slate-600 dark:text-slate-400 font-light tracking-wide max-w-xl leading-relaxed">
                貼上 Markdown 內容或上傳檔案，我們會幫您生成排版精美的 PDF 並完美支援繁體中文。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto h-auto">
            <label className="relative cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 text-sm font-medium py-3 px-5 rounded-xl transition-all duration-300 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] flex items-center gap-2">
              <span>🖼️ 多圖擷取</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleImageUpload}
                title="上傳圖片到暫存區"
              />
            </label>
            <label className="relative cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-300 text-sm font-medium py-3 px-5 rounded-xl transition-all duration-300 hover:shadow-sm dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <span>📄 載入 .md</span>
              <input 
                type="file" 
                accept=".md,.txt" 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleFileUpload}
                title="上傳 Markdown 檔案"
              />
            </label>
            <button 
              onClick={handlePrint} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent dark:border-indigo-500/50 dark:hover:border-indigo-400 text-sm font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md dark:shadow-[0_0_20px_rgba(79,70,229,0.3)] dark:hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2"
            >
              <span>🖨️</span> 匯出 PDF
            </button>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-5 backdrop-blur-xl shadow-sm dark:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-wider mb-4 flex items-center gap-2">
            <span>📸</span> 圖片暫存區 <span className="font-normal text-xs text-slate-500 dark:text-slate-400 ml-1">(名稱與 `![alt](檔名)` 一致將自動替換)</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x">
            {images.map(img => (
              <div key={img.id} className="snap-start min-w-[160px] w-[160px] flex flex-col gap-2 bg-slate-50 dark:bg-black/20 p-2.5 rounded-2xl border border-slate-200 dark:border-white/5 group relative transition-all hover:bg-slate-100 dark:hover:bg-white/[0.03]">
                <div className="h-24 w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-black/40 relative border border-slate-200 dark:border-white/5">
                  <img src={img.src} alt={img.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <button 
                    onClick={() => removeImage(img.id)} 
                    className="absolute top-1.5 right-1.5 bg-red-500/90 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-400 z-10" 
                    title="移除圖片"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={img.name}
                  onChange={(e) => updateImageName(img.id, e.target.value)}
                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/10 text-slate-800 dark:text-slate-300 text-xs px-1.5 py-1.5 focus:outline-none focus:border-indigo-400 focus:bg-white/50 dark:focus:bg-white/5 rounded transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="圖片名稱"
                  title="修改圖片名稱"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[60vh]">
        {/* Editor Area */}
        <div className="flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-2xl transition-all duration-500 hover:border-slate-300 dark:hover:border-white/20">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-300 tracking-wider">MARKDOWN 編輯器</span>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10" />
            </div>
          </div>
          <Textarea 
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 min-h-[500px] border-0 focus-visible:ring-0 rounded-none p-6 bg-transparent text-slate-800 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none font-mono leading-relaxed"
            placeholder="在此輸入您的 Markdown..."
            spellCheck={false}
          />
        </div>
        
        {/* Preview Area */}
        <div className="flex flex-col bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-sm dark:shadow-2xl transition-all duration-500 hover:border-slate-300 dark:hover:border-white/20 relative">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex items-center justify-between z-10 sticky top-0 backdrop-blur-md">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              即時預覽
            </span>
          </div>
          <div className="p-8 prose dark:prose-invert prose-slate prose-img:rounded-xl prose-a:text-indigo-600 dark:prose-a:text-indigo-400 max-w-none overflow-y-auto flex-1 h-[500px] lg:h-auto custom-scrollbar bg-transparent dark:bg-black/10">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      </div>

      <iframe 
        ref={iframeRef}
        className="hidden" 
        title="print-frame"
      />
    </div>
  );
}
