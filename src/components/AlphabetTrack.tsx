import React, { useState } from 'react';
import { LetterData, LetterCase } from '../types/game';
import { CURSIVE_LETTERS } from '../data/cursiveAlphabet';
import { sound } from '../utils/audio';
import { Star, Sparkles } from 'lucide-react';

interface AlphabetTrackProps {
  selectedLetter: LetterData;
  onSelectLetter: (letter: LetterData) => void;
  completedLetters: Record<string, { stars: number; attempts: number; bestScore: number }>;
}

export const AlphabetTrack: React.FC<AlphabetTrackProps> = ({
  selectedLetter,
  onSelectLetter,
  completedLetters,
}) => {
  const [filterCase, setFilterCase] = useState<LetterCase>('lowercase');
  const [filterCategory, setFilterCategory] = useState<'all' | 'vogal' | 'consoante'>('all');

  const filteredLetters = CURSIVE_LETTERS.filter((l) => {
    if (l.caseType !== filterCase) return false;
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200">
      {/* Filter / Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Case selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setFilterCase('lowercase');
              sound.playClick();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterCase === 'lowercase'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Minúsculas (a, b, c)
          </button>
          <button
            onClick={() => {
              setFilterCase('uppercase');
              sound.playClick();
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterCase === 'uppercase'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Maiúsculas (A, B, C)
          </button>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setFilterCategory('all');
              sound.playClick();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => {
              setFilterCategory('vogal');
              sound.playClick();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'vogal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vogais
          </button>
          <button
            onClick={() => {
              setFilterCategory('consoante');
              sound.playClick();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterCategory === 'consoante'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consoantes
          </button>
        </div>
      </div>

      {/* Letters Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
        {filteredLetters.map((l) => {
          const isSelected = selectedLetter.char === l.char;
          const progress = completedLetters[l.char];
          const stars = progress?.stars || 0;

          return (
            <button
              key={l.char}
              onClick={() => {
                onSelectLetter(l);
                sound.playClick();
              }}
              className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/80 shadow-md scale-105 ring-2 ring-blue-400/30'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/70'
              }`}
            >
              {/* Star Badge */}
              <div className="flex items-center gap-0.5 h-3.5 mb-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= stars
                        ? 'fill-amber-400 text-amber-500'
                        : 'fill-slate-200 text-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Big Cursive Character */}
              <span className="font-display font-bold text-3xl text-slate-800 my-0.5">
                {l.displayChar}
              </span>

              {/* Tiny Word Indicator */}
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 truncate max-w-full">
                <span>{l.exampleIcon}</span>
                <span className="truncate">{l.exampleWord}</span>
              </div>

              {/* Completed check dot */}
              {stars === 3 && (
                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                  <Sparkles className="w-3 h-3 fill-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
