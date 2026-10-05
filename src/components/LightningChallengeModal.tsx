import React from 'react';
import { sound } from '../utils/audio';
import { Zap, Timer, Award, RotateCcw, ArrowRight, X, Sparkles, Flame } from 'lucide-react';

interface LightningChallengeModalProps {
  status: 'success' | 'timeup' | null;
  level: number;
  streak: number;
  timeSpent: number;
  totalTime: number;
  accuracy: number;
  letterChar: string;
  onRetry: () => void;
  onNextLetter: () => void;
  onClose: () => void;
}

export const LightningChallengeModal: React.FC<LightningChallengeModalProps> = ({
  status,
  level,
  streak,
  timeSpent,
  totalTime,
  accuracy,
  letterChar,
  onRetry,
  onNextLetter,
  onClose,
}) => {
  if (!status) return null;

  const isWin = status === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-amber-300 text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Icon */}
        <div className="flex justify-center mb-3">
          {isWin ? (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl shadow-lg border-2 border-amber-300 animate-bounce">
              ⚡
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl shadow-inner border border-slate-200">
              ⏳
            </div>
          )}
        </div>

        {/* Title */}
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">
          {isWin ? 'Desafio Superado!' : 'Tempo Esgotado!'}
        </span>
        <h2 className="font-display font-black text-2xl text-slate-900 mb-2">
          {isWin
            ? `Letra ${letterChar} na Velocidade da Luz!`
            : 'Quase lá! O relógio correu rápido!'}
        </h2>

        <p className="text-xs text-slate-600 mb-5">
          {isWin
            ? `Você completou o traçado em tempo recorde mantendo a caligrafia na pauta!`
            : `Na caligrafia, a precisão vem com o treino. Respire fundo e tente mais uma vez!`}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-medium">Tempo</span>
            <div className="flex items-center justify-center gap-1 mt-0.5 text-slate-900 font-bold text-sm font-mono tabular-nums">
              <Timer className="w-3.5 h-3.5 text-blue-500" />
              <span>{timeSpent.toFixed(1)}s</span>
            </div>
            <span className="text-[9px] text-slate-400">de {totalTime}s</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-medium">Precisão</span>
            <div className="flex items-center justify-center gap-1 mt-0.5 text-emerald-600 font-bold text-sm font-mono tabular-nums">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{accuracy}%</span>
            </div>
            <span className="text-[9px] text-slate-400">de acerto</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-medium">Sequência</span>
            <div className="flex items-center justify-center gap-1 mt-0.5 text-amber-600 font-bold text-sm font-mono tabular-nums">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>x{streak}</span>
            </div>
            <span className="text-[9px] text-slate-400">Nível {level}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onRetry();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>

          {isWin && (
            <button
              onClick={() => {
                sound.playCelebration();
                onNextLetter();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer transform hover:scale-102"
            >
              <span>Próxima Letra Relâmpago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
