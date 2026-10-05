import React, { useRef, useState, useEffect, useCallback } from 'react';
import { sound } from '../utils/audio';
import {
  RotateCcw,
  Download,
  Eraser,
  PenTool,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Maximize2,
  Volume2,
  Infinity as InfinityIcon,
  HelpCircle,
  Undo2,
} from 'lucide-react';

interface InfiniteRuledSlateProps {
  handPreference: 'right' | 'left';
  studentName: string;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export const InfiniteRuledSlate: React.FC<InfiniteRuledSlateProps> = ({
  handPreference,
  studentName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing state
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const undoneStrokesRef = useRef<Stroke[]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Settings
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb');
  const [lineWidth, setLineWidth] = useState<number>(10);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [penStyle, setPenStyle] = useState<'pen' | 'pencil' | 'chalk' | 'glow'>('pen');
  const [lineGuideType, setLineGuideType] = useState<'clean' | 'warmup' | 'alphabet'>('clean');
  const [slateOffset, setSlateOffset] = useState<number>(0); // Horizontal endless scrolling offset
  const [numRows, setNumRows] = useState<number>(4);

  // Dimensions
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 480,
  });

  const colors = [
    { name: 'Azul Escolar', hex: '#2563eb', bg: 'bg-blue-600' },
    { name: 'Grafite HB', hex: '#334155', bg: 'bg-slate-700' },
    { name: 'Roxo Mágico', hex: '#9333ea', bg: 'bg-purple-600' },
    { name: 'Verde Trevo', hex: '#16a34a', bg: 'bg-emerald-600' },
    { name: 'Dourado Estrela', hex: '#d97706', bg: 'bg-amber-500' },
    { name: 'Rosa Flor', hex: '#db2777', bg: 'bg-pink-600' },
    { name: 'Vermelho Caneta', hex: '#dc2626', bg: 'bg-red-600' },
  ];

  // Render the infinite calligraphy lines & strokes
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background: Warm ivory blackboard or classic school paper
    ctx.fillStyle = '#faf8f2';
    ctx.fillRect(0, 0, w, h);

