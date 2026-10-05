import React, { useEffect, useState, useRef, useCallback } from 'react';
import { LetterData, Point } from '../types/game';
import { sound } from '../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  Volume2,
  ArrowRight,
  HandMetal,
  Eye,
  PenTool,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface TutorialOverlayProps {
  letter: LetterData;
  isActive: boolean;
  onFinishTutorial: () => void;
  onClose: () => void;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  letter,
  isActive,
  onFinishTutorial,
  onClose,
  width,
  height,
}) => {
  // Modes: 'interactive' (child draws guided step-by-step) | 'demo' (magical pencil demonstrates)
  const [tutorialMode, setTutorialMode] = useState<'interactive' | 'demo'>('interactive');

  // Interactive Guided State
  const [interactiveStep, setInteractiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [interactiveStrokes, setInteractiveStrokes] = useState<Point[][]>([]);
  const currentInteractiveStrokeRef = useRef<Point[]>([]);
  const isTracingRef = useRef<boolean>(false);
  const [stepSuccessPrompt, setStepSuccessPrompt] = useState<string | null>(null);
  const [isInteractiveFinished, setIsInteractiveFinished] = useState<boolean>(false);

  // Demo Animation State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<'slow' | 'normal'>('normal');
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);
  const [pencilPos, setPencilPos] = useState<Point>({ x: 20, y: 75 });
  const [pencilAngle, setPencilAngle] = useState<number>(-35);

  // Sparkles
  const particlesRef = useRef<Particle[]>([]);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  // Map normalized 0..100 to pixels
  const toPix = useCallback(
    (p: Point): Point => {
      return {
        x: (p.x / 100) * width,
        y: (p.y / 100) * height,
      };
    },
    [width, height]
  );

  // Flatten all stroke points
  const allPoints = letter.strokes.flatMap((s) => s.points);

  // Step names/descriptions for the letter
  const getStepDescription = (stepIdx: number, total: number) => {
    if (stepIdx === 0) {
      return '1. Ponto de Partida: Toque no círculo piscante verde para firmar o lápis!';
    }
    if (stepIdx === total - 1) {
      return `${stepIdx + 1}. Saída e Ligação: Puxe a perninha no chão para dar a mão à próxima letra!`;
    }
    if (stepIdx === 1) {
      return `${stepIdx + 1}. Movimento Inicial: Suba suavemente seguindo as setinhas amarelas!`;
    }
    return `${stepIdx + 1}. Contorno: Complete a voltinha redonda sem tirar o lápis!`;
  };

  // Sparkles generator
  const emitSparkles = useCallback(
    (px: number, py: number, count: number = 15) => {
      const sparkleColors = ['#facc15', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 4;
        particlesRef.current.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 5,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
          alpha: 1,
          life: 1,
        });
      }
    },
    []
  );

  // Reset state when letter changes or opens
  useEffect(() => {
    if (!isActive) return;
    setInteractiveStep(0);
    setCompletedSteps(new Set());
    setInteractiveStrokes([]);
    currentInteractiveStrokeRef.current = [];
    setIsInteractiveFinished(false);
    setStepSuccessPrompt(null);
    progressRef.current = 0;

    sound.speak(`Tutorial Interativo da letra ${letter.displayChar}! Vamos aprender o movimento passo a passo.`);
  }, [isActive, letter]);

  // Interpolate position along the path for Demo mode
  const getPointAt = useCallback(
    (t: number): { pt: Point; angle: number; currentWaypointIdx: number } => {
      if (allPoints.length === 0) {
        return { pt: { x: 50, y: 50 }, angle: -30, currentWaypointIdx: 0 };
      }
      const scaledT = Math.max(0, Math.min(1, t)) * (allPoints.length - 1);
      const index = Math.floor(scaledT);
      const fraction = scaledT - index;

      const p1 = allPoints[index];
      const p2 = allPoints[Math.min(index + 1, allPoints.length - 1)];

      const curPt = {
        x: p1.x + (p2.x - p1.x) * fraction,
        y: p1.y + (p2.y - p1.y) * fraction,
      };

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;

      let nearestWpIdx = 0;
      let minDist = 999;
      letter.waypoints.forEach((wp, i) => {
        const d = Math.hypot(wp.x - curPt.x, wp.y - curPt.y);
        if (d < minDist) {
          minDist = d;
          nearestWpIdx = i;
        }
      });

      return { pt: curPt, angle: angleDeg - 45, currentWaypointIdx: nearestWpIdx };
    },
    [allPoints, letter.waypoints]
  );

  // Demo Animation & Particles Loop
  useEffect(() => {
    if (!isActive) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update Demo movement if in demo mode
      if (tutorialMode === 'demo' && isPlaying) {
        const duration = speed === 'slow' ? 5.2 : 3.4;
        progressRef.current += delta / duration;
        if (progressRef.current >= 1) {
          progressRef.current = 0;
          sound.playCheckpoint(1);
        }
        const { pt, angle, currentWaypointIdx } = getPointAt(progressRef.current);
        setPencilPos(pt);
        setPencilAngle(angle);
        setDemoStepIndex(currentWaypointIdx);
      }

      // Render sparkles on canvasOverlayRef
      const canvas = canvasOverlayRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.alpha -= 0.025;
            p.size = Math.max(0, p.size - 0.05);

            if (p.alpha <= 0 || p.size <= 0) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, tutorialMode, isPlaying, speed, getPointAt]);

  // Adjust canvas size
  useEffect(() => {
    const canvas = canvasOverlayRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  // Interactive Tracing Handlers
  const handleInteractivePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tutorialMode !== 'interactive' || isInteractiveFinished) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    isTracingRef.current = true;
    currentInteractiveStrokeRef.current = [pt];
    setInteractiveStrokes((prev) => [...prev, [pt]]);
    sound.playClick();

    // Check hit on target waypoint
    checkInteractiveWaypointHit(pt);
  };

  const handleInteractivePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTracingRef.current || tutorialMode !== 'interactive' || isInteractiveFinished) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    currentInteractiveStrokeRef.current.push(pt);
    if (currentInteractiveStrokeRef.current.length % 5 === 0) {
      sound.playStrokeTick();
    }

    setInteractiveStrokes((prev) => {
      if (prev.length === 0) return [[pt]];
      const updated = [...prev];
      updated[updated.length - 1] = [...currentInteractiveStrokeRef.current];
      return updated;
    });

    checkInteractiveWaypointHit(pt);
  };

  const handleInteractivePointerUp = () => {
    isTracingRef.current = false;
    currentInteractiveStrokeRef.current = [];
  };

  // Check if current step waypoint was hit
  const checkInteractiveWaypointHit = (pt: Point) => {
    const targetWp = letter.waypoints[interactiveStep];
    if (!targetWp) return;

    const targetPix = toPix(targetWp);
    const dist = Math.hypot(pt.x - targetPix.x, pt.y - targetPix.y);

    // Hit radius with generous assistance for interactive learning
    if (dist <= 26) {
      if (!completedSteps.has(interactiveStep)) {
        const nextSet = new Set(completedSteps);
        nextSet.add(interactiveStep);
        setCompletedSteps(nextSet);

        emitSparkles(targetPix.x, targetPix.y, 22);
        sound.playCheckpoint(interactiveStep);

        const praises = [
          'Ótimo início!',
          'Muito bem! Continue o traço!',
          'Excelente curva!',
          'Perfeito! Quase terminando!',
          'Espetacular!',
        ];
        const randomPraise = praises[interactiveStep % praises.length];
        setStepSuccessPrompt(randomPraise);

        const nextStep = interactiveStep + 1;
        if (nextStep < letter.waypoints.length) {
          setInteractiveStep(nextStep);
          sound.speak(`${randomPraise} Agora vá para o próximo ponto!`);
        } else {
          // Finished all interactive steps!
          setIsInteractiveFinished(true);
          sound.playCelebration();
          sound.speak(`Parabéns! Você concluiu todos os passos do traçado da letra ${letter.displayChar}!`);
        }
      }
    }
  };

  // Clear interactive progress
  const handleClearInteractive = () => {
    setInteractiveStrokes([]);
    currentInteractiveStrokeRef.current = [];
    setInteractiveStep(0);
    setCompletedSteps(new Set());
    setIsInteractiveFinished(false);
    setStepSuccessPrompt(null);
    sound.playClick();
    sound.speak(`Recomeçando o treino guiado da letra ${letter.displayChar}.`);
  };

  if (!isActive) return null;

  // Full letter SVG path
  const svgPath = letter.strokes.reduce((acc, stroke) => {
    if (stroke.points.length === 0) return acc;
    const first = toPix(stroke.points[0]);
    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < stroke.points.length; i++) {
      const p = toPix(stroke.points[i]);
      d += ` L ${p.x} ${p.y}`;
    }
    return acc ? `${acc} ${d}` : d;
  }, '');

  // Pix coords of pencil in demo
  const pixPencil = toPix(pencilPos);

  // Active target waypoint coords in interactive mode
  const activeWp = letter.waypoints[interactiveStep] || letter.waypoints[0];
  const activeWpPix = toPix(activeWp);

  return (
    <div
      onPointerDown={handleInteractivePointerDown}
      onPointerMove={handleInteractivePointerMove}
      onPointerUp={handleInteractivePointerUp}
      onPointerCancel={handleInteractivePointerUp}
      className="absolute inset-0 z-20 pointer-events-auto bg-slate-950/20 backdrop-blur-[2px] flex flex-col justify-between overflow-hidden rounded-3xl animate-in fade-in duration-200 select-none touch-none cursor-crosshair"
    >
      {/* Top Banner: Mode Selector & Step Stepper */}
      <div className="p-3 sm:p-4 bg-white/95 border-b border-amber-200 shadow-sm flex flex-col gap-2.5 z-30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Letter Info and Mode Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center text-xl shadow-xs border border-amber-300">
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                  Tutorial Interativo: Letra {letter.displayChar}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                  {tutorialMode === 'interactive' ? '✍️ Prática Guiada' : '👁️ Demonstração'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium line-clamp-1">
                {tutorialMode === 'interactive'
                  ? getStepDescription(interactiveStep, letter.waypoints.length)
                  : letter.instruction}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => {
                  setTutorialMode('interactive');
                  sound.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tutorialMode === 'interactive'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Praticar Passo a Passo</span>
              </button>

              <button
                onClick={() => {
                  setTutorialMode('demo');
                  sound.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tutorialMode === 'demo'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Animação</span>
              </button>
            </div>

            {/* In Demo Mode: Speed & Pause */}
            {tutorialMode === 'demo' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsPlaying(!isPlaying);
                    sound.playClick();
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Continuar'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-700" />}
                </button>
                <button
                  onClick={() => {
                    progressRef.current = 0;
                    sound.playClick();
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Recomeçar animação"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* In Interactive Mode: Reset Steps */}
            {tutorialMode === 'interactive' && (
              <button
                onClick={handleClearInteractive}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                title="Recomeçar os passos do tutorial"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Step-by-Step Interactive Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {letter.waypoints.map((wp, idx) => {
            const isDone = completedSteps.has(idx);
            const isCurrent = interactiveStep === idx && !isInteractiveFinished;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (tutorialMode === 'interactive') {
                    setInteractiveStep(idx);
                    sound.playClick();
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isDone
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300 scale-102'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3] text-emerald-700" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-400/40 text-[9px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                )}
                <span>Passo {idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Guided Path Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <defs>
          <filter id="glow-interactive" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base wide background track */}
        <path
          d={svgPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.88)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated marching directional dash guide */}
        <path
          d={svgPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="6"
          strokeDasharray="10 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[dash_1.5s_linear_infinite]"
        />

        {/* Interactive Highlight Trail for Completed Segments */}
        <path
          d={svgPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow-interactive)"
          opacity={tutorialMode === 'interactive' && isInteractiveFinished ? '0.9' : '0.6'}
        />

        {/* Waypoints */}
        {letter.waypoints.map((wp, idx) => {
          const p = toPix(wp);
          const isPassed =
            tutorialMode === 'interactive'
              ? completedSteps.has(idx)
              : idx <= demoStepIndex;
          const isCurrent =
            tutorialMode === 'interactive'
              ? interactiveStep === idx && !isInteractiveFinished
              : idx === demoStepIndex;

          return (
            <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
              {isCurrent && (
                <circle
                  r="24"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3.5"
                  className="animate-ping opacity-80"
                />
              )}
              <circle
                r={isCurrent ? '15' : '11'}
                fill={isPassed ? '#22c55e' : isCurrent ? '#f59e0b' : '#e2e8f0'}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill={isPassed || isCurrent ? '#ffffff' : '#475569'}
                fontSize="11"
                fontWeight="bold"
                fontFamily="Fredoka, sans-serif"
              >
                {isPassed ? '✓' : wp.label || idx + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Live Interactive Ink rendered as SVG lines */}
      {tutorialMode === 'interactive' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 12 }}>
          {interactiveStrokes.map((stk, sIdx) => {
            if (stk.length < 2) return null;
            let d = `M ${stk[0].x} ${stk[0].y}`;
            for (let i = 1; i < stk.length; i++) {
              d += ` L ${stk[i].x} ${stk[i].y}`;
            }
            return (
              <path
                key={sIdx}
                d={d}
                fill="none"
                stroke="#2563eb"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            );
          })}
        </svg>
      )}

      {/* Floating Animated Cartoon Pencil (In Demo Mode) */}
      {tutorialMode === 'demo' && (
        <div
          className="absolute transition-transform duration-75 pointer-events-none"
          style={{
            left: `${pixPencil.x}px`,
            top: `${pixPencil.y}px`,
            transform: `translate(-12px, -46px) rotate(${pencilAngle}deg)`,
            zIndex: 25,
          }}
        >
          <div className="relative flex flex-col items-center">
            <div className="text-4xl drop-shadow-lg filter select-none animate-bounce">
              ✏️
            </div>
            <div className="absolute bottom-1 -left-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping opacity-80" />
          </div>
        </div>
      )}

      {/* Floating Target Hand / Arrow Guide (In Interactive Mode) */}
      {tutorialMode === 'interactive' && !isInteractiveFinished && (
        <div
          className="absolute pointer-events-none transition-all duration-200"
          style={{
            left: `${activeWpPix.x}px`,
            top: `${activeWpPix.y}px`,
            transform: 'translate(-50%, -64px)',
            zIndex: 25,
          }}
        >
          <div className="bg-amber-400 text-slate-950 font-display font-black text-xs px-3 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-amber-300 animate-bounce">
            <span>Passo {interactiveStep + 1}: Toque aqui!</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-950 fill-amber-900" />
          </div>
          <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 transform -translate-y-1 mx-auto" />
        </div>
      )}

      {/* Sparkles Canvas Overlay */}
      <canvas
        ref={canvasOverlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 20 }}
      />

      {/* Interactive Step Success Prompt Banner */}
      {stepSuccessPrompt && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white font-display font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in zoom-in-90 duration-150 z-30">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{stepSuccessPrompt}</span>
        </div>
      )}

      {/* Interactive All Steps Completed Banner */}
      {isInteractiveFinished && (
        <div className="absolute inset-x-4 top-28 sm:max-w-md sm:mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-2xl border-2 border-emerald-300 text-center animate-in zoom-in-95 duration-200 z-30">
          <div className="text-3xl mb-1">🎉</div>
          <h3 className="font-display font-bold text-base sm:text-lg mb-1">
            Traçado Interativo Concluído com Sucesso!
          </h3>
          <p className="text-xs text-emerald-100 mb-3">
            Você praticou todos os pontos da letra <strong>{letter.displayChar}</strong>.
            Agora passe para a pauta aberta e treine sua caligrafia!
          </p>
          <button
            onClick={() => {
              sound.playCelebration();
              onFinishTutorial();
            }}
            className="w-full py-2.5 px-4 bg-white text-emerald-800 font-display font-bold text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ir Para a Pauta Aberta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="relative z-30 p-3 sm:p-4 bg-white/95 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
          <span>
            {tutorialMode === 'interactive'
              ? 'Arraste o dedo ou mouse seguindo as bolinhas amarelas para treinar cada passo!'
              : 'Observe o movimento do Lápis Pipoca ou mude para Praticar Passo a Passo!'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Fechar Tutorial
          </button>

          <button
            onClick={() => {
              sound.playCelebration();
              sound.speak('Muito bem! Vamos desenhar na pauta escolar!');
              onFinishTutorial();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer transform hover:scale-102"
          >
            <span>Quero Desenhar Agora!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
