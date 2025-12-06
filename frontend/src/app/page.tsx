'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Upload, Search, FileText, Loader2, Sparkles, X, Brain, 
  ChevronRight, Zap, Cpu, ArrowUpRight, CheckCircle2, Layers 
} from 'lucide-react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types ---
interface Flashcard {
  question: string;
  answer: string;
}

interface ProcessedData {
  filename: string;
  summary: string;
  chunks: number;
  flashcards: Flashcard[];
  model_used: string;
}

// --- Spotlight Effect Component ---
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      className={`group relative border border-zinc-800 bg-zinc-900/50 overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99, 102, 241, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// --- Loading Steps Component ---
function LoadingState({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      <div className="space-y-2 text-center">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm ${i === steps.length - 1 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}
          >
            {i === steps.length - 1 ? step : <span className="flex items-center justify-center gap-2"><CheckCircle2 size={12} className="text-green-500"/> {step}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  
  // Fancy Loading State
  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);

  // --- Handlers ---
  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const simulateLoadingSteps = () => {
    setLoadingSteps(["Uploading Document..."]);
    setTimeout(() => setLoadingSteps(prev => [...prev, "Extracting Text..."]), 800);
    setTimeout(() => setLoadingSteps(prev => [...prev, "Vectorizing Content (RAG)..."]), 1800);
    setTimeout(() => setLoadingSteps(prev => [...prev, "Generating AI Summary..."]), 3000);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    simulateLoadingSteps();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);

    try {
      const res = await axios.post('http://127.0.0.1:8000/upload', formData);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check backend console.');
    } finally {
      setLoading(false);
      setLoadingSteps([]);
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/search', { query });
      setSearchResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">
      
      {/* 1. Technical Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[#020202] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-[-10%] m-auto h-[400px] w-[400px] rounded-full bg-indigo-500 opacity-10 blur-[120px]"></div>
      </div>

      <main className="flex-grow relative z-10 w-full max-w-6xl mx-auto pt-24 px-6 space-y-20">
        
        {/* Header Section */}
        <div className="text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs font-medium text-zinc-400 backdrop-blur-md shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>System Online</span>
              <span className="w-px h-3 bg-zinc-800 mx-1"></span>
              <span>Gemini 2.5 Active</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-b from-white via-white to-zinc-600 bg-clip-text text-transparent pb-2 leading-tight">
              Knowledge Hub
            </h1>

            <p className="text-zinc-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
              Your Second Brain. <span className="text-zinc-200 font-medium">Upload. Chat. Master.</span>
            </p>
          </motion.div>
        </div>

        {/* Dynamic Content Switcher */}
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              {/* Spotlight Upload Card */}
              <SpotlightCard className={isDragging ? 'ring-2 ring-indigo-500/50 bg-indigo-500/10' : ''}>
                <div 
                  className="p-12 space-y-8"
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                >
                  {loading ? (
                    <LoadingState steps={loadingSteps} />
                  ) : (
                    <>
                      {/* Drop Zone */}
                      <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative group cursor-pointer">
                          <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
                          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                            <Upload className="w-10 h-10 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-xl text-zinc-200">
                            {file ? file.name : "Drop your PDF here"}
                          </p>
                          <p className="text-sm text-zinc-500">PDF up to 10MB</p>
                        </div>
                      </div>

                      {/* Settings Bar */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-zinc-800">
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="w-full sm:w-[200px] bg-zinc-900 border-zinc-800 text-zinc-300 h-12 rounded-xl focus:ring-indigo-500/20">
                            <div className="flex items-center gap-2">
                              <Cpu size={14} className="text-indigo-400"/>
                              <SelectValue placeholder="Select Model" />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                            <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button 
                          onClick={handleUpload} 
                          disabled={!file} 
                          className="flex-1 h-12 rounded-xl bg-white text-black hover:bg-zinc-200 font-medium text-base transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                          <span className="flex items-center gap-2">Analyze Document <ArrowUpRight size={18} /></span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              {/* Dashboard Navbar */}
              <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-xl sticky top-4 z-50">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-semibold text-zinc-100">{data.filename}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Layers size={10} />
                      <span>{data.chunks} Chunks</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setData(null)} className="text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Main Content Tabs */}
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="w-full justify-start border-b border-zinc-800 bg-transparent p-0 mb-8 space-x-8">
                  {['Summary', 'Deep Search', 'Flashcards'].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab.toLowerCase().replace(' ', '')} 
                      className="px-0 pb-4 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-zinc-500 data-[state=active]:text-indigo-400 text-base font-medium transition-all"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* 1. Summary */}
                <TabsContent value="summary" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SpotlightCard className="bg-zinc-900/30">
                    <ScrollArea className="h-[600px] p-8 md:p-12">
                      <article className="prose prose-zinc prose-invert max-w-none prose-headings:text-indigo-100 prose-headings:font-bold prose-h1:text-3xl prose-p:text-lg prose-p:leading-8 prose-li:text-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.summary}</ReactMarkdown>
                      </article>
                    </ScrollArea>
                  </SpotlightCard>
                </TabsContent>

                {/* 2. Chat */}
                <TabsContent value="deepsearch" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative flex">
                      <Input 
                        placeholder="Ask a specific question..." 
                        className="h-16 pl-6 pr-32 text-lg bg-zinc-950 border-zinc-800 focus-visible:ring-0 rounded-xl" 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                      />
                      <div className="absolute right-2 top-2 bottom-2">
                        <Button onClick={handleSearch} disabled={searchLoading} className="h-full px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                          {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {searchResults.map((result, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700 transition-colors">
                          <CardContent className="p-6 text-base leading-relaxed text-zinc-300">
                            {result}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* 3. Flashcards */}
                <TabsContent value="flashcards" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.flashcards.map((card, idx) => (
                      <div key={idx} className="h-72 cursor-pointer perspective-1000 group" onClick={() => setFlippedCard(flippedCard === idx ? null : idx)}>
                        <motion.div className={`relative w-full h-full duration-500 preserve-3d transition-all ${flippedCard === idx ? 'rotate-y-180' : ''}`}>
                          {/* Front */}
                          <div className="absolute inset-0 backface-hidden">
                            <SpotlightCard className="h-full flex flex-col items-center justify-center p-8 text-center hover:border-indigo-500/50 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <Brain size={24} />
                              </div>
                              <h3 className="font-medium text-xl text-zinc-100 leading-snug">{card.question}</h3>
                              <span className="absolute bottom-6 text-xs font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">Tap to Flip</span>
                            </SpotlightCard>
                          </div>
                          {/* Back */}
                          <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-indigo-950/20 border-indigo-500/30">
                            <p className="text-indigo-100 text-lg leading-relaxed font-medium">{card.answer}</p>
                          </Card>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Massive Footer */}
      <footer className="w-full py-24 mt-32 border-t border-zinc-900 bg-[#020202]">
         <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-[12vw] md:text-[8rem] font-bold text-zinc-900 leading-none text-center select-none tracking-tighter opacity-50">
              KNOWLEDGE
            </h1>
            <div className="flex justify-between items-end mt-12 text-zinc-600 text-sm font-mono uppercase tracking-widest">
              <div>© 2025 AI RAG Engine</div>
              <div className="flex gap-8">
                <a href="#" className="hover:text-white transition-colors">GitHub</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
         </div>
      </footer>
    </div>
  );
}