import React, { useRef, useState, useEffect, useCallback } from 'react';
import { sound } from '../utils/audio';
import { RotateCcw, Download, Eraser, PenTool, Sparkles, Smile } from 'lucide-react';

export const FreeNotebook: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isDrawingRef = useRef(false);
  const strokesRef = useRef<{ points: { x: number; y: number }[]; color: string; width: number }[]>([]);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);

  const [currentColor, setCurrentColor] = useState<string>('#2563eb');
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);

  const stamps = ['⭐', '🐝', '🎈', '❤️', '🦋', '🌟', '🦄', '🚀', '🐾', '🌈'];

  const colors = [
    { name: 'Azul Caneta', hex: '#2563eb' },
    { name: 'Grafite', hex: '#334155' },
    { name: 'Vermelho', hex: '#dc2626' },
    { name: 'Verde', hex: '#16a34a' },
    { name: 'Roxo Mágico', hex: '#9333ea' },
    { name: 'Rosa', hex: '#db2777' },
    { name: 'Dourado', hex: '#d97706' },
  ];

  // Draw the lined school notebook paper
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Soft warm paper background
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, w, h);

    // Red left margin (standard in Brazilian school notebooks)
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.lineTo(56, h);
    ctx.stroke();

    // Ruled calligraphy line sets (each set has 4 lines)
    const setHeight = 90;
    const topMargin = 50;
    const numSets = Math.floor((h - topMargin) / setHeight);

    for (let s = 0; s < numSets; s++) {
      const baseY = topMargin + s * setHeight;
      const y1 = baseY; // Ascenders
      const y2 = baseY + 24; // Midline
      const y3 = baseY + 54; // Baseline
      const y4 = baseY + 78; // Descenders

      // Tint middle band
      ctx.fillStyle = 'rgba(219, 234, 254, 0.45)';
      ctx.fillRect(56, y2, w - 56, y3 - y2);

      // Line 1
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(56, y1);
      ctx.lineTo(w, y1);
      ctx.stroke();

      // Line 2
      ctx.strokeStyle = '#93c5fd';
      ctx.beginPath();
      ctx.moveTo(56, y2);
      ctx.lineTo(w, y2);
      ctx.stroke();

      // Line 3 - solid baseline
      ctx.setLineDash([]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(56, y3);
      ctx.lineTo(w, y3);
      ctx.stroke();

      // Line 4
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(56, y4);
      ctx.lineTo(w, y4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Render strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    // Current stroke
    if (currentPointsRef.current.length > 1) {
      ctx.strokeStyle = isEraser ? '#fdfcf7' : currentColor;
      ctx.lineWidth = isEraser ? 24 : lineWidth;
      ctx.beginPath();
      ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
      for (let i = 1; i < currentPointsRef.current.length; i++) {
        ctx.lineTo(currentPointsRef.current[i].x, currentPointsRef.current[i].y);
      }
      ctx.stroke();
    }
  }, [currentColor, isEraser, lineWidth]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    // If stamp is active, stamp emoji on canvas!
    if (selectedStamp) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedStamp, pt.x, pt.y);
        sound.playCheckpoint(1);
      }
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [pt];
    sound.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || selectedStamp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentPointsRef.current.push(pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isDrawingRef.current = false;
    if (currentPointsRef.current.length > 0) {
      strokesRef.current.push({
        points: [...currentPointsRef.current],
        color: isEraser ? '#fdfcf7' : currentColor,
        width: isEraser ? 24 : lineWidth,
      });
      currentPointsRef.current = [];
    }
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentPointsRef.current = [];
    sound.playClick();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sound.playCelebration();
    const link = document.createElement('a');
    link.download = 'meu-caderno-cursivo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-3">
      {/* Header bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Tools */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setIsEraser(false);
              setSelectedStamp(null);
              sound.playClick();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              !isEraser && !selectedStamp
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Lápis</span>
          </button>
          <button
            onClick={() => {
              setIsEraser(true);
              setSelectedStamp(null);
              sound.playClick();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              isEraser
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Borracha</span>
          </button>
        </div>

        {/* Colors */}
        {!isEraser && !selectedStamp && (
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => {
                  setCurrentColor(c.hex);
                  sound.playClick();
                }}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                  currentColor === c.hex ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                title={c.name}
              />
            ))}
          </div>
        )}

        {/* Stamps bar */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Smile className="w-3 h-3 text-amber-500" /> Carimbos:
          </span>
          {stamps.slice(0, 5).map((stk) => (
            <button
              key={stk}
              onClick={() => {
                setSelectedStamp(selectedStamp === stk ? null : stk);
                setIsEraser(false);
                sound.playClick();
              }}
              className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                selectedStamp === stk
                  ? 'bg-amber-100 ring-2 ring-amber-400 scale-115'
                  : 'bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {stk}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Folha</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Salvar Folha</span>
          </button>
        </div>
      </div>

      {/* Ruled Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[450px] sm:h-[500px] rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden select-none touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
