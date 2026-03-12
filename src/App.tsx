/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, db, collection, query, where, orderBy, onSnapshot } from './firebase';
import { Camera, History as HistoryIcon, LogOut, Scan, User as UserIcon, Loader2, Apple, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Scanner from './components/Scanner';
import AnalysisResultView from './components/AnalysisResult';
import History from './components/History';
import { AnalysisResult } from './services/gemini';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-100"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Apple className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">FoodVision AI</h1>
          <p className="text-stone-500 mb-8">Scan packaged food to see what's really inside. Get instant health scores and AI insights.</p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Connecting...' : 'Continue with Google'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="w-6 h-6 text-emerald-600" />
          <span className="font-bold text-xl tracking-tight text-stone-900">FoodVision</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {currentAnalysis ? (
                <AnalysisResultView 
                  result={currentAnalysis} 
                  onReset={() => setCurrentAnalysis(null)} 
                />
              ) : (
                <Scanner 
                  onAnalysisStart={() => setIsAnalyzing(true)}
                  onAnalysisComplete={(result) => {
                    setCurrentAnalysis(result);
                    setIsAnalyzing(false);
                  }}
                  isAnalyzing={isAnalyzing}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <History onSelectScan={(scan) => {
                setCurrentAnalysis(scan.analysis);
                setActiveTab('scan');
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-8 py-4 flex justify-around items-center z-40">
        <button
          onClick={() => {
            setActiveTab('scan');
            setCurrentAnalysis(null);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'scan' ? 'text-emerald-600' : 'text-stone-400'}`}
        >
          <Scan className="w-6 h-6" />
          <span className="text-xs font-medium">Scan</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-stone-400'}`}
        >
          <HistoryIcon className="w-6 h-6" />
          <span className="text-xs font-medium">History</span>
        </button>
      </nav>

      {/* Global Analysis Loader */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">Analyzing Product</h3>
            <p className="text-stone-500 text-sm">Our AI is extracting ingredients and calculating health scores...</p>
          </div>
        </div>
      )}
    </div>
  );
}
