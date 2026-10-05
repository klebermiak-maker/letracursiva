import React, { useEffect, useState, useRef, useCallback } from 'react';
import { LetterData, Point } from '../types/game';
import { sound } from '../utils/audio';
import { Play, Pause, RotateCcw, Check, Sparkles, Volume2, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  letter: LetterData;
  isActive: boolean;
  onFinishTutorial: () => void;
  onClose: () => void;
  width: number;
  height: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  letter,
  isActive,
  onFinishTutorial,
  onClose,
  width,
  height,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<'slow' | 'normal'>('normal');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [pencilPos, setPencilPos] = useState<Point>({ x: 20, y: 75 });
  const [pencilAngle, setPencilAngle] = useState<number>(-35);

  const animFrameRef = useRef<number | null>(null);
  const progressRef = useRef<number>(0);

  // Helper: map normalized 0..100 to actual pixels
  const toPix = useCallback((p: Point): Point => {
    return {
      x: (p.x / 100) * width,
      y: (p.y / 100) * height,
    };
  }, [width, height]);

  // Flatten all stroke points
  const allPoints = letter.strokes.flatMap((s) => s.points);

  // Interpolate position along the path based on progress t (0..1)
  const getPointAt = useCallback((t: number): { pt: Point; angle: number; currentWaypointIdx: number } => {
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

    // Calculate angle for pencil orientation
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Determine nearest waypoint
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
  }, [allPoints, letter.waypoints]);

  // Tutorial Animation Loop
  useEffect(() => {
    if (!isActive) return;

    sound.speak(`Modo Tutorial! Observe com atenção o movimento da letra ${letter.displayChar}.`);
    progressRef.current = 0;
    setIsPlaying(true);

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isPlaying) {
        lastTime = currentTime;
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Rate: normal = ~3.2s per stroke, slow = ~5s
      const duration = speed === 'slow' ? 5.2 : 3.4;
      progressRef.current += delta / duration;

      if (progressRef.current >= 1) {
        progressRef.current = 0; // loop tutorial automatically so the student can absorb
        sound.playCheckpoint(1);
      }

      const { pt, angle, currentWaypointIdx } = getPointAt(progressRef.current);
      setPencilPos(pt);
      setPencilAngle(angle);
      setCurrentStepIndex(currentWaypointIdx);
      setProgressPercent(Math.round(progressRef.current * 100));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, isPlaying, speed, letter, getPointAt]);

  if (!isActive) return null;

  // Convert points into SVG path string
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

  const pixPencil = toPix(pencilPos);

  return (
    <div className="absolute inset-0 z-20 pointer-events-auto bg-slate-950/25 backdrop-blur-[2px] flex flex-col justify-between overflow-hidden rounded-3xl animate-in fade-in duration-200">
      {/* Top Banner with Tutorial Guide Instructions */}
      <div className="p-3 sm:p-4 bg-white/95 border-b border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-xl shadow-xs border border-amber-300">
            ✏️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                Tutorial Guiado: Letra {letter.displayChar}
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full">
                Passo {currentStepIndex + 1} de {letter.waypoints.length}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium line-clamp-1">
              {letter.instruction}
            </p>
          </div>
        </div>

        {/* Speed & Audio controls */}
        <div className="flex items-center gap-2">
          {/* Speed switch */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => {
                setSpeed('slow');
                sound.playClick();
              }}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                speed === 'slow' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Lento
            </button>
            <button
              onClick={() => {
                setSpeed('normal');
                sound.playClick();
              }}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                speed === 'normal' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Pause / Play */}
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

          {/* Repeat */}
          <button
            onClick={() => {
              progressRef.current = 0;
              sound.playClick();
            }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Recomeçar do início"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center SVG Overlay with Glowing Animated Path and Directional Indicators */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <defs>
          {/* Glowing filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Animated gradient for stroke path */}
          <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>

        {/* Base wide background track */}
        <path
          d={svgPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated marching dash guide showing motion direction */}
        <path
          d={svgPath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="6"
          strokeDasharray="10 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-[dash_1.5s_linear_infinite]"
        />

        {/* Glowing highlight trail following progress */}
        <path
          d={svgPath}
          fill="none"
          stroke="url(#strokeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          opacity="0.9"
        />

        {/* Render Waypoint Markers with animated pulsing effect */}
        {letter.waypoints.map((wp, idx) => {
          const p = toPix(wp);
          const isPassed = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
              {isCurrent && (
                <circle
                  r="20"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3"
                  className="animate-ping opacity-75"
                />
              )}
              <circle
                r={isCurrent ? "14" : "11"}
                fill={isPassed ? "#22c55e" : "#e2e8f0"}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill={isPassed ? "#ffffff" : "#475569"}
                fontSize="11"
                fontWeight="bold"
                fontFamily="Fredoka, sans-serif"
              >
                {wp.label || idx + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Animated Cartoon Pencil Mascot following the stroke coordinates */}
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
          {/* Cute animated pencil graphic */}
          <div className="text-4xl drop-shadow-lg filter select-none animate-bounce">
            ✏️
          </div>
          {/* Sparkle burst at pencil tip */}
          <div className="absolute bottom-1 -left-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
        </div>
      </div>

      {/* Bottom CTA to start drawing */}
      <div className="relative z-30 p-3 sm:p-4 bg-white/95 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
          <span>Veja o lápis completar a letrinha, depois desenhe você mesmo!</span>
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
              sound.speak('Muito bem! Agora é a sua vez de praticar na pauta!');
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
