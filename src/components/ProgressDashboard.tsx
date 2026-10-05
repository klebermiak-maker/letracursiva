import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';
import { DailyProgress, UserProgress } from '../types/game';
import { sound } from '../utils/audio';
import {
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  ChevronRight,
  Info,
} from 'lucide-react';

interface ProgressDashboardProps {
  weeklyData: DailyProgress[];
  completedLetters: Record<string, { stars: number; attempts: number; bestScore: number }>;
  studentName: string;
  totalStars: number;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  weeklyData,
  completedLetters,
  studentName,
  totalStars,
}) => {
  const [chartView, setChartView] = useState<'combined' | 'letters' | 'accuracy'>('combined');

  // Calculate weekly metrics
  const totalLettersThisWeek = weeklyData.reduce((acc, curr) => acc + curr.letrasCompletadas, 0);
  const daysWithActivity = weeklyData.filter((d) => d.letrasCompletadas > 0);
  const avgAccuracyThisWeek =
    daysWithActivity.length > 0
      ? Math.round(
          daysWithActivity.reduce((acc, curr) => acc + curr.precisaoMedia, 0) /
            daysWithActivity.length
        )
      : 0;

  const bestDay = weeklyData.reduce(
    (best, curr) => (curr.letrasCompletadas > best.letrasCompletadas ? curr : best),
    weeklyData[0]
  );

  // Custom child-friendly tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      const dayData = weeklyData.find((d) => d.dia === label);
      return (
        <div className="bg-white p-3.5 rounded-2xl shadow-xl border-2 border-blue-100 text-xs text-slate-700 min-w-[180px]">
          <p className="font-display font-bold text-sm text-slate-900 mb-1.5 flex items-center gap-1.5">
            <span>📅</span>
            <span>{dayData?.nomeCompleto || label}</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-blue-600 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Letras concluídas:
              </span>
              <strong className="font-mono text-sm tabular-nums">{dayData?.letrasCompletadas ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between text-emerald-600 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Precisão média:
              </span>
              <strong className="font-mono text-sm tabular-nums">
                {dayData?.precisaoMedia ? `${dayData.precisaoMedia}%` : '0%'}
              </strong>
            </div>
            <div className="flex items-center justify-between text-amber-600 font-semibold border-t border-slate-100 pt-1 mt-1">
              <span className="flex items-center gap-1">⭐ Estrelas ganhas:</span>
              <strong className="font-mono text-sm tabular-nums">{dayData?.estrelas ?? 0}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Letter accuracy mastery pills
  const completedList = Object.entries(completedLetters);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-6 h-6 text-amber-300" />
            <h2 className="font-display font-bold text-2xl">
              Painel de Progresso & Precisão
            </h2>
          </div>
          <p className="text-sm text-blue-100 max-w-xl">
            Acompanhe aqui o desenvolvimento caligráfico de <strong className="text-white">{studentName}</strong>,
            com o número de letras praticadas e o capricho da escrita cursiva ao longo dos dias da semana!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20">
          <Calendar className="w-5 h-5 text-amber-300" />
          <div>
            <span className="text-[11px] text-blue-200 block font-medium">Esta Semana</span>
            <span className="font-display font-bold text-sm text-white">7 dias monitorados</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Letras na Semana</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-3xl text-slate-900 font-mono tabular-nums">
              {totalLettersThisWeek}
            </span>
            <span className="text-xs font-medium text-slate-500">letras</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">
            {totalLettersThisWeek > 0 ? '✓ Atividade constante' : 'Comece a treinar!'}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Precisão Média</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-3xl text-emerald-600 font-mono tabular-nums">
              {avgAccuracyThisWeek}%
            </span>
            <span className="text-xs font-medium text-slate-500">acerto</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1">
            {avgAccuracyThisWeek >= 85 ? '🌟 Caligrafia excelente' : '🎯 Em evolução'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total de Estrelas</span>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-3xl text-amber-500 font-mono tabular-nums">
              {totalStars}
            </span>
            <span className="text-xs font-medium text-slate-500">estrelas</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1">
            Rumo ao Diploma!
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Dia Mais Ativo</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-bold text-2xl text-purple-700">
              {bestDay?.nomeCompleto?.split('-')[0] || 'Segunda'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold mt-1">
            {bestDay?.letrasCompletadas || 0} letras escritas
          </span>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        {/* Chart Header & Segmented Filter Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <span>Desempenho Semanal na Caligrafia</span>
            </h3>
            <p className="text-xs text-slate-500">
              Volume diário de letras praticadas e precisão de traçado na pauta escolar
            </p>
          </div>

          {/* Segmented button controls (interactive filter) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => {
                setChartView('combined');
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartView === 'combined'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combinado
            </button>
            <button
              onClick={() => {
                setChartView('letters');
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartView === 'letters'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Letras
            </button>
            <button
              onClick={() => {
                setChartView('accuracy');
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                chartView === 'accuracy'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Precisão (%)
            </button>
          </div>
        </div>

        {/* The Recharts Bar Chart */}
        <div className="w-full h-[320px] sm:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 20, right: 24, left: -10, bottom: 5 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600, fontFamily: 'Fredoka, sans-serif' }}
              />

              {/* Left Y Axis for Number of Letters */}
              {(chartView === 'combined' || chartView === 'letters') && (
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#2563eb', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}
                  label={{
                    value: 'Letras Concluídas',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#3b82f6',
                    fontSize: 10,
                    offset: 14,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Right Y Axis for Accuracy Percentage */}
              {(chartView === 'combined' || chartView === 'accuracy') && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#10b981', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}
                  unit="%"
                  label={{
                    value: 'Precisão Média (%)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#10b981',
                    fontSize: 10,
                    offset: 14,
                    fontWeight: 600,
                  }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
              />

              {/* Bar 1: Number of letters completed */}
              {(chartView === 'combined' || chartView === 'letters') && (
                <Bar
                  yAxisId="left"
                  dataKey="letrasCompletadas"
                  name="Letras Concluídas"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              )}

              {/* Bar 2: Average accuracy percentage */}
              {(chartView === 'combined' || chartView === 'accuracy') && (
                <Bar
                  yAxisId="right"
                  dataKey="precisaoMedia"
                  name="Precisão Média (%)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer with pedagogical insight */}
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold">
            💡
          </div>
          <div>
            <strong className="text-blue-900 block font-semibold mb-0.5">
              Dica Pedagógica do Lápis Pipoca:
            </strong>
            <p>
              Praticar de 3 a 5 letrinhas por dia ajuda a fixar a coordenação motora fina
              sem cansar a mãozinha. Observe que quanto mais você repete o movimento guiado pelo tutorial,
              maior fica a sua precisão nas curvas e laços!
            </p>
          </div>
        </div>
      </div>

      {/* Individual Letter Mastery List */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-3 flex items-center justify-between">
          <span>Letras Praticadas em Sessão</span>
          <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
            {completedList.length} letrinhas registradas
          </span>
        </h3>

        {completedList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <span className="text-3xl block mb-2">✏️</span>
            Você ainda não praticou nenhuma letrinha nesta sessão.
            <br />
            Vá até a aba <strong>Alfabeto</strong> e complete a primeira letra para ver seu histórico aqui!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {completedList.map(([char, data]) => {
              return (
                <div
                  key={char}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-display font-bold text-xl text-blue-600 shadow-xs border border-slate-100">
                      {char}
                    </span>
                    <div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <span
                            key={s}
                            className={`text-xs ${
                              s <= data.stars ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {data.attempts} {data.attempts === 1 ? 'treino' : 'treinos'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 font-mono tabular-nums block">
                      {data.bestScore}%
                    </span>
                    <span className="text-[9px] text-slate-400">melhor nota</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
