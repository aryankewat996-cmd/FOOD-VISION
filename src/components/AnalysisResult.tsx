import React from 'react';
import { AnalysisResult } from '../services/gemini';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Info, Leaf, FlaskConical, ShieldAlert, Droplets, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function AnalysisResultView({ result, onReset }: AnalysisResultViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 4.5) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const getTrafficLight = (level: "Low" | "Medium" | "High") => {
    switch (level) {
      case "Low": return "text-emerald-600 bg-emerald-100";
      case "Medium": return "text-amber-600 bg-amber-100";
      case "High": return "text-red-600 bg-red-100";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Natural": return <Leaf className="w-4 h-4 text-emerald-500" />;
      case "Artificial": return <FlaskConical className="w-4 h-4 text-purple-500" />;
      case "Preservative": return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case "Additive": return <Droplets className="w-4 h-4 text-blue-500" />;
      case "Allergen": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scanner
      </button>

      {/* Hero Score */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-[2rem] p-8 border-2 text-center ${getScoreColor(result.healthScore)}`}
      >
        <span className="text-xs font-bold uppercase tracking-widest mb-2 block opacity-70">Health Score</span>
        <div className="text-7xl font-black mb-2">{result.healthScore}<span className="text-2xl opacity-50">/10</span></div>
        <h2 className="text-2xl font-bold mb-4">{result.productName}</h2>
        <div className="flex justify-center gap-2">
          <span className="px-4 py-1.5 bg-white/50 rounded-full text-sm font-bold border border-current/10">
            {result.classification}
          </span>
          <span className="px-4 py-1.5 bg-white/50 rounded-full text-sm font-bold border border-current/10">
            {result.energyKcal} kcal
          </span>
        </div>
      </motion.div>

      {/* AI Explanation */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 mb-1">AI Verdict</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{result.explanation}</p>
          </div>
        </div>
      </div>

      {/* Nutrition Traffic Lights */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-4 rounded-2xl text-center ${getTrafficLight(result.sugar)}`}>
          <span className="text-[10px] font-bold uppercase block mb-1 opacity-70">Sugar</span>
          <span className="font-bold">{result.sugar}</span>
        </div>
        <div className={`p-4 rounded-2xl text-center ${getTrafficLight(result.fat)}`}>
          <span className="text-[10px] font-bold uppercase block mb-1 opacity-70">Fat</span>
          <span className="font-bold">{result.fat}</span>
        </div>
        <div className={`p-4 rounded-2xl text-center ${result.processedScore > 7 ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100'}`}>
          <span className="text-[10px] font-bold uppercase block mb-1 opacity-70">Processing</span>
          <span className="font-bold">{result.processedScore > 7 ? 'Ultra' : 'Low'}</span>
        </div>
      </div>

      {/* Composition Bars */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm space-y-6">
        <h3 className="font-bold text-stone-900">Ingredient Composition</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-stone-600">Natural Ingredients</span>
              <span className="font-bold text-emerald-600">{result.naturalPercentage}%</span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.naturalPercentage}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-stone-600">Artificial / Additives</span>
              <span className="font-bold text-purple-600">{result.artificialPercentage}%</span>
            </div>
            <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.artificialPercentage}%` }}
                className="h-full bg-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
        <h3 className="font-bold text-stone-900 mb-4">Ingredients Breakdown</h3>
        <div className="grid grid-cols-1 gap-2">
          {result.ingredients.map((ing, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <span className="text-sm font-medium text-stone-700">{ing.name}</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-stone-100 shadow-sm">
                {getCategoryIcon(ing.category)}
                <span className="text-[10px] font-bold uppercase text-stone-500">{ing.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternatives */}
      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
        <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Healthier Alternatives
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.alternatives.map((alt, idx) => (
            <span key={idx} className="px-4 py-2 bg-white rounded-xl text-sm font-medium text-emerald-700 border border-emerald-100 shadow-sm">
              {alt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
