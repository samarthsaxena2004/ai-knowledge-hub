'use client';

import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, Search, FileText, Loader2, Sparkles, X, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Flashcard {
  question: string;
  answer: string;
}

interface ProcessedData {
  filename: string;
  summary: string;
  chunks: number;
  flashcards: Flashcard[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use full URL to avoid proxy issues during debug
      const res = await axios.post('http://127.0.0.1:8000/upload', formData);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert('Upload failed. Check backend console.');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-zinc-800">
      <div className="max-w-5xl mx-auto pt-20 pb-12 px-6 text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400"
        >
          <Sparkles size={12} className="text-indigo-400" />
          <span>Gemini 2.5 Flash Engine</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          Knowledge <span className="text-zinc-600">Hub</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed"
        >
          Drop a PDF. We'll summarize it, let you chat with it, and generate study cards automatically.
        </motion.p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {!data && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-dashed border-2 border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4 w-full">
                  <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                    <Upload className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200 text-lg">{file ? file.name : "Click to upload PDF"}</p>
                    <p className="text-sm text-zinc-500 mt-1">Up to 10MB</p>
                  </div>
                </label>
                {file && (
                  <Button onClick={handleUpload} disabled={loading} size="lg">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Analyze Document'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="font-medium text-sm text-zinc-300">{data.filename}</span>
                <Badge variant="secondary" className="text-xs">{data.chunks} chunks</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setData(null)} className="h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="study">Flashcards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-6">
                <Card className="border-zinc-800 bg-zinc-900/30">
                  <ScrollArea className="h-[500px] p-6 pr-8">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.summary}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Ask a question..." className="bg-zinc-900 border-zinc-800" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  <Button onClick={handleSearch} disabled={searchLoading}>{searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button>
                </div>
                <div className="space-y-4">{searchResults.map((result, idx) => (
                  <Card key={idx} className="border-zinc-800 bg-zinc-900/30"><CardContent className="p-4 text-sm text-zinc-400 leading-relaxed">{result}</CardContent></Card>
                ))}</div>
              </TabsContent>

              <TabsContent value="study" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.flashcards.map((card, idx) => (
                    <div key={idx} className="h-60 cursor-pointer perspective-1000 group" onClick={() => setFlippedCard(flippedCard === idx ? null : idx)}>
                      <div className={`relative w-full h-full duration-500 preserve-3d transition-all ${flippedCard === idx ? 'rotate-y-180' : ''}`}>
                        <Card className="absolute inset-0 backface-hidden border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center p-6 text-center">
                          <Brain className="w-8 h-8 text-zinc-600 mb-4" />
                          <h3 className="font-medium text-zinc-200">{card.question}</h3>
                          <p className="absolute bottom-4 text-xs text-zinc-600">Click to flip</p>
                        </Card>
                        <Card className="absolute inset-0 backface-hidden rotate-y-180 border-indigo-500/30 bg-indigo-500/10 flex flex-col items-center justify-center p-6 text-center">
                          <Badge className="mb-4 bg-indigo-500/20 text-indigo-300 border-0">Answer</Badge>
                          <p className="text-zinc-200 text-sm">{card.answer}</p>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}