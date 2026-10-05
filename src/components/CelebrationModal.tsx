import React, { useEffect } from 'react';
import { Sparkles, Star, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { sound } from '../utils/audio';

interface CelebrationModalProps {
  isOpen: boolean;
  charName: string;
  charDisplay: string;
  stars: number;
  accuracy: number;
  unlockedStickerTitle?: string;
  unlockedStickerEmoji?: string;
  onRetry: () => void;
  onNext: () => void;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  charName,
  charDisplay,
  stars,
  accuracy,
  unlockedStickerTitle,
  unlockedStickerEmoji,
  onRetry,
  onNext,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Play sequential star sound effects
      for (let i = 0; i < stars; i++) {
        setTimeout(() => {
          sound.playStar(i);
        }, 250 * (i + 1));
      }
    }
  }, [isOpen, stars]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center overflow-hidden">
        {/* Decorative background rays */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Mascot / Letter Badge */}
        <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-3xl rotate-6 flex items-center justify-center shadow-lg border-2 border-white">
            <span className="font-display font-black text-4xl text-amber-950 -rotate-6">
              {charDisplay}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Cheerful Title */}
        <h3 className="font-display font-bold text-2xl text-slate-900 mb-1">
          {stars === 3 ? '🎉 Incrível! Que Capricho!' : '👏 Muito Bem! Bom Trabalho!'}
        </h3>
        <p className="text-sm font-medium text-slate-600 mb-5">
          Você completou o traçado da {charName}!
        </p>

        {/* 3 Animated Stars */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[1, 2, 3].map((starNum) => {
            const isEarned = starNum <= stars;
            return (
              <div
                key={starNum}
                className={`transition-all duration-500 transform ${
                  isEarned ? 'scale-110 rotate-6' : 'scale-90 opacity-30 grayscale'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    isEarned
                      ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-white border-2 border-amber-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Star className={`w-8 h-8 ${isEarned ? 'fill-amber-100' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticker Unlocked Callout (if any) */}
        {unlockedStickerTitle && (
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-left">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-xs border border-emerald-100 shrink-0">
              {unlockedStickerEmoji || '🎁'}
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                <Award className="w-3.5 h-3.5" />
                <span>Nova Figurinha Desbloqueada!</span>
              </div>
              <p className="text-xs font-medium text-slate-700">{unlockedStickerTitle}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onRetry();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Treinar de Novo</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onNext();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <span>Próxima Letra</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