    // Left vertical margin line (red notebook margin)
    const marginX = 64;
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, h);
    ctx.stroke();

    // 4-Line Calligraphy Sets
    const setHeight = 110;
    const topPadding = 40;

    for (let r = 0; r < numRows; r++) {
      const baseY = topPadding + r * setHeight;
      const yAscender = baseY; // Sky (Line 1)
      const yMidline = baseY + 30; // Mid (Line 2)
      const yBaseline = baseY + 70; // Baseline ground (Line 3)
      const yDescender = baseY + 100; // Underground (Line 4)

      // Colored middle zone (where standard lowercase letters live)
      ctx.fillStyle = 'rgba(224, 242, 254, 0.55)'; // light soft sky blue tint
      ctx.fillRect(marginX, yMidline, w - marginX, yBaseline - yMidline);

      // Line 1: Sky / Ascenders (dashed light blue)
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(marginX, yAscender);
      ctx.lineTo(w, yAscender);
      ctx.stroke();

      // Line 2: Midline (dashed darker blue)
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(marginX, yMidline);
      ctx.lineTo(w, yMidline);
      ctx.stroke();

      // Line 3: Ground / Baseline (SOLID firm royal blue)
      ctx.setLineDash([]);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(marginX, yBaseline);
      ctx.lineTo(w, yBaseline);
      ctx.stroke();

      // Line 4: Underground / Descenders (dashed soft coral/rose)
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(marginX, yDescender);
      ctx.lineTo(w, yDescender);
      ctx.stroke();

      // Line Set Label tag on the margin
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px Fredoka, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${r + 1}ª`, marginX - 12, yBaseline - 12);

      // Optional Faint Ghost Models for motor warmup or cursive reference
      if (lineGuideType === 'warmup') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.font = '36px "Dancing Script", "Caveat", cursive';
        ctx.textAlign = 'left';
        ctx.fillText('〰️〰️〰️   ➿➿➿   ⛰️⛰️⛰️   elelelel   mmm   aaaa', marginX + 30, yBaseline - 6);
      } else if (lineGuideType === 'alphabet') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
        ctx.font = 'bold 38px "Dancing Script", "Caveat", cursive';
        ctx.textAlign = 'left';
        if (r === 0) ctx.fillText('a   b   c   d   e   f   g   h   i   j   k   l   m', marginX + 30, yBaseline - 6);
        if (r === 1) ctx.fillText('n   o   p   q   r   s   t   u   v   w   x   y   z', marginX + 30, yBaseline - 6);
        if (r === 2) ctx.fillText('A   B   C   D   E   F   G   H   I   J   K   L   M', marginX + 30, yBaseline - 6);
        if (r === 3) ctx.fillText('N   O   P   Q   R   S   T   U   V   W   X   Y   Z', marginX + 30, yBaseline - 6);
      }
    }

    ctx.setLineDash([]);

    // Draw all user strokes
    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width;
      ctx.strokeStyle = stroke.color;

      // Glow style
      if (stroke.color === '#d97706') {
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }

      ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
      ctx.stroke();
      ctx.restore();
    });
  }, [numRows, lineGuideType]);

  // Resize canvas according to container
  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(900, rect.width);
    const h = Math.max(480, 40 + numRows * 110 + 40);

    setCanvasDimensions({ width: w, height: h });

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    render();
  }, [numRows, render]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    render();
  }, [render]);

  // Pointer drawing events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPointsRef.current = [{ x, y }];

    sound.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPointsRef.current.push({ x, y });

    // Sound tick occasionally for motor feedback
    if (currentPointsRef.current.length % 6 === 0) {
      sound.playStrokeTick();
    }

    // Direct incremental drawing for ultra-smooth responsiveness
    const ctx = canvas.getContext('2d');
    if (ctx && currentPointsRef.current.length >= 2) {
      const len = currentPointsRef.current.length;
      const p1 = currentPointsRef.current[len - 2];
      const p2 = currentPointsRef.current[len - 1];

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = isEraser ? '#faf8f2' : selectedColor;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (currentPointsRef.current.length > 1) {
      const newStroke: Stroke = {
        points: [...currentPointsRef.current],
        color: isEraser ? '#faf8f2' : selectedColor,
        width: lineWidth,
      };

      strokesRef.current.push(newStroke);
      undoneStrokesRef.current = [];
    }

    currentPointsRef.current = [];
    render();
  };

  // Undo action
  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    const popped = strokesRef.current.pop();
    if (popped) {
      undoneStrokesRef.current.push(popped);
      sound.playClick();
      render();
    }
  };

  // Clear all strokes
  const handleClearAll = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = [];
    undoneStrokesRef.current = [];
    currentPointsRef.current = [];
    sound.playCelebration();
    sound.speak('Pauta limpa para você continuar praticando!');
    render();
  };

  // Download handwriting sheet
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    sound.playCelebration();
    const link = document.createElement('a');
    link.download = `pauta-caligrafia-${studentName || 'aluno'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner explaining the mode */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-4 sm:p-5 rounded-3xl text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-inner border border-white/30">
            ♾️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Pauta Infinita de Caligrafia
              </h2>
              <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-bold text-xs rounded-full shadow-xs">
                Treino 100% Livre
              </span>
            </div>
            <p className="text-xs text-sky-100 max-w-xl">
              Escreva qualquer letra, junte sílabas, desenhe e treine curvas sem tempo, sem limites e sem notas!
              A pauta escolar tem as 4 linhas com as cores do céu, solo e terra para guiar sua mãozinha.
            </p>
          </div>
        </div>

        {/* Faint reference guides picker */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-1.5 rounded-2xl border border-white/20 text-xs">
          <span className="text-sky-200 font-semibold pl-1.5 hidden sm:inline">Guias:</span>
          <button
            onClick={() => {
              setLineGuideType('clean');
              sound.playClick();
            }}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer font-bold ${
              lineGuideType === 'clean' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
            }`}
          >
            Lousa Limpa
          </button>
          <button
            onClick={() => {
              setLineGuideType('warmup');
              sound.playClick();
            }}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer font-bold ${
              lineGuideType === 'warmup' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
            }`}
          >
            Ondinhas 〰️
          </button>
          <button
            onClick={() => {
              setLineGuideType('alphabet');
              sound.playClick();
            }}
            className={`px-3 py-1 rounded-xl transition-colors cursor-pointer font-bold ${
              lineGuideType === 'alphabet' ? 'bg-white text-blue-700 shadow-xs' : 'text-sky-100 hover:text-white'
            }`}
          >
            Alfabeto Suave
          </button>
        </div>
      </div>

      {/* Main Ruled Slate Canvas with Horizontal/Vertical Scroll */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] sm:h-[500px] bg-[#faf8f2] rounded-3xl border-4 border-amber-200/90 shadow-xl overflow-auto select-none touch-none cursor-crosshair scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-amber-50"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ width: `${canvasDimensions.width}px`, height: `${canvasDimensions.height}px` }}
          className="block"
        />

        {/* Floating helper badges */}
        <div className="absolute top-3 right-4 pointer-events-none flex items-center gap-2">
          <div className="bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full shadow-xs border border-slate-200 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Pauta Livre · Linha Azul = Chão</span>
          </div>
        </div>
      </div>

      {/* Toolbox Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
        {/* Colors */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Tinta:</span>
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setSelectedColor(c.hex);
                setIsEraser(false);
                sound.playClick();
              }}
              title={c.name}
              className={`w-7 h-7 rounded-full ${c.bg} transition-all duration-150 cursor-pointer ${
                !isEraser && selectedColor === c.hex
                  ? 'ring-3 ring-offset-2 ring-blue-500 scale-110'
                  : 'hover:scale-105'
              }`}
            />
          ))}

          {/* Eraser Tool */}
          <button
            onClick={() => {
              setIsEraser(!isEraser);
              sound.playClick();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isEraser
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Borracha para apagar traços"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Borracha</span>
          </button>
        </div>

        {/* Stroke Thickness */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setLineWidth(6)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 6 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fino
          </button>
          <button
            onClick={() => setLineWidth(10)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 10 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Médio
          </button>
          <button
            onClick={() => setLineWidth(16)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              lineWidth === 16 ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Macio
          </button>
        </div>

        {/* Pauta Rows & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Add more ruled rows */}
          <button
            onClick={() => {
              setNumRows((prev) => Math.min(8, prev + 1));
              sound.playClick();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Adicionar mais uma pauta de caligrafia"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Linhas</span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={strokesRef.current.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            title="Desfazer traço"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Desfazer</span>
          </button>

          {/* Download image */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
            title="Salvar sua folha de caligrafia"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Salvar Folha</span>
          </button>

          {/* Clear all */}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Limpar toda a lousa"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
