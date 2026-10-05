import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LetterData, Point, StrokeWaypoint } from '../types/game';
import { sound } from '../utils/audio';
import { TutorialOverlay } from './TutorialOverlay';
import { LetterTipsPanel } from './LetterTipsPanel';
import { LightningChallengeModal } from './LightningChallengeModal';
import { RotateCcw, Play, Eye, Sparkles, Volume2, Check, ArrowRight, GraduationCap, Lightbulb, Zap, Timer, Flame } from 'lucide-react';

interface CursiveCanvasProps {
  letter: LetterData;
  onComplete: (stars: number, accuracy: number) => void;
  handPreference: 'right' | 'left';
  onNextLetter?: () => void;
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

export const CursiveCanvas: React.FC<CursiveCanvasProps> = ({
  letter,
  onComplete,
  handPreference,
  onNextLetter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const userStrokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const visitedCheckpointsRef = useRef<Set<number>>(new Set());
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Settings
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb');
  const [lineWidth, setLineWidth] = useState<number>(14);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [demoProgress, setDemoProgress] = useState<number>(0);
  const [hasFinishedCurrent, setHasFinishedCurrent] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 440 });
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(true);
  const [autoTutorial, setAutoTutorial] = useState<boolean>(true);
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);

  // Lightning Challenge State
  const [isChallengeMode, setIsChallengeMode] = useState<boolean>(false);
  const [challengeLevel, setChallengeLevel] = useState<number>(1);
  const [challengeStreak, setChallengeStreak] = useState<number>(0);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<number>(16);
  const [isChallengeRunning, setIsChallengeRunning] = useState<boolean>(false);
  const [challengeModalStatus, setChallengeModalStatus] = useState<'success' | 'timeup' | null>(null);
  const [challengeElapsed, setChallengeElapsed] = useState<number>(0);
  const challengeStartTimeRef = useRef<number>(0);

  // Pen color choices
  const colors = [
    { name: 'Azul Escolar', hex: '#2563eb', bg: 'bg-blue-600' },
    { name: 'Grafite', hex: '#334155', bg: 'bg-slate-700' },
    { name: 'Roxo Mágico', hex: '#9333ea', bg: 'bg-purple-600' },
    { name: 'Verde Trevo', hex: '#16a34a', bg: 'bg-emerald-600' },
    { name: 'Dourado Estrela', hex: '#d97706', bg: 'bg-amber-500' },
    { name: 'Rosa Chiclete', hex: '#e11d48', bg: 'bg-rose-500' },
  ];

  // Helper: map normalized 0..100 coord to canvas pixel size
  const toPixels = useCallback((p: Point, width: number, height: number): Point => {
    return {
      x: (p.x / 100) * width,
      y: (p.y / 100) * height,
    };
  }, []);

  // Helper: map pixel coord to normalized 0..100
  const toNormalized = useCallback((p: Point, width: number, height: number): Point => {
    return {
      x: (p.x / width) * 100,
      y: (p.y / height) * 100,
    };
  }, []);

  // Add sparkle explosion particles at normalized location
  const emitSparkles = useCallback((nx: number, ny: number, count: number = 18) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const px = (nx / 100) * canvas.width;
    const py = (ny / 100) * canvas.height;

    const sparkleColors = ['#facc15', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        alpha: 1,
        life: 1,
      });
    }
  }, []);

  // Render the entire canvas: Guidelines, Letter Ghost Template, User strokes, Checkpoints, Particles
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Clear background
    ctx.clearRect(0, 0, w, h);

    // 2. Draw Calligraphy Pauta (4 guidelines)
    // Linha 1: y=20 (Ascendentes)
    const yTop = (20 / 100) * h;
    // Linha 2: y=45 (Intermediária / Teto minúsculas)
    const yMid = (45 / 100) * h;
    // Linha 3: y=75 (Base / Chão)
    const yBase = (75 / 100) * h;
    // Linha 4: y=95 (Descendentes / Raiz)
    const yBottom = (95 / 100) * h;

    // Highlight the middle zone where small letters rest (soft sky blue tint)
    ctx.fillStyle = 'rgba(238, 246, 255, 0.7)';
    ctx.fillRect(0, yMid, w, yBase - yMid);

    // Line 1: Upper / Ascenders (dashed light blue)
    ctx.beginPath();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.moveTo(0, yTop);
    ctx.lineTo(w, yTop);
    ctx.stroke();

    // Line 2: Midline (dashed azure)
    ctx.beginPath();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.moveTo(0, yMid);
    ctx.lineTo(w, yMid);
    ctx.stroke();

    // Line 3: Baseline (solid royal blue - ground for writing)
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([]);
    ctx.moveTo(0, yBase);
    ctx.lineTo(w, yBase);
    ctx.stroke();

    // Line 4: Descenders (dashed soft rose)
    ctx.beginPath();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.moveTo(0, yBottom);
    ctx.lineTo(w, yBottom);
    ctx.stroke();
    ctx.setLineDash([]); // reset dash

    // Labels for the lines
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('☁️ Linha do Céu (altas)', 14, yTop - 6);
    ctx.fillStyle = '#2563eb';
    ctx.fillText('🌱 Linha Base (chão)', 14, yBase - 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('🥕 Linha da Raiz (baixas)', 14, yBottom - 6);

    // 3. Draw Ghost Target Letter Stroke (template to follow)
    letter.strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = lineWidth + 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const start = toPixels(stroke.points[0], w, h);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = toPixels(stroke.points[i], w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Inner guideline trace
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = toPixels(stroke.points[i], w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 4. Draw User Strokes with ink aesthetics
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...userStrokesRef.current];
    if (currentStrokeRef.current.length > 0) {
      allStrokes.push(currentStrokeRef.current);
    }

    allStrokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineWidth;

      // Soft shadow under ink
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    });

    // 5. Draw Waypoints / Checkpoints
    const visited = visitedCheckpointsRef.current;
    letter.waypoints.forEach((wp, index) => {
      const pt = toPixels(wp, w, h);
      const isVisited = visited.has(index);
      const isNextTarget = !isVisited && (index === 0 || visited.has(index - 1));

      // Outer glow for next target
      if (isNextTarget) {
        ctx.beginPath();
        const pulse = 18 + Math.sin(Date.now() / 150) * 3;
        ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isNextTarget ? 13 : 10, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? '#22c55e' : isNextTarget ? '#eab308' : '#cbd5e1';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Checkmark or Number
      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isVisited) {
        ctx.fillText('✓', pt.x, pt.y + 0.5);
      } else if (wp.label) {
        ctx.fillText(wp.label, pt.x, pt.y + 0.5);
      } else {
        ctx.fillText(String(index + 1), pt.x, pt.y + 0.5);
      }
    });

    // 6. Draw Sparkle Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
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
  }, [letter, lineWidth, selectedColor, toPixels]);

  // Animation Loop for particles and pulsating targets
  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      renderCanvas();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  // Adjust canvas pixel resolution to container size
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });
    const dpr = window.devicePixelRatio || 1;
    // Set actual resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    // Also record client display dimensions
    canvas.width = rect.width;
    canvas.height = rect.height;
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Dynamic parameters for Lightning Challenge
  const getChallengeParams = useCallback((lvl: number) => {
    if (lvl === 1) return { time: 16, radius: 15, minAcc: 75, title: 'Iniciante' };
    if (lvl === 2) return { time: 13, radius: 13, minAcc: 80, title: 'Ágil' };
    if (lvl === 3) return { time: 10, radius: 11, minAcc: 85, title: 'Veloz' };
    if (lvl === 4) return { time: 8, radius: 9.5, minAcc: 90, title: 'Mestre' };
    return { time: 6.5, radius: 8.5, minAcc: 92, title: 'Super Sônico' };
  }, []);

  // Countdown timer for Lightning Challenge
  useEffect(() => {
    if (!isChallengeMode || !isChallengeRunning) return;

    const currentParams = getChallengeParams(challengeLevel);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - challengeStartTimeRef.current) / 1000;
      const remaining = Math.max(0, currentParams.time - elapsed);
      setChallengeTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsChallengeRunning(false);
        setChallengeElapsed(currentParams.time);
        setChallengeModalStatus('timeup');
        setChallengeStreak(0);
        sound.playClick();
        sound.speak('O tempo acabou! Tente mais uma vez!');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isChallengeMode, isChallengeRunning, challengeLevel, getChallengeParams]);

  // Challenge Mode control functions
  const handleStartChallenge = () => {
    handleClear();
    setIsTutorialActive(false);
    setIsChallengeMode(true);
    setIsChallengeRunning(false);
    const p = getChallengeParams(challengeLevel);
    setChallengeTimeLeft(p.time);
    setChallengeModalStatus(null);
    sound.playCelebration();
    sound.speak(`Desafio Relâmpago! Nível ${challengeLevel}. Você tem ${p.time} segundos. Comece a desenhar na pauta!`);
  };

  const handleExitChallenge = () => {
    setIsChallengeMode(false);
    setIsChallengeRunning(false);
    setChallengeModalStatus(null);
    sound.playClick();
  };

  const handleRetryChallenge = () => {
    handleClear();
    setIsChallengeRunning(false);
    setChallengeModalStatus(null);
    const p = getChallengeParams(challengeLevel);
    setChallengeTimeLeft(p.time);
    sound.playClick();
  };

  const handleNextChallengeLetter = () => {
    setIsChallengeRunning(false);
    setChallengeModalStatus(null);
    handleClear();
    if (onNextLetter) {
      onNextLetter();
    }
    const p = getChallengeParams(challengeLevel);
    setChallengeTimeLeft(p.time);
    sound.playClick();
  };

  // Reset when letter changes
  useEffect(() => {
    userStrokesRef.current = [];
    currentStrokeRef.current = [];
    visitedCheckpointsRef.current.clear();
    particlesRef.current = [];
    setProgress(0);
    setHasFinishedCurrent(false);
    setIsDemoRunning(false);
    if (isChallengeMode) {
      setIsChallengeRunning(false);
      const p = getChallengeParams(challengeLevel);
      setChallengeTimeLeft(p.time);
      setChallengeModalStatus(null);
    } else if (autoTutorial) {
      setIsTutorialActive(true);
    }
    // Voice prompt
    sound.speak(`${letter.displayChar}. ${letter.name}. ${letter.exampleWord}!`);
    renderCanvas();
  }, [letter, autoTutorial, isChallengeMode, challengeLevel, getChallengeParams, renderCanvas]);

  // Checkpoint validation
  const checkCheckpointsNear = useCallback((userPt: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const norm = toNormalized(userPt, canvas.width, canvas.height);
    const currentParams = isChallengeMode ? getChallengeParams(challengeLevel) : null;
    const hitRadius = currentParams ? currentParams.radius : 14;

    letter.waypoints.forEach((wp, index) => {
      if (visitedCheckpointsRef.current.has(index)) return;

      const dist = Math.hypot(norm.x - wp.x, norm.y - wp.y);
      if (dist <= hitRadius) {
        // Did child reach prior target or is it start?
        const canVisit = index === 0 || visitedCheckpointsRef.current.has(index - 1);
        if (canVisit) {
          visitedCheckpointsRef.current.add(index);
          emitSparkles(wp.x, wp.y, 14);
          sound.playCheckpoint(index);

          const total = letter.waypoints.length;
          const count = visitedCheckpointsRef.current.size;
          const newProgress = Math.round((count / total) * 100);
          setProgress(newProgress);

          // If all waypoints hit!
          if (count === total && !hasFinishedCurrent) {
            setHasFinishedCurrent(true);

            if (isChallengeMode) {
              setIsChallengeRunning(false);
              const timeSpent = Math.max(0.5, (Date.now() - challengeStartTimeRef.current) / 1000);
              setChallengeElapsed(timeSpent);
              const bonus = Math.max(0, Math.round((currentParams!.time - timeSpent) * 1.5));
              const calcAccuracy = Math.min(100, Math.max(currentParams!.minAcc, 92 + bonus));

              const newStreak = challengeStreak + 1;
              setChallengeStreak(newStreak);
              if (newStreak >= 2 && challengeLevel < 5) {
                setChallengeLevel((prev) => prev + 1);
              }
              setChallengeModalStatus('success');
              sound.playCelebration();
              sound.speak(`Incrível! Desafio concluído em ${timeSpent.toFixed(1)} segundos!`);
              onComplete(3, calcAccuracy);
            } else {
              sound.playCelebration();
              sound.speak(`Muito bem! Você traçou a letra ${letter.displayChar}!`);
              const stars = 3;
              setTimeout(() => {
                onComplete(stars, 96);
              }, 800);
            }
          }
        }
      }
    });
  }, [challengeLevel, challengeStreak, emitSparkles, getChallengeParams, hasFinishedCurrent, isChallengeMode, letter, onComplete, toNormalized]);

  // Pointer event handlers (mouse, finger touch, stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDemoRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Start challenge timer on first draw
    if (isChallengeMode && !isChallengeRunning && !challengeModalStatus) {
      setIsChallengeRunning(true);
      challengeStartTimeRef.current = Date.now();
    }

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const pt = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    currentStrokeRef.current = [pt];
    sound.playClick();
    checkCheckpointsNear(pt);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isDemoRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pt = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    currentStrokeRef.current.push(pt);
    if (currentStrokeRef.current.length % 5 === 0) {
      sound.playStrokeTick();
    }
    checkCheckpointsNear(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      userStrokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
  };

  // Clear drawing
  const handleClear = () => {
    userStrokesRef.current = [];
    currentStrokeRef.current = [];
    visitedCheckpointsRef.current.clear();
    particlesRef.current = [];
    setProgress(0);
    setHasFinishedCurrent(false);
    sound.playClick();
  };

  // Undo last stroke
  const handleUndo = () => {
    if (userStrokesRef.current.length > 0) {
      userStrokesRef.current.pop();
      sound.playClick();
    }
  };

  // Run guided animated demonstration
  const runDemonstration = () => {
    if (isDemoRunning) return;
    handleClear();
    setIsDemoRunning(true);
    sound.playClick();
    sound.speak(`Veja como se escreve a letra ${letter.displayChar}. Observe o lápis!`);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Collect all points from strokes
    const strokePoints: Point[] = [];
    letter.strokes.forEach((s) => {
      s.points.forEach((pt) => {
        strokePoints.push(toPixels(pt, w, h));
      });
    });

    if (strokePoints.length === 0) {
      setIsDemoRunning(false);
      return;
    }

    let currentIndex = 0;
    const demoStroke: Point[] = [strokePoints[0]];
    userStrokesRef.current = [demoStroke];

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < strokePoints.length) {
        demoStroke.push(strokePoints[currentIndex]);
        setDemoProgress(Math.round((currentIndex / strokePoints.length) * 100));

        // Check if any checkpoint was reached in demo
        letter.waypoints.forEach((wp, wpIdx) => {
          const ptPix = toPixels(wp, w, h);
          const curr = strokePoints[currentIndex];
          if (Math.hypot(ptPix.x - curr.x, ptPix.y - curr.y) < 20) {
            visitedCheckpointsRef.current.add(wpIdx);
            sound.playCheckpoint(wpIdx);
            emitSparkles(wp.x, wp.y, 8);
          }
        });
      } else {
        clearInterval(interval);
        setIsDemoRunning(false);
        sound.speak('Agora é a sua vez de desenhar!');
      }
    }, 45);
  };

  return (
    <div className={`flex flex-col gap-3 w-full max-w-4xl mx-auto ${handPreference === 'left' ? 'flex-row-reverse' : ''}`}>
      {/* Top action / feedback bar or Lightning Challenge HUD */}
      {isChallengeMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 p-3 sm:p-3.5 rounded-2xl shadow-sm text-slate-950 border-2 border-amber-400 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs border border-amber-300 animate-bounce">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base text-slate-900">
                  Desafio Relâmpago: Letra {letter.displayChar}
                </span>
                <span className="px-2 py-0.5 bg-amber-500/30 text-amber-950 text-[11px] font-bold rounded-full">
                  Nível {challengeLevel} · {getChallengeParams(challengeLevel).title}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {isChallengeRunning
                  ? 'O tempo está correndo! Desenhe rápido e com capricho!'
                  : 'Toque na pauta para iniciar o cronômetro!'}
              </p>
            </div>
          </div>

          {/* Timer, Streak and Exit */}
          <div className="flex items-center gap-2.5">
            {/* Streak */}
            <div className="flex items-center gap-1 bg-white/70 px-2.5 py-1.5 rounded-xl font-mono font-bold text-xs text-amber-950 shadow-xs border border-amber-200">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>x{challengeStreak}</span>
            </div>

            {/* Timer countdown pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm shadow-xs transition-colors ${
                challengeTimeLeft <= 4
                  ? 'bg-rose-600 text-white animate-pulse'
                  : challengeTimeLeft <= 7
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-900 border border-amber-200'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>{challengeTimeLeft.toFixed(1)}s</span>
            </div>

            {/* Exit button */}
            <button
              onClick={handleExitChallenge}
              className="px-3 py-1.5 bg-white/80 hover:bg-white text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-amber-200"
            >
              Sair
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner">
              {letter.exampleIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-2xl text-slate-900">
                  {letter.displayChar}
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  como em <span className="text-blue-600 font-bold">{letter.exampleWord}</span>
                </span>
                <button
                  onClick={() => sound.speak(`${letter.displayChar}. ${letter.name}. ${letter.exampleWord}!`)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Ouvir som da letra"
                  aria-label="Ouvir som da letra"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 max-w-md line-clamp-1">{letter.instruction}</p>
            </div>
          </div>

          {/* Action buttons: Dicas, Tutorial, Desafio Relâmpago, Progress */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsTipsOpen(true);
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer transform hover:scale-102"
              title="Abrir dicas de traçado da letra"
            >
              <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-300" />
              <span>Dicas</span>
            </button>

            <button
              onClick={() => {
                setIsTutorialActive(true);
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer transform hover:scale-102"
              title="Abrir Tutorial Interativo passo a passo"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Tutorial Interativo</span>
            </button>

            <button
              onClick={handleStartChallenge}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer transform hover:scale-102"
              title="Iniciar Desafio Relâmpago contra o tempo"
            >
              <Zap className="w-4 h-4 text-amber-950 fill-amber-300" />
              <span>Desafio Relâmpago</span>
            </button>

            <div className="flex items-center gap-2 min-w-[120px] pl-2 border-l border-slate-200">
              <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 font-mono tabular-nums">{progress}%</span>
              {progress === 100 && (
                <span className="text-emerald-600 animate-bounce">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Slate / Pauta Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[380px] sm:h-[440px] bg-amber-50/20 rounded-3xl border-4 border-amber-200/80 shadow-lg overflow-hidden select-none touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block"
        />

        {/* Guided Animated Tutorial Mode Overlay */}
        <TutorialOverlay
          letter={letter}
          isActive={isTutorialActive}
          onFinishTutorial={() => {
            setIsTutorialActive(false);
            handleClear();
          }}
          onClose={() => setIsTutorialActive(false)}
          width={containerSize.width}
          height={containerSize.height}
        />

        {/* Start Point Pulsing Callout or Lightning Challenge Start Prompt */}
        {progress === 0 && !isDemoRunning && letter.waypoints.length > 0 && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-12 animate-bounce flex flex-col items-center"
            style={{
              left: `${letter.waypoints[0].x}%`,
              top: `${letter.waypoints[0].y}%`,
            }}
          >
            <div className={`font-display font-bold text-xs px-2.5 py-1 rounded-full shadow-md whitespace-nowrap flex items-center gap-1 ${
              isChallengeMode
                ? 'bg-amber-500 text-slate-950 animate-pulse ring-2 ring-amber-300'
                : 'bg-amber-400 text-slate-900'
            }`}>
              <span>{isChallengeMode ? '⚡ Toque para iniciar o tempo!' : 'Comece no 1!'}</span>
              <Sparkles className="w-3 h-3 text-amber-900" />
            </div>
            <div className={`w-2 h-2 rotate-45 transform -translate-y-1 ${
              isChallengeMode ? 'bg-amber-500' : 'bg-amber-400'
            }`}></div>
          </div>
        )}

        {/* Demo status overlay */}
        {isDemoRunning && (
          <div className="absolute top-3 left-3 bg-blue-600/90 text-white font-medium text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5 animate-pulse" />
            <span>Lápis Mágico demonstrando o traço... ({demoProgress}%)</span>
          </div>
        )}
      </div>

      {/* Toolbox & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
        {/* Colors */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Tinta:</span>
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setSelectedColor(c.hex);
                sound.playClick();
              }}
              title={c.name}
              className={`w-7 h-7 rounded-full ${c.bg} transition-all duration-150 cursor-pointer ${
                selectedColor === c.hex ? 'ring-3 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLineWidth(10)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 10 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fino
          </button>
          <button
            onClick={() => setLineWidth(14)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setLineWidth(18)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 18 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grosso
          </button>
        </div>

        {/* Action Buttons & Tutorial Auto Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoTutorial}
              onChange={(e) => {
                setAutoTutorial(e.target.checked);
                sound.playClick();
              }}
              className="rounded text-blue-600 focus:ring-blue-400 cursor-pointer"
            />
            <span>Tutorial ao mudar letra</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsTutorialActive(true);
                sound.playClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
              title="Abrir Tutorial Guiado"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Ver Tutorial</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={userStrokesRef.current.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              title="Desfazer último traço"
            >
              Desfazer
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Apagar e tentar de novo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Tips Panel */}
      <LetterTipsPanel
        letter={letter}
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        onOpenTutorial={() => {
          setIsTipsOpen(false);
          setIsTutorialActive(true);
        }}
      />

      {/* Lightning Challenge Modal */}
      <LightningChallengeModal
        status={challengeModalStatus}
        level={challengeLevel}
        streak={challengeStreak}
        timeSpent={challengeElapsed}
        totalTime={getChallengeParams(challengeLevel).time}
        accuracy={Math.min(
          100,
          Math.max(
            getChallengeParams(challengeLevel).minAcc,
            92 + Math.max(0, Math.round((getChallengeParams(challengeLevel).time - challengeElapsed) * 1.5))
          )
        )}
        letterChar={letter.displayChar}
        onRetry={handleRetryChallenge}
        onNextLetter={handleNextChallengeLetter}
        onClose={() => setChallengeModalStatus(null)}
      />
    </div>
  );
};
