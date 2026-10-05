import React from 'react';
import { Volume2, VolumeX, Sparkles, Award, BookOpen, PenTool, Edit3, BarChart3 } from 'lucide-react';
import { sound } from '../utils/audio';

export type ActiveTab = 'alphabet' | 'words' | 'notebook' | 'stickers' | 'progress';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalStars: number;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  studentName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  totalStars,
  soundEnabled,
  setSoundEnabled,
  studentName,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setSoundEnabled(next);
    sound.setVoiceEnabled(next);
    if (next) sound.playClick();
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('alphabet');
            sound.playClick();
          }}
          className="font-display font-bold text-xl sm:text-2xl tracking-tight text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
        >
          <span className="text-amber-500">✏️</span>
          <span>Letrinhas Cursivas</span>
        </a>
      </div>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => {
            setActiveTab('alphabet');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'alphabet'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Alfabeto</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('words');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'words'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Palavrinhas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('notebook');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'notebook'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Caderno Livre</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('stickers');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stickers'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Figurinhas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('progress');
            sound.playClick();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'progress'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Progresso</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Star Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs sm:text-sm font-bold font-mono tabular-nums">
          <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>{totalStars}</span>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
          aria-label={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Student name pill / greeting */}
        <div className="hidden lg:flex items-center text-xs font-semibold text-slate-600">
          <span>Olá, <strong className="text-slate-800">{studentName}</strong>!</span>
        </div>
      </div>
    </header>
  );
};
