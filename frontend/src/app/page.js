'use client';
import { useState } from 'react';
import axios from 'axios';
import { Upload, Search, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Handle File Upload
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // We use /api/upload which Next.js forwards to port 8000
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Search
  const handleSearch = async () => {
    if (!query) return;
    setSearchLoading(true);
    try {
      const res = await axios.post('/api/search', { query });
      setSearchResults(res.data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-indigo-600 flex justify-center items-center gap-2">
            <FileText className="w-10 h-10" /> 
            AI Knowledge Hub
          </h1>
          <p className="text-gray-500">Upload PDFs, Get Summaries, Ask Questions.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden" 
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                <Upload size={32} />
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-700">
                  {file ? file.name : "Click to Upload PDF"}
                </p>
                <p className="text-sm text-gray-400">PDFs up to 10MB</p>
              </div>
            </label>
          </div>
          
          {file && (
            <button 
              onClick={handleUpload} 
              disabled={loading}
              className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Process Document'}
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
              <AlertCircle size={20} /> {error}
            </div>
          )}
        </div>

        {/* Summary Section */}
        {summary && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">📌 Document Summary</h2>
            <div className="prose prose-indigo max-w-none text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-100 whitespace-pre-line">
              {summary}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-500" /> 
            Semantic Search
          </h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Ask a question about your document..."
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          <div className="mt-6 space-y-4">
            {searchResults.map((result, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                {result}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}