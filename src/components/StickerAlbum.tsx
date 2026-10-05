import React, { useState } from 'react';
import { StickerReward } from '../types/game';
import { sound } from '../utils/audio';
import { Award, Lock, Sparkles, Printer, CheckCircle } from 'lucide-react';

interface StickerAlbumProps {
  stickers: StickerReward[];
  totalStars: number;
  studentName: string;
}

export const StickerAlbum: React.FC<StickerAlbumProps> = ({
  stickers,
  totalStars,
  studentName,
}) => {
  const [selectedSticker, setSelectedSticker] = useState<StickerReward | null>(null);
  const [showDiploma, setShowDiploma] = useState<boolean>(false);

  const unlockedCount = stickers.filter((s) => s.unlocked).length;

  const handlePrintDiploma = () => {
    sound.playCelebration();
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-6 h-6 text-amber-300" />
            <h2 className="font-display font-bold text-2xl">Álbum de Figurinhas & Conquistas</h2>
          </div>
          <p className="text-sm text-blue-100">
            Complete os traçados das letrinhas e palavras para colecionar todas as figurinhas!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/20 text-center">
            <span className="text-xs text-blue-200 block font-medium">Figurinhas</span>
            <span className="font-display font-bold text-xl font-mono tabular-nums">
              {unlockedCount} / {stickers.length}
            </span>
          </div>

          <button
            onClick={() => {
              setShowDiploma(true);
              sound.playCelebration();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>Ver Meu Diploma</span>
          </button>
        </div>
      </div>

      {/* Stickers Grid */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <span>Suas Figurinhas Especiais</span>
          <span className="text-xs text-slate-400 font-normal">
            (Toque em uma figurinha para ver os detalhes)
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {stickers.map((stk) => {
            return (
              <button
                key={stk.id}
                onClick={() => {
                  if (stk.unlocked) {
                    setSelectedSticker(stk);
                    sound.playStar(1);
                  } else {
                    sound.playClick();
                  }
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${
                  stk.unlocked
                    ? 'border-amber-300 bg-amber-50/50 hover:scale-105 shadow-xs'
                    : 'border-dashed border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                {stk.unlocked ? (
                  <>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-2 border border-amber-200">
                      {stk.emoji}
                    </div>
                    <span className="font-display font-bold text-sm text-slate-800 line-clamp-1">
                      {stk.title}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 mt-0.5">
                      Letra {stk.letter}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-xs text-slate-400">Letra {stk.letter}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Bloqueada</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Diploma Modal */}
      {showDiploma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-amber-50/90 rounded-3xl p-6 sm:p-10 border-8 border-amber-400 shadow-2xl text-center">
            {/* Diploma Border Pattern */}
            <div className="border-2 border-dashed border-amber-500 rounded-2xl p-6 bg-white/80">
              <div className="flex justify-center mb-3">
                <span className="text-5xl">📜</span>
              </div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
                Certificado de Mérito Escolar
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mb-3">
                Diploma de Mestre da Caligrafia
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto mb-4">
                Certificamos com muito orgulho e alegria que o(a) aluno(a):
              </p>
              <div className="inline-block py-2 px-6 border-b-2 border-slate-900 font-display font-bold text-2xl text-blue-700 mb-5">
                {studentName || 'Estudante Estrela'}
              </div>
              <p className="text-sm text-slate-700 max-w-md mx-auto mb-6">
                Praticou com dedicação o traçado correto da letra cursiva escolar na pauta,
                conquistando <strong className="text-amber-600">{totalStars} estrelas</strong> e
                desbloqueando figurinhas especiais!
              </p>

              {/* Seal */}
              <div className="flex items-center justify-center gap-8 pt-4 border-t border-slate-200">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl shadow-inner border border-amber-300">
                    ⭐
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 mt-1">Lápis Pipoca</span>
                  <span className="text-[9px] text-slate-400">Guia Calígrafo</span>
                </div>
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                  <span className="text-[11px] font-bold text-slate-700 mt-1">1º e 2º Ano</span>
                  <span className="text-[9px] text-slate-400">Ensino Fundamental</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={handlePrintDiploma}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Diploma</span>
              </button>
              <button
                onClick={() => setShowDiploma(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
