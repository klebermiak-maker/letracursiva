import React from 'react';
import { LetterData } from '../types/game';
import { sound } from '../utils/audio';
import {
  Lightbulb,
  X,
  Volume2,
  Compass,
  Sparkles,
  AlertCircle,
  Layers,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface LetterTipsPanelProps {
  letter: LetterData;
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial: () => void;
}

export const LetterTipsPanel: React.FC<LetterTipsPanelProps> = ({
  letter,
  isOpen,
  onClose,
  onOpenTutorial,
}) => {
  if (!isOpen) return null;

  // Determine starting line and family characteristics
  const getLetterGuidance = (char: string) => {
    const c = char.toLowerCase();

    let startingLine = 'Linha Base (Solo azul)';
    let startingLineColor = 'text-blue-700 bg-blue-50 border-blue-200';
    let startingLineIcon = '🌱';
    let movementFamily = 'Curvinhas Mágicas';
    let goldenTip = 'Mantenha o lápis encostado no papel do começo até o fim da letrinha!';

    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      startingLine = 'Linha Superior (Céu das altas)';
      startingLineColor = 'text-sky-700 bg-sky-50 border-sky-200';
      startingLineIcon = '☁️';
      movementFamily = 'Grandes Maiúsculas';
      goldenTip = 'Comece no alto do céu com elegância e desça até firmar o pé na linha base!';
    } else if (['a', 'c', 'd', 'g', 'o', 'q'].includes(c)) {
      startingLine = 'Linha Base (Solo)';
      movementFamily = 'Família da voltinha da letra C';
      goldenTip = 'Suba até o meio, volte pelo mesmo caminho fechando a redondinha sem tirar o lápis!';
    } else if (['e', 'l', 'b', 'f', 'h', 'k'].includes(c)) {
      startingLine = 'Linha Base (Solo)';
      movementFamily = 'Família dos Lacinhos e Laços Altos';
      goldenTip = 'Suba inclinado, faça a curva lá no céu por trás e desça cruzando na linha base!';
    } else if (['m', 'n', 'v', 'w'].includes(c)) {
      startingLine = 'Linha Intermediária (Meio)';
      startingLineColor = 'text-amber-800 bg-amber-50 border-amber-200';
      startingLineIcon = '🏡';
      movementFamily = 'Família dos Morrinhos Suaves';
      goldenTip = 'Faça as montanhas sempre do mesmo tamanho, encostando a barriguinha no chão!';
    } else if (['i', 'u', 't', 'j', 'p', 'y'].includes(c)) {
      startingLine = 'Linha Base (Solo)';
      movementFamily = 'Família das Pontinhas e Espetinhos';
      goldenTip = 'Suba pontudinho e desça pelo mesmo trilho abrindo a perninha no chão!';
    }

    return { startingLine, startingLineColor, startingLineIcon, movementFamily, goldenTip };
  };

  const guidance = getLetterGuidance(letter.char);

  const handleSpeakTips = () => {
    sound.speak(
      `Dicas da letra ${letter.displayChar}! Ponto de partida: ${guidance.startingLine}. ${letter.instruction}. Lembre-se: ${guidance.goldenTip}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Side Panel Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 z-10">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-xs border border-amber-200">
              {letter.exampleIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl text-slate-900">
                  Dicas do Traçado
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                  Letra {letter.displayChar}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                como em <strong>{letter.exampleWord}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeakTips}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Ouvir dicas em voz alta"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 space-y-4 text-xs sm:text-sm text-slate-700">
          {/* Card 1: Ponto de Início */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-900 font-display font-bold text-sm mb-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>1. Ponto de Partida (Onde Começar?)</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs ${guidance.startingLineColor} mb-2`}>
              <span>{guidance.startingLineIcon}</span>
              <span>{guidance.startingLine}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Posicione a ponta do lápis no ponto número <strong>1</strong>.
              Nunca comece de trás para frente para manter a ligação fluida com as outras letrinhas!
            </p>
          </div>

          {/* Card 2: Sentido do Movimento */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-950 font-display font-bold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-amber-600 fill-amber-300" />
              <span>2. Sentido do Movimento & Passos</span>
            </div>
            <p className="text-xs text-slate-700 font-medium mb-3 leading-relaxed">
              {letter.instruction}
            </p>

            {/* Step markers visual */}
            <div className="space-y-2">
              {letter.waypoints.map((wp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 text-xs text-slate-700 bg-white/80 p-2 rounded-xl border border-amber-100"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                    {wp.label || index + 1}
                  </span>
                  <span>
                    {index === 0
                      ? 'Ponto de partida: firme o lápis e prepare o impulso.'
                      : index === letter.waypoints.length - 1
                      ? 'Finalização: termine puxando o bracinho para dar a mãozinha à próxima letra.'
                      : `Siga a curva na direção indicada pelo marcador.`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Família Caligráfica */}
          <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl">
            <div className="flex items-center gap-2 text-purple-950 font-display font-bold text-sm mb-1.5">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>3. Família da Letrinha</span>
            </div>
            <span className="font-semibold text-xs text-purple-800 block mb-1">
              {guidance.movementFamily}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              No método caligráfico, letrinhas da mesma família compartilham o mesmo traçado básico de mão.
            </p>
          </div>

          {/* Card 4: Dica de Ouro do Lápis Pipoca */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 text-sm">
              ✏️
            </div>
            <div>
              <strong className="text-emerald-900 block font-semibold text-xs mb-0.5">
                Segredo do Lápis Pipoca:
              </strong>
              <p className="text-xs text-slate-700 leading-relaxed">
                {guidance.goldenTip}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenTutorial();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-amber-950" />
            <span>Ver Animação no Modo Tutorial</span>
          </button>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Entendi! Quero Treinar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
