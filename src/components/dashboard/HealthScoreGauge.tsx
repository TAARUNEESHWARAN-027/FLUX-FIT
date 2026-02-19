import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { HealthScoreBreakdown } from '@/hooks/useHealthScore';

interface HealthScoreGaugeProps {
    score: HealthScoreBreakdown | null;
    trend?: 'up' | 'down' | 'stable';
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 100, md: 140, lg: 180 };
const strokeMap = { sm: 6, md: 8, lg: 10 };

function getScoreColor(score: number): string {
    if (score >= 80) return '#00FF9D';  // neon-teal
    if (score >= 60) return '#00F0FF';  // neon-cyan
    if (score >= 40) return '#FFB800';  // amber
    return '#FF4D6A';                    // red
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score > 0) return 'Needs Work';
    return '—';
}

export function HealthScoreGauge({ score, trend = 'stable', size = 'md' }: HealthScoreGaugeProps) {
    const dim = sizeMap[size];
    const stroke = strokeMap[size];
    const radius = (dim - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const composite = score?.composite || 0;
    const offset = circumference - (composite / 100) * circumference;
    const color = getScoreColor(composite);

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: dim, height: dim }}>
                <svg className="transform -rotate-90" width={dim} height={dim}>
                    {/* Background circle */}
                    <circle
                        cx={dim / 2} cy={dim / 2} r={radius}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={stroke} fill="transparent"
                    />
                    {/* Score arc */}
                    <motion.circle
                        cx={dim / 2} cy={dim / 2} r={radius}
                        stroke={color}
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className="font-bold"
                        style={{ fontSize: size === 'lg' ? '2.5rem' : size === 'md' ? '2rem' : '1.5rem', color }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {composite}
                    </motion.span>
                    {size !== 'sm' && (
                        <span className="text-xs text-gray-400 -mt-1">{getScoreLabel(composite)}</span>
                    )}
                </div>
            </div>
            {/* Trend indicator */}
            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</span>
            </div>
            {/* Domain breakdown */}
            {score && size !== 'sm' && (
                <div className="grid grid-cols-5 gap-1 mt-2 w-full max-w-[200px]">
                    {([
                        { label: '💪', value: score.workout, name: 'Workout' },
                        { label: '🥗', value: score.nutrition, name: 'Nutrition' },
                        { label: '😴', value: score.sleep, name: 'Sleep' },
                        { label: '😊', value: score.mood, name: 'Mood' },
                        { label: '🧊', value: score.recovery, name: 'Recovery' },
                    ] as const).map(d => (
                        <div key={d.name} className="flex flex-col items-center gap-0.5" title={`${d.name}: ${d.value}`}>
                            <span className="text-sm">{d.label}</span>
                            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: getScoreColor(d.value) }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${d.value}%` }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
