import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, auth } from '../firebase';
import { AnalysisResult } from '../services/gemini';
import { Calendar, ChevronRight, Search, Apple, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ScanRecord {
  id: string;
  productName: string;
  timestamp: any;
  analysis: AnalysisResult;
}

interface HistoryProps {
  onSelectScan: (scan: ScanRecord) => void;
}

export default function History({ onSelectScan }: HistoryProps) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'scans'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScanRecord[];
      setScans(docs);
      setLoading(false);
    }, (error) => {
      console.error("History error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredScans = scans.filter(scan => 
    scan.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-stone-500 text-sm">Loading your scan history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-stone-900">Scan History</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {filteredScans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Apple className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-500">No scans found. Start scanning to see your history here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredScans.map((scan) => (
            <motion.button
              key={scan.id}
              whileHover={{ x: 4 }}
              onClick={() => onSelectScan(scan)}
              className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4 text-left group transition-all hover:border-emerald-200"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                scan.analysis.healthScore >= 7.5 ? 'bg-emerald-100 text-emerald-600' :
                scan.analysis.healthScore >= 4.5 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
              }`}>
                <span className="font-bold">{scan.analysis.healthScore}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 truncate">{scan.productName}</h3>
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleDateString() : 'Just now'}
                  <span className="w-1 h-1 bg-stone-300 rounded-full" />
                  {scan.analysis.classification}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 transition-colors" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
