/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { CursiveCanvas } from './components/CursiveCanvas';
import { AlphabetTrack } from './components/AlphabetTrack';
import { InfiniteRuledSlate } from './components/InfiniteRuledSlate';
import { WordPractice } from './components/WordPractice';
import { FreeNotebook } from './components/FreeNotebook';
import { StickerAlbum } from './components/StickerAlbum';
import { ProgressDashboard } from './components/ProgressDashboard';
import { CelebrationModal } from './components/CelebrationModal';
import { CURSIVE_LETTERS, INITIAL_STICKERS } from './data/cursiveAlphabet';
import { LetterData, StickerReward, DailyProgress } from './types/game';
import { sound } from './utils/audio';
import { Sparkles, HeartHandshake, User, Check, RefreshCw, BookOpen, Infinity as InfinityIcon } from 'lucide-react';

const DEFAULT_WEEKLY_PROGRESS: DailyProgress[] = [
  { dia: 'Seg', nomeCompleto: 'Segunda-feira', dataIso: '2026-09-29', letrasCompletadas: 4, precisaoMedia: 88, tentativas: 6, estrelas: 11 },
  { dia: 'Ter', nomeCompleto: 'Terça-feira', dataIso: '2026-09-30', letrasCompletadas: 6, precisaoMedia: 92, tentativas: 9, estrelas: 16 },
  { dia: 'Qua', nomeCompleto: 'Quarta-feira', dataIso: '2026-10-01', letrasCompletadas: 5, precisaoMedia: 86, tentativas: 7, estrelas: 13 },
  { dia: 'Qui', nomeCompleto: 'Quinta-feira', dataIso: '2026-10-02', letrasCompletadas: 7, precisaoMedia: 95, tentativas: 11, estrelas: 20 },
  { dia: 'Sex', nomeCompleto: 'Sexta-feira', dataIso: '2026-10-03', letrasCompletadas: 5, precisaoMedia: 90, tentativas: 8, estrelas: 14 },
  { dia: 'Sáb', nomeCompleto: 'Sábado', dataIso: '2026-10-04', letrasCompletadas: 3, precisaoMedia: 89, tentativas: 5, estrelas: 9 },
  { dia: 'Dom', nomeCompleto: 'Domingo', dataIso: '2026-10-05', letrasCompletadas: 2, precisaoMedia: 94, tentativas: 3, estrelas: 6 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('alphabet');
  const [alphabetMode, setAlphabetMode] = useState<'guided' | 'infinite'>('guided');
  const [selectedLetter, setSelectedLetter] = useState<LetterData>(CURSIVE_LETTERS[0]);
  const [studentName, setStudentName] = useState<string>('Amiguinho(a)');
  const [handPreference, setHandPreference] = useState<'right' | 'left'>('right');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Gamification & Progress State
  const [completedLetters, setCompletedLetters] = useState<Record<string, { stars: number; attempts: number; bestScore: number }>>({});
  const [completedWords, setCompletedWords] = useState<Record<string, { stars: number }>>({});
  const [stickers, setStickers] = useState<StickerReward[]>(INITIAL_STICKERS);
  const [totalStars, setTotalStars] = useState<number>(3); // starts with 3 welcoming stars
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgress[]>(DEFAULT_WEEKLY_PROGRESS);

  // Celebration Modal state
  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    charName: string;
    charDisplay: string;
    stars: number;
    accuracy: number;
    unlockedStickerTitle?: string;
    unlockedStickerEmoji?: string;
  }>({
    isOpen: false,
    charName: '',
    charDisplay: '',
    stars: 3,
    accuracy: 95,
  });

  // Load progress from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('letrinhas_progress_v1');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.completedLetters) setCompletedLetters(data.completedLetters);
        if (data.completedWords) setCompletedWords(data.completedWords);
        if (data.totalStars !== undefined) setTotalStars(data.totalStars);
        if (data.studentName) setStudentName(data.studentName);
        if (data.stickers) setStickers(data.stickers);
        if (data.handPreference) setHandPreference(data.handPreference);
        if (data.weeklyProgress) setWeeklyProgress(data.weeklyProgress);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save progress
  const saveProgress = (
    newLetters: typeof completedLetters,
    newWords: typeof completedWords,
    newStars: number,
    newStickers: typeof stickers,
    newWeekly: DailyProgress[] = weeklyProgress
  ) => {
    try {
      localStorage.setItem(
        'letrinhas_progress_v1',
        JSON.stringify({
          completedLetters: newLetters,
          completedWords: newWords,
          totalStars: newStars,
          stickers: newStickers,
          weeklyProgress: newWeekly,
          studentName,
          handPreference,
        })
      );
    } catch {
      // ignore
    }
  };

  // Called when child completes letter in CursiveCanvas
  const handleLetterComplete = (starsEarned: number, accuracy: number) => {
    const prevData = completedLetters[selectedLetter.char];
    const prevStars = prevData?.stars || 0;
    const additionalStars = Math.max(0, starsEarned - prevStars);
    const newTotalStars = totalStars + additionalStars;

    const updatedLetters = {
      ...completedLetters,
      [selectedLetter.char]: {
        stars: Math.max(prevStars, starsEarned),
        attempts: (prevData?.attempts || 0) + 1,
        bestScore: Math.max(prevData?.bestScore || 0, accuracy),
      },
    };
    setCompletedLetters(updatedLetters);
    setTotalStars(newTotalStars);

    // Update weekly chart metrics for current day (0=Seg, 6=Dom)
    const dayOfWeek = (new Date().getDay() + 6) % 7;
    const updatedWeekly = weeklyProgress.map((dayItem, idx) => {
      if (idx === dayOfWeek) {
        const prevDone = dayItem.letrasCompletadas;
        const prevAcc = dayItem.precisaoMedia;
        const newDone = prevDone + 1;
        const newAcc = prevDone === 0 ? accuracy : Math.round((prevAcc * prevDone + accuracy) / newDone);
        return {
          ...dayItem,
          letrasCompletadas: newDone,
          precisaoMedia: newAcc,
          tentativas: dayItem.tentativas + 1,
          estrelas: dayItem.estrelas + starsEarned,
        };
      }
      return dayItem;
    });
    setWeeklyProgress(updatedWeekly);

    // Check if a sticker unlocks
    let unlockedTitle: string | undefined;
    let unlockedEmoji: string | undefined;

    const updatedStickers = stickers.map((stk) => {
      if (stk.letter.toLowerCase() === selectedLetter.char.toLowerCase() && !stk.unlocked) {
        unlockedTitle = stk.title;
        unlockedEmoji = stk.emoji;
        return { ...stk, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      return stk;
    });

    setStickers(updatedStickers);
    saveProgress(updatedLetters, completedWords, newTotalStars, updatedStickers, updatedWeekly);

    setCelebrationModal({
      isOpen: true,
      charName: selectedLetter.name,
      charDisplay: selectedLetter.displayChar,
      stars: starsEarned,
      accuracy,
      unlockedStickerTitle: unlockedTitle,
      unlockedStickerEmoji: unlockedEmoji,
    });
  };

  // Called when child completes word
  const handleWordComplete = (wordId: string, starsEarned: number) => {
    const prev = completedWords[wordId]?.stars || 0;
    const additional = Math.max(0, starsEarned - prev);
    const newTotal = totalStars + additional;

    const updated = {
      ...completedWords,
      [wordId]: { stars: Math.max(prev, starsEarned) },
    };
    setCompletedWords(updated);
    setTotalStars(newTotal);

    // Unlock words sticker
    const updatedStickers = stickers.map((stk) => {
      if (stk.id === 'stk_palavras' && !stk.unlocked) {
        return { ...stk, unlocked: true };
      }
      return stk;
    });
    setStickers(updatedStickers);
    saveProgress(completedLetters, updated, newTotal, updatedStickers);
  };

  // Next letter navigation
  const handleNextLetter = () => {
    setCelebrationModal((prev) => ({ ...prev, isOpen: false }));
    const currentIdx = CURSIVE_LETTERS.findIndex((l) => l.char === selectedLetter.char);
    const nextIdx = (currentIdx + 1) % CURSIVE_LETTERS.length;
    setSelectedLetter(CURSIVE_LETTERS[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-amber-50/30 to-blue-50/40 text-slate-800 flex flex-col font-sans">
      {/* Top Bar following contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStars={totalStars}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        studentName={studentName}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        {/* Child personalization & Left/Right hand helper strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">⭐ 1º e 2º Ano</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium">Caderno de Caligrafia Interativo</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Hand preference switch */}
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <span>Mão:</span>
              <button
                onClick={() => {
                  setHandPreference('right');
                  sound.playClick();
                }}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  handPreference === 'right' ? 'bg-blue-100 text-blue-800' : 'hover:text-slate-800'
                }`}
              >
                Destro
              </button>
              <button
                onClick={() => {
                  setHandPreference('left');
                  sound.playClick();
                }}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  handPreference === 'left' ? 'bg-blue-100 text-blue-800' : 'hover:text-slate-800'
                }`}
              >
                Canhoto
              </button>
            </div>

            {/* Change Student Name input */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                maxLength={16}
                className="w-24 px-1.5 py-0.5 border border-slate-200 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Seu nome"
                title="Nome do Aluno para o Diploma"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Alphabet Track & Tracing Canvas OR Infinite Ruled Slate */}
        {activeTab === 'alphabet' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Mode Switcher inside Alphabet tab */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-xs px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs sm:text-sm text-slate-800">
                  Modo de Alfabetização:
                </span>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  {alphabetMode === 'guided'
                    ? 'Letras Guiadas com checkpoints, tutorial interativo e desafios'
                    : 'Pauta Infinita sem restrições ou pontuação'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    setAlphabetMode('guided');
                    sound.playClick();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    alphabetMode === 'guided'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Letras Guiadas</span>
                </button>

                <button
                  onClick={() => {
                    setAlphabetMode('infinite');
                    sound.playCelebration();
                    sound.speak('Modo Pauta Infinita! Pratique livremente o traçado sobre a pauta escolar!');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    alphabetMode === 'infinite'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" />
                  <span>Pauta Infinita ♾️</span>
                </button>
              </div>
            </div>

            {/* Guided Mode */}
            {alphabetMode === 'guided' && (
              <>
                {/* The interactive cursive drawing canvas */}
                <CursiveCanvas
                  letter={selectedLetter}
                  onComplete={handleLetterComplete}
                  handPreference={handPreference}
                  onNextLetter={handleNextLetter}
                />

                {/* Letter Selection Grid */}
                <AlphabetTrack
                  selectedLetter={selectedLetter}
                  onSelectLetter={setSelectedLetter}
                  completedLetters={completedLetters}
                />
              </>
            )}

            {/* Infinite Ruled Slate Mode */}
            {alphabetMode === 'infinite' && (
              <InfiniteRuledSlate
                handPreference={handPreference}
                studentName={studentName}
              />
            )}
          </div>
        )}

        {/* Tab 2: Word Linking Practice */}
        {activeTab === 'words' && (
          <div className="animate-in fade-in duration-200">
            <WordPractice
              onCompleteWord={handleWordComplete}
              completedWords={completedWords}
            />
          </div>
        )}

        {/* Tab 3: Free Lined Notebook */}
        {activeTab === 'notebook' && (
          <div className="animate-in fade-in duration-200">
            <FreeNotebook />
          </div>
        )}

        {/* Tab 4: Sticker Album & Diploma */}
        {activeTab === 'stickers' && (
          <div className="animate-in fade-in duration-200">
            <StickerAlbum
              stickers={stickers}
              totalStars={totalStars}
              studentName={studentName}
            />
          </div>
        )}

        {/* Tab 5: Weekly Progress & Accuracy Dashboard */}
        {activeTab === 'progress' && (
          <div className="animate-in fade-in duration-200">
            <ProgressDashboard
              weeklyData={weeklyProgress}
              completedLetters={completedLetters}
              studentName={studentName}
              totalStars={totalStars}
            />
          </div>
        )}
      </main>

      {/* Immediate Positive Feedback Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationModal.isOpen}
        charName={celebrationModal.charName}
        charDisplay={celebrationModal.charDisplay}
        stars={celebrationModal.stars}
        accuracy={celebrationModal.accuracy}
        unlockedStickerTitle={celebrationModal.unlockedStickerTitle}
        unlockedStickerEmoji={celebrationModal.unlockedStickerEmoji}
        onRetry={() => {
          setCelebrationModal((prev) => ({ ...prev, isOpen: false }));
        }}
        onNext={handleNextLetter}
        onClose={() => {
          setCelebrationModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
