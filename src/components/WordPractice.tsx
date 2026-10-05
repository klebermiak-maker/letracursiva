import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CURSIVE_WORDS } from '../data/cursiveAlphabet';
import { WordData, Point } from '../types/game';
import { sound } from '../utils/audio';
import { RotateCcw, Volume2, Sparkles, Check, ArrowRight } from 'lucide-react';

interface WordPracticeProps {
  onCompleteWord: (wordId: string, stars: number) => void;
  completedWords: Record<string, { stars: number }>;
}

export const WordPractice: React.FC<WordPracticeProps> = ({
  onCompleteWord,
  completedWords,
}) => {
  const [selectedWord, setSelectedWord] = useState<WordData>(CURSIVE_WORDS[0]);
  const [progress, setProgress] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const visitedWaypointsRef = useRef<Set<number>>(new Set());

  // Convert normalized to pixels
  const toPixels = useCallback((p: Point, w: number, h: number): Point => {
    return {
      x: (p.x / 100) * w,
      y: (p.y / 100) * h,
    };
  }, []);

  const toNorm = useCallback((p: Point, w: number, h: number): Point => {
    return {
      x: (p.x / w) * 100,
      y: (p.y / h) * 100,
    };
  }, []);

  // Redraw canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Calligraphy ruling lines
    const yTop = (20 / 100) * h;
    const yMid = (45 / 100) * h;
    const yBase = (75 / 100) * h;
    const yBottom = (95 / 100) * h;

    // Soft middle zone tint
    ctx.fillStyle = 'rgba(238, 246, 255, 0.75)';
    ctx.fillRect(0, yMid, w, yBase - yMid);

    // Lines
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(0, yTop);
    ctx.lineTo(w, yTop);
    ctx.stroke();

    ctx.strokeStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(0, yMid);
    ctx.lineTo(w, yMid);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    ctx.lineTo(w, yBase);
    ctx.stroke();

    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(0, yBottom);
    ctx.lineTo(w, yBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost Word Stroke
    selectedWord.strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const s = toPixels(stroke.points[0], w, h);
      ctx.moveTo(s.x, s.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = toPixels(stroke.points[i], w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Dotted inner line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.moveTo(s.x, s.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = toPixels(stroke.points[i], w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw user strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const allStrokes = [...strokesRef.current];
    if (currentStrokeRef.current.length > 0) {
      allStrokes.push(currentStrokeRef.current);
    }

    allStrokes.forEach((s) => {
      if (s.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 14;
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 4;
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) {
        ctx.lineTo(s[i].x, s[i].y);
      }
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });

    // Waypoints
    const visited = visitedWaypointsRef.current;
    selectedWord.waypoints.forEach((wp, idx) => {
      const p = toPixels(wp, w, h);
      const isVisited = visited.has(idx);
      const isNext = !isVisited && (idx === 0 || visited.has(idx - 1));

      if (isNext) {
        ctx.beginPath();
        const pulse = 16 + Math.sin(Date.now() / 150) * 3;
        ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, isNext ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? '#22c55e' : isNext ? '#eab308' : '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (wp.label) {
        ctx.font = 'bold 10px Fredoka, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wp.label, p.x, p.y);
      }
    });
  }, [selectedColor, selectedWord, toPixels]);

  // Animation frame
  useEffect(() => {
    let animId: number;
    const loop = () => {
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  // Resize
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    render();
  }, [render]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  // Word selection change
  useEffect(() => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    visitedWaypointsRef.current.clear();
    setProgress(0);
    setIsFinished(false);
    sound.speak(`Palavra ${selectedWord.word}! ${selectedWord.meaning}!`);
  }, [selectedWord]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStrokeRef.current = [pt];
    sound.playClick();
    checkWaypoints(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStrokeRef.current.push(pt);
    checkWaypoints(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
  };

  const checkWaypoints = (pt: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const norm = toNorm(pt, canvas.width, canvas.height);
    const radius = 16;

    selectedWord.waypoints.forEach((wp, idx) => {
      if (visitedWaypointsRef.current.has(idx)) return;
      const d = Math.hypot(norm.x - wp.x, norm.y - wp.y);
      if (d <= radius) {
        if (idx === 0 || visitedWaypointsRef.current.has(idx - 1)) {
          visitedWaypointsRef.current.add(idx);
          sound.playCheckpoint(idx);
          const total = selectedWord.waypoints.length;
          const count = visitedWaypointsRef.current.size;
          const p = Math.round((count / total) * 100);
          setProgress(p);

          if (count === total && !isFinished) {
            setIsFinished(true);
            sound.playCelebration();
            sound.speak(`Parabéns! Você ligou as letrinhas e escreveu a palavra ${selectedWord.word}!`);
            onCompleteWord(selectedWord.id, 3);
          }
        }
      }
    });
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    visitedWaypointsRef.current.clear();
    setProgress(0);
    setIsFinished(false);
    sound.playClick();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            {selectedWord.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl text-slate-900 tracking-wide">
                {selectedWord.word}
              </span>
              <button
                onClick={() => sound.speak(`Palavra: ${selectedWord.word}. Sílabas: ${selectedWord.syllables.join(' - ')}`)}
                className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                title="Ouvir pronúncia e sílabas"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {/* Syllables breakdown */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-slate-500">Sílabas:</span>
              {selectedWord.syllables.map((syl, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md"
                >
                  {syl}
                </span>
              ))}
              <span className="text-xs text-slate-400">· {selectedWord.meaning}</span>
            </div>
          </div>
        </div>

        {/* Word Selector Chips */}
        <div className="flex items-center gap-1.5">
          {CURSIVE_WORDS.map((w) => {
            const isSel = selectedWord.id === w.id;
            const isDone = completedWords[w.id];
            return (
              <button
                key={w.id}
                onClick={() => {
                  setSelectedWord(w);
                  sound.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{w.icon}</span>
                <span>{w.word}</span>
                {isDone && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Ruled Slate */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[400px] bg-amber-50/20 rounded-3xl border-4 border-amber-200 shadow-md overflow-hidden select-none touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block"
        />

        {/* Progress Pill */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-xs border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
          <div className="w-16 bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Tinta:</span>
          {['#2563eb', '#334155', '#9333ea', '#16a34a', '#d97706'].map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                sound.playClick();
              }}
              style={{ backgroundColor: color }}
              className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Palavra</span>
          </button>

          <button
            onClick={() => {
              const currentIdx = CURSIVE_WORDS.findIndex((w) => w.id === selectedWord.id);
              const nextIdx = (currentIdx + 1) % CURSIVE_WORDS.length;
              setSelectedWord(CURSIVE_WORDS[nextIdx]);
              sound.playClick();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Próxima Palavra</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
