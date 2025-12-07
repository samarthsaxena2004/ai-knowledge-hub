'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Upload, Search, FileText, Loader2, Sparkles, X, Brain, 
  ChevronRight, Zap, Cpu, Layers, CheckCircle2, XCircle, 
  BookOpen, MessageSquare, GraduationCap, ArrowRight, Lightbulb
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
  exitVariant?: 'mastered' | 'skipped'; 
}

interface ProcessedData {
  filename: string;
  summary: string;
  chunks: number;
  flashcards: Flashcard[];
  model_used: string;
}

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardExitVariants = {
  mastered: { opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.3 } },
  skipped: { opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.3 } },
};

// --- Helper Components ---

function LoadingState({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-12 min-h-[400px]">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl bg-indigo-500/20 animate-pulse"></div>
        <Loader2 className="h-16 w-16 animate-spin text-indigo-400 relative z-10" />
      </div>
      <div className="space-y-4 text-center max-w-md">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-sm tracking-wide font-mono ${i === steps.length - 1 ? 'text-indigo-300' : 'text-zinc-600'}`}
          >
            {i === steps.length - 1 ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"/> 
                {step}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><CheckCircle2 size={14} className="text-emerald-500/50"/> {step}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      rgba(79, 70, 229, 0.08),
      transparent 80%
    )
  `;

  return (
    <div 
      className={`group relative border border-zinc-800 bg-zinc-900/30 overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function FlashcardItem({ 
  card, 
  idx, 
  isFlipped, 
  onFlip, 
  onMastered 
}: { 
  card: Flashcard, 
  idx: number, 
  isFlipped: boolean, 
  onFlip: () => void, 
  onMastered: (idx: number, action: 'mastered' | 'skipped') => void 
}) {
  return (
    <motion.div 
      layout
      variants={cardExitVariants}
      exit={card.exitVariant}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-80 cursor-pointer perspective-1000 group relative"
    >
      <div 
        className={`relative w-full h-full duration-500 preserve-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={onFlip}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <SpotlightCard className="h-full flex flex-col items-center justify-center p-8 text-center hover:border-indigo-500/40 transition-colors shadow-2xl shadow-black/50">
            <Badge variant="secondary" className="mb-8 bg-zinc-800/50 text-zinc-500 border-0">Card {idx + 1}</Badge>
            <h3 className="font-medium text-xl text-zinc-200 leading-snug">{card.question}</h3>
            <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
              <span>Reveal Answer</span> <ArrowRight size={10} />
            </div>
          </SpotlightCard>
        </div>
        {/* Back */}
        <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-between p-8 text-center bg-indigo-950/10 border-indigo-500/20 backdrop-blur-md">
            <div className="flex-grow flex items-center justify-center overflow-y-auto w-full">
              <p className="text-indigo-100 text-lg leading-relaxed font-medium">{card.answer}</p>
            </div>
            <div className="flex gap-3 w-full mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-lg border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onMastered(idx, 'skipped'); 
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Skip
                </Button>
                <Button 
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border-0" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onMastered(idx, 'mastered'); 
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mastered
                </Button>
            </div>
        </Card>
      </div>
    </motion.div>
  );
}

// --- Main Page Component ---
export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // FIX: Default to 2.5 Flash which we know exists
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    e.stopPropagation();
    setIsDragging(true); 
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    e.stopPropagation();
    setIsDragging(false); 
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const simulateLoadingSteps = () => {
    setLoadingSteps(["Establishing Secure Uplink..."]);
    setTimeout(() => setLoadingSteps(prev => [...prev.slice(0, -1), "Parsing Semantic Structure..."]), 800);
    setTimeout(() => setLoadingSteps(prev => [...prev.slice(0, -1), "Generating Vector Embeddings..."]), 1800);
    setTimeout(() => setLoadingSteps(prev => [...prev.slice(0, -1), "Synthesizing Neural Graph..."]), 3000);
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
      setLoadingSteps(prev => [...prev.slice(0, -1), "System Ready."]);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check backend console.');
      setLoadingSteps(["Error detected."]);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingSteps([]);
      }, 500);
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setSearchLoading(true);
    setSearchResult(null);
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/search', { query });
      
      let answerText = "";
      if (res.data.results && Array.isArray(res.data.results)) {
        answerText = res.data.results.join("\n\n");
      } else if (res.data.results && typeof res.data.results === 'string') {
        answerText = res.data.results;
      } else if (res.data.answer) {
        answerText = res.data.answer;
      } else {
        answerText = "No relevant information found.";
      }
      setSearchResult(answerText);
    } catch (err) {
      console.error(err);
      setSearchResult("Error occurred during search analysis.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMastered = (index: number, action: 'mastered' | 'skipped') => {
    if (!data) return;
    
    const updatedCards = data.flashcards.map((card, i) => 
        i === index ? { ...card, exitVariant: action } : card
    );
    setData(prev => prev ? { ...prev, flashcards: updatedCards } : null);

    setTimeout(() => {
        setData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                flashcards: prev.flashcards.filter((_, i) => i !== index)
            };
        });
    }, 300);
  };


  return (
    <div className="min-h-screen bg-[#030304] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">
      
      {/* 1. Cinematic Background */}
      <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      {/* 2. Floating Command Bar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6"
      >
        <div className="flex items-center gap-1 p-1.5 pl-4 pr-1.5 rounded-full border border-white/5 bg-zinc-900/80 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2.5 mr-4">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${data ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
              {data ? 'Connected' : 'System Online'}
            </span>
          </div>
          
          <div className="h-4 w-px bg-white/10 mx-1"></div>

          {/* Model Selector - UPDATED to use 2.5 Pro */}
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!!data}>
            <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0 text-xs font-medium text-zinc-300 gap-2 hover:bg-white/5 rounded-full transition-colors min-w-[140px]">
              <Cpu size={14} className="text-indigo-400" />
              <span>{selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}</span>
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A] border-zinc-800 text-zinc-300 w-[280px]">
              <SelectItem value="gemini-2.5-flash" className="py-3 cursor-pointer focus:bg-zinc-900 focus:text-indigo-300">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">Gemini 2.5 Flash</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-500/30 text-emerald-400">FAST</Badge>
                  </div>
                  <span className="text-xs text-zinc-500">Optimized for speed & summaries.</span>
                </div>
              </SelectItem>
              {/* Changed from 1.5-pro to 2.5-pro */}
              <SelectItem value="gemini-2.5-pro" className="py-3 cursor-pointer focus:bg-zinc-900 focus:text-indigo-300">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">Gemini 2.5 Pro</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-indigo-500/30 text-indigo-400">SMART</Badge>
                  </div>
                  <span className="text-xs text-zinc-500">High reasoning & complex analysis.</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {data && (
             <Button variant="ghost" size="icon" onClick={() => setData(null)} className="ml-2 h-8 w-8 rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors">
               <X size={14} />
             </Button>
          )}
        </div>
      </motion.nav>

      <main className="flex-grow relative z-10 w-full max-w-5xl mx-auto pt-32 pb-24 px-6 space-y-20">
        
        {/* Dynamic Header Section */}
        {!data && (
          <div className="text-center space-y-8 mt-8">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center gap-6">
              <motion.div variants={fadeInUp}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-400">
                  <Sparkles size={10} className="text-indigo-400" />
                  <span>Next-Gen RAG Engine</span>
                </div>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-bold tracking-tight text-white pb-2 leading-tight">
                Second <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Brain.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed">
                Upload documents to unlock semantic search, intelligent summaries, and active recall flashcards in seconds.
              </motion.p>
            </motion.div>
          </div>
        )}

        {/* Interaction Zone */}
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.5 }}
              className="space-y-16"
            >
              {/* The Reactor Upload Card */}
              <SpotlightCard className={`relative overflow-hidden transition-all duration-500 ${isDragging ? 'ring-1 ring-indigo-500 bg-indigo-500/5' : 'hover:bg-white/5'}`}>
                <CardContent className="p-0">
                  {loading ? (
                    <LoadingState steps={loadingSteps} />
                  ) : (
                    <div 
                      className="flex flex-col items-center justify-center py-24 px-8 relative z-10"
                      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                    >
                      {/* Hidden Input controlled via Ref */}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        ref={fileInputRef}
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)} 
                        className="hidden" 
                      />

                      <div className="relative group/icon mb-10 pointer-events-none">
                        <div className="absolute -inset-6 bg-indigo-500/20 rounded-full blur-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl group-hover/icon:scale-110 transition-transform duration-300">
                          <Upload className="w-10 h-10 text-zinc-400 group-hover/icon:text-indigo-400 transition-colors" />
                        </div>
                      </div>

                      <div className="text-center space-y-2 mb-10 pointer-events-none">
                        <h3 className="text-2xl font-medium text-white tracking-tight">
                          {file ? file.name : "Drop PDF to Analyze"}
                        </h3>
                        <p className="text-sm text-zinc-500 font-mono">
                          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "MAX 10MB • PDF ONLY"}
                        </p>
                      </div>

                      <div className="relative z-30 flex gap-4">
                        <Button 
                          onClick={triggerFileInput}
                          variant="outline"
                          className="rounded-full px-8 py-6 text-base border-white/10 hover:bg-white/5 text-zinc-300"
                        >
                          Browse Files
                        </Button>
                        <Button 
                          onClick={handleUpload} 
                          disabled={!file} 
                          className={`rounded-full px-10 py-6 text-base font-medium transition-all shadow-xl ${file ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white text-black hover:bg-zinc-200 opacity-50 cursor-not-allowed'}`}
                        >
                          <span className="flex items-center gap-2">
                            Initialize Analysis <ArrowRight size={16} className={file ? "animate-pulse" : ""} />
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </SpotlightCard>

              {/* Improved Feature Grid */}
              <motion.div 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[
                  { icon: BookOpen, title: "Deep Synthesis", desc: "Turn hundreds of pages into actionable insights." },
                  { icon: MessageSquare, title: "Neural Chat", desc: "Context-aware answers, not just keyword matching." },
                  { icon: Lightbulb, title: "Active Recall", desc: "AI-generated flashcards to enforce mastery." }
                ].map((feature, i) => (
                  <motion.div key={i} variants={fadeInUp}>
                    <div className="p-6 h-full rounded-2xl bg-zinc-900/20 border border-white/5 hover:bg-zinc-900/40 hover:border-white/10 transition-all group backdrop-blur-sm">
                      <feature.icon className="w-6 h-6 text-zinc-500 mb-4 group-hover:text-indigo-400 transition-colors" />
                      <h3 className="text-zinc-200 font-medium mb-2">{feature.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Dashboard Status Bar */}
              <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-[#0A0A0A] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText size={18} /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-zinc-200">{data.filename}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{data.chunks} Vectors</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/20">
                  <Zap size={10} /> Active Session
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="w-full justify-start border-b border-zinc-800 bg-transparent p-0 mb-8 space-x-6">
                  {['Summary', 'Deep Search', 'Flashcards'].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab.toLowerCase().replace(' ', '')} 
                      className="px-0 pb-4 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-zinc-500 data-[state=active]:text-indigo-400 text-sm font-medium tracking-wide transition-all"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* 1. Summary */}
                <TabsContent value="summary" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SpotlightCard className="bg-[#0A0A0A]">
                    <ScrollArea className="h-[600px] p-8 md:p-12">
                      <article className="prose prose-invert prose-zinc max-w-none prose-headings:font-semibold prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-p:leading-8 prose-li:text-zinc-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.summary}</ReactMarkdown>
                      </article>
                    </ScrollArea>
                  </SpotlightCard>
                </TabsContent>

                {/* 2. Chat */}
                <TabsContent value="deepsearch" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative group">
                    <Input 
                      placeholder="Ask a specific question about this document..." 
                      className="h-14 px-6 text-base bg-[#0A0A0A] border-white/10 focus-visible:ring-indigo-500/20 rounded-xl" 
                      value={query} 
                      onChange={(e) => setQuery(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                    />
                    <div className="absolute right-2 top-2 bottom-2">
                      <Button onClick={handleSearch} disabled={searchLoading} className="h-full px-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
                        {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                  >
                    {searchResult && (
                      <SpotlightCard className="bg-[#0A0A0A]">
                        <CardContent className="p-8 text-base leading-relaxed text-zinc-300">
                          {/* Wrapper div to apply className */}
                          <div className="prose prose-invert prose-zinc max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {searchResult}
                            </ReactMarkdown>
                          </div>
                        </CardContent>
                      </SpotlightCard>
                    )}
                  </motion.div>
                </TabsContent>

                {/* 3. Flashcards */}
                <TabsContent value="flashcards" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.flashcards.length === 0 && (
                        <motion.div 
                            key="complete"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="md:col-span-2 text-center py-16 bg-emerald-900/5 border border-emerald-500/10 rounded-2xl"
                        >
                            <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500" />
                            <h3 className="text-xl font-medium text-emerald-400">Knowledge Mastered</h3>
                            <p className="text-sm text-emerald-500/60 mt-2">You've completed all cards in this set.</p>
                        </motion.div>
                    )}
                    <AnimatePresence>
                      {data.flashcards.map((card, idx) => (
                        <FlashcardItem 
                          key={idx} 
                          card={card} 
                          idx={idx} 
                          isFlipped={flippedCard === idx} 
                          onFlip={() => setFlippedCard(flippedCard === idx ? null : idx)}
                          onMastered={handleMastered}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Glowing Nexus Footer */}
      <footer className="w-full py-20 mt-32 border-t border-white/5 bg-[#020202]">
         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-end gap-12">
            
            <div className="relative group cursor-default">
              <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl opacity-20 group-hover:opacity-50 transition-opacity duration-700"></div>
              <h1 className="relative text-[15vw] md:text-[6rem] font-bold text-zinc-900 leading-none tracking-tighter select-none transition-all duration-700 group-hover:text-zinc-100 group-hover:drop-shadow-[0_0_40px_rgba(79,70,229,0.5)]">
                NEXUS
              </h1>
            </div>

            <div className="flex flex-col items-end gap-6 text-right">
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>System Operational</span>
              </div>
              <p className="text-zinc-600 text-sm">© 2025 AI RAG Engine. <br/>Architected for High-Fidelity Learning.</p>
              <div className="flex gap-6 mt-2">
                <a href="#" className="text-zinc-600 hover:text-white transition-colors text-sm">GitHub</a>
                <a href="#" className="text-zinc-600 hover:text-white transition-colors text-sm">Twitter</a>
              </div>
            </div>
         </div>
      </footer>
    </div>
  );
}