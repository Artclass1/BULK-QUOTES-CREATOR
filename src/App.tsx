import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Download, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Layout, 
  RefreshCw, 
  Plus, 
  Trash2,
  Settings,
  Sparkles,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---

type FontOption = 'inter' | 'playfair' | 'cormorant' | 'montserrat' | 'space';
type ThemeOption = 'dark' | 'light' | 'nature' | 'abstract' | 'minimal' | 'luxury';
type Alignment = 'left' | 'center' | 'right';

interface Quote {
  id: string;
  text: string;
  author: string;
}

type AspectRatio = '1/1' | '3/4' | '9/16';

interface StyleConfig {
  font: FontOption;
  theme: ThemeOption;
  alignment: Alignment;
  fontSize: number;
  opacity: number;
  showAuthor: boolean;
  aspectRatio: AspectRatio;
}

// --- Constants ---

const INITIAL_QUOTES: Quote[] = [
  { id: '1', text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { id: '2', text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs" },
  { id: '3', text: "Less is more.", author: "Mies van der Rohe" },
];

const ASPECT_RATIOS: Record<AspectRatio, string> = {
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  '9/16': 'aspect-[9/16]',
};

const FONTS: Record<FontOption, string> = {
  inter: 'font-sans',
  playfair: 'font-serif',
  cormorant: 'font-luxury',
  montserrat: 'font-modern',
  space: 'font-display',
};

const THEMES: Record<ThemeOption, { bg: string; text: string; overlay: string }> = {
  dark: { bg: 'bg-zinc-900', text: 'text-white', overlay: 'bg-black/0' },
  light: { bg: 'bg-zinc-50', text: 'text-zinc-900', overlay: 'bg-white/0' },
  nature: { bg: 'bg-emerald-900', text: 'text-white', overlay: 'bg-black/40' },
  abstract: { bg: 'bg-indigo-900', text: 'text-white', overlay: 'bg-black/30' },
  minimal: { bg: 'bg-stone-200', text: 'text-stone-800', overlay: 'bg-white/50' },
  luxury: { bg: 'bg-black', text: 'text-amber-50', overlay: 'bg-black/60' },
};

// --- Components ---

const QuoteCard = ({ 
  quote, 
  style, 
  bgImage,
  forwardedRef 
}: { 
  quote: Quote; 
  style: StyleConfig; 
  bgImage?: string;
  forwardedRef?: React.Ref<HTMLDivElement>;
}) => {
  const theme = THEMES[style.theme];
  const fontClass = FONTS[style.font];
  const aspectClass = ASPECT_RATIOS[style.aspectRatio];
  
  return (
    <div 
      ref={forwardedRef}
      className={`relative ${aspectClass} w-full overflow-hidden flex flex-col justify-center p-8 transition-all duration-300 ${theme.bg}`}
      style={{
        textAlign: style.alignment,
      }}
    >
      {/* Background Image Layer */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={bgImage} 
            alt="background" 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div className={`absolute inset-0 ${theme.overlay}`} />
        </div>
      )}

      {/* Content Layer */}
      <div className={`relative z-10 flex flex-col gap-6 ${theme.text} ${fontClass}`}>
        <p 
          className="leading-tight font-medium"
          style={{ fontSize: `${style.fontSize}px` }}
        >
          {quote.text}
        </p>
        {style.showAuthor && quote.author && (
          <p className="text-sm opacity-70 uppercase tracking-widest font-sans mt-2">
            — {quote.author}
          </p>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [style, setStyle] = useState<StyleConfig>({
    font: 'playfair',
    theme: 'luxury',
    alignment: 'center',
    fontSize: 32,
    opacity: 0.6,
    showAuthor: true,
    aspectRatio: '3/4',
  });
  const [bgImages, setBgImages] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Refs for capturing images
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Generate random background images on mount or theme change
  useEffect(() => {
    const newBgImages: Record<string, string> = {};
    quotes.forEach(quote => {
      if (!bgImages[quote.id]) {
        // Use different seeds based on theme to get relevant images
        const seed = `${style.theme}-${quote.id}-${Math.random()}`;
        // Using picsum for demo, in real app might use Unsplash API
        // Adding a timestamp to prevent caching issues
        // Requesting larger images for 4K quality
        newBgImages[quote.id] = `https://picsum.photos/seed/${seed}/2160/3840`;
      } else {
        newBgImages[quote.id] = bgImages[quote.id];
      }
    });
    setBgImages(newBgImages);
  }, [quotes.length, style.theme]);

  const handleAddQuote = () => {
    const newId = Date.now().toString();
    setQuotes([...quotes, { id: newId, text: "New quote text", author: "Author Name" }]);
  };

  const handleRemoveQuote = (id: string) => {
    setQuotes(quotes.filter(q => q.id !== id));
  };

  const handleUpdateQuote = (id: string, field: 'text' | 'author', value: string) => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    const folder = zip.folder("lumina-quotes");

    try {
      const promises = quotes.map(async (quote) => {
        const element = cardRefs.current[quote.id];
        if (element) {
          // Calculate dimensions for 4K quality based on aspect ratio
          // We use a high pixelRatio to ensure 4K quality (approx 2160px width)
          const targetWidth = 2160;
          const pixelRatio = targetWidth / element.offsetWidth;
          
          const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio: Math.max(pixelRatio, 2), // Ensure at least 2x
            quality: 1.0,
            fetchRequestInit: {
              mode: 'cors',
              cache: 'no-cache',
            },
            filter: (node) => {
              // Exclude external stylesheets that might cause CORS issues
              if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
                return false;
              }
              return true;
            }
          });
          // Remove data:image/png;base64, prefix
          const base64Data = dataUrl.split(',')[1];
          folder?.file(`quote-${quote.id}.png`, base64Data, { base64: true });
        }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "lumina-quotes.zip");
    } catch (err) {
      console.error("Failed to generate images", err);
      alert("Failed to generate some images. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      alert("Gemini API Key is missing.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Generate 5 short, inspiring quotes about creativity, minimalism, and design. 
      Format the output as a JSON array of objects with 'text' and 'author' fields. 
      Do not include markdown code blocks.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text || '';
      
      // Clean up potential markdown
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const newQuotesData = JSON.parse(jsonStr);
      
      const newQuotes = newQuotesData.map((q: any) => ({
        id: Date.now().toString() + Math.random().toString(),
        text: q.text,
        author: q.author
      }));
      
      setQuotes([...quotes, ...newQuotes]);
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert("Failed to generate quotes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const handleBulkImport = () => {
    const lines = bulkText.split('\n').filter(line => line.trim());
    const newQuotes = lines.map(line => {
      // Try to split by " - " or " — " for author
      const parts = line.split(/ [-—] /);
      const text = parts[0].trim();
      const author = parts.length > 1 ? parts[1].trim() : '';
      return {
        id: Date.now().toString() + Math.random().toString(),
        text,
        author
      };
    });
    setQuotes([...quotes, ...newQuotes]);
    setShowBulkImport(false);
    setBulkText('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white flex flex-col md:flex-row font-sans relative">
      
      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Bulk Import Quotes</h3>
              <button onClick={() => setShowBulkImport(false)} className="text-zinc-500 hover:text-white">
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <p className="text-sm text-zinc-400">
              Paste your quotes below (one per line). Optionally separate author with " - " or " — ".
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full h-64 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-white/20 resize-none"
              placeholder={`Life is what happens when you're busy making other plans. - John Lennon\nThe way to get started is to quit talking and begin doing. - Walt Disney`}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowBulkImport(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkImport}
                className="flex-1 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
              >
                Import {bulkText.split('\n').filter(l => l.trim()).length} Quotes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR - CONTROLS */}
      <div className="w-full md:w-96 bg-[#18181b] border-r border-white/10 flex flex-col h-screen sticky top-0 overflow-y-auto z-20">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-serif italic font-bold tracking-tight text-white mb-1">Lumina</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest">Quote Generator</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          
          {/* Style Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
              <Layout className="w-4 h-4" /> Size
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['1/1', '3/4', '9/16'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setStyle({ ...style, aspectRatio: ratio })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${style.aspectRatio === ratio 
                      ? 'bg-white text-black shadow-lg' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  {ratio.replace('/', ':')}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
              <Palette className="w-4 h-4" /> Theme
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(THEMES) as ThemeOption[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setStyle({ ...style, theme: t })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all
                    ${style.theme === t 
                      ? 'bg-white text-black shadow-lg' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const newBgImages: Record<string, string> = {};
                quotes.forEach(quote => {
                  const seed = `${style.theme}-${quote.id}-${Math.random()}`;
                  newBgImages[quote.id] = `https://picsum.photos/seed/${seed}/2160/3840`;
                });
                setBgImages(newBgImages);
              }}
              className="w-full mt-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Shuffle Backgrounds
            </button>
          </div>

          {/* Typography Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 uppercase tracking-wider">
              <Type className="w-4 h-4" /> Typography
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FONTS) as FontOption[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStyle({ ...style, font: f })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all
                    ${style.font === f 
                      ? 'bg-white text-black shadow-lg' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Size</span>
                <span>{style.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="16" 
                max="64" 
                value={style.fontSize} 
                onChange={(e) => setStyle({ ...style, fontSize: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
               <button
                  onClick={() => setStyle({ ...style, alignment: 'left' })}
                  className={`flex-1 py-2 rounded-lg flex justify-center transition-all
                    ${style.alignment === 'left' 
                      ? 'bg-zinc-700 text-white' 
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
               >
                 <AlignLeft className="w-4 h-4" />
               </button>
               <button
                  onClick={() => setStyle({ ...style, alignment: 'center' })}
                  className={`flex-1 py-2 rounded-lg flex justify-center transition-all
                    ${style.alignment === 'center' 
                      ? 'bg-zinc-700 text-white' 
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
               >
                 <AlignCenter className="w-4 h-4" />
               </button>
               <button
                  onClick={() => setStyle({ ...style, alignment: 'right' })}
                  className={`flex-1 py-2 rounded-lg flex justify-center transition-all
                    ${style.alignment === 'right' 
                      ? 'bg-zinc-700 text-white' 
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
               >
                 <AlignRight className="w-4 h-4" />
               </button>
            </div>
          </div>

          {/* Content Management */}
          <div className="space-y-4">
             <div className="flex items-center justify-between text-sm font-medium text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Content
              </div>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {quotes.map((quote) => (
                <div key={quote.id} className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 space-y-2 group">
                  <textarea
                    value={quote.text}
                    onChange={(e) => handleUpdateQuote(quote.id, 'text', e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
                    rows={2}
                    placeholder="Enter quote..."
                  />
                  <div className="flex items-center justify-between">
                    <input
                      value={quote.author}
                      onChange={(e) => handleUpdateQuote(quote.id, 'author', e.target.value)}
                      className="bg-transparent text-xs text-zinc-500 placeholder-zinc-700 focus:outline-none w-2/3"
                      placeholder="Author"
                    />
                    <button 
                      onClick={() => handleRemoveQuote(quote.id)}
                      className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddQuote}
                className="flex-1 py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Add One
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex-1 py-3 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Layout className="w-4 h-4" /> Bulk Add
              </button>
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-white/10 bg-[#18181b]">
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading ? 'Processing...' : 'Download All (.zip)'}
          </button>
        </div>
      </div>

      {/* RIGHT MAIN - PREVIEW GRID */}
      <div className="flex-1 bg-[#0f0f11] p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-medium text-white">Preview ({quotes.length})</h2>
            <div className="flex gap-2">
              {/* Optional top actions */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {quotes.map((quote) => (
              <div key={quote.id} className="group relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900">
                  <QuoteCard
                    quote={quote}
                    style={style}
                    bgImage={bgImages[quote.id]}
                    forwardedRef={(el) => (cardRefs.current[quote.id] = el)}
                  />
                </div>
                
                {/* Hover Overlay for individual actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-2xl pointer-events-none group-hover:pointer-events-auto">
                  <button 
                    onClick={() => {
                        const seed = `${style.theme}-${quote.id}-${Math.random()}`;
                        setBgImages(prev => ({
                            ...prev,
                            [quote.id]: `https://picsum.photos/seed/${seed}/2160/3840`
                        }));
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
                    title="Shuffle Background"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={async () => {
                      const element = cardRefs.current[quote.id];
                      if (element) {
                        try {
                          // Target 1080px width for clipboard
                          const targetWidth = 1080;
                          const pixelRatio = targetWidth / element.offsetWidth;
                          
                          const blob = await toPng(element, { 
                            cacheBust: true, 
                            pixelRatio: Math.max(pixelRatio, 2), 
                            quality: 1.0,
                            fetchRequestInit: {
                              mode: 'cors',
                              cache: 'no-cache',
                            },
                            filter: (node) => {
                              if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
                                return false;
                              }
                              return true;
                            }
                          });
                          // toPng returns a data URL, we need a blob for clipboard
                          const res = await fetch(blob);
                          const blobData = await res.blob();
                          await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blobData })
                          ]);
                          alert('Copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy', err);
                        }
                      }
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all"
                    title="Copy Image"
                  >
                    <Copy className="w-5 h-5" /> 
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {quotes.length === 0 && (
            <div className="h-96 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
              <p>No quotes added yet.</p>
              <button onClick={handleAddQuote} className="mt-4 text-white underline">Add one now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
