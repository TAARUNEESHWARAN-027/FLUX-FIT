import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { HeatmapCell } from '@/hooks/useAnalytics';

interface ActivityHeatmapProps {
    data: HeatmapCell[];
    weeks?: number;
}

const INTENSITY_COLORS = [
    'rgba(255,255,255,0.03)',  // 0: none
    'rgba(0,240,255,0.15)',    // 1: low
    'rgba(0,240,255,0.35)',    // 2: medium
    'rgba(0,240,255,0.55)',    // 3: high
    'rgba(0,255,157,0.75)',    // 4: max
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ActivityHeatmap({ data, weeks = 13 }: ActivityHeatmapProps) {
    const grid = useMemo(() => {
        const cellMap = new Map(data.map(c => [c.date, c]));
        const rows: (HeatmapCell | null)[][] = Array.from({ length: 7 }, () => []);

        const today = new Date();
        const totalDays = weeks * 7;

        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 86400000);
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0
            rows[dayOfWeek].push(cellMap.get(dateStr) || { date: dateStr, intensity: 0, activities: 0 });
        }

        return rows;
    }, [data, weeks]);

    const monthLabels = useMemo(() => {
        const labels: { label: string; col: number }[] = [];
        const today = new Date();
        const totalDays = weeks * 7;
        let lastMonth = -1;

        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(today.getTime() - i * 86400000);
            const month = d.getMonth();
            const col = Math.floor((totalDays - 1 - i) / 7);
            if (month !== lastMonth) {
                labels.push({
                    label: d.toLocaleDateString('en', { month: 'short' }),
                    col,
                });
                lastMonth = month;
            }
        }
        return labels;
    }, [weeks]);

    return (
        <div className="space-y-2">
            {/* Month labels */}
            <div className="flex gap-[3px] ml-8 text-xs text-gray-500">
                {monthLabels.map((m, i) => (
                    <span key={i} style={{ marginLeft: i === 0 ? 0 : `${(m.col - (monthLabels[i - 1]?.col || 0) - 1) * 15}px` }}>
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] text-xs text-gray-600 pr-1">
                    {DAYS.map((d, i) => (
                        <div key={d} className="h-[12px] flex items-center" style={{ visibility: i % 2 === 0 ? 'visible' : 'hidden' }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Cells */}
                <div className="flex gap-[3px]">
                    {Array.from({ length: weeks }, (_, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-[3px]">
                            {grid.map((row, dayIdx) => {
                                const cell = row[weekIdx];
                                if (!cell) return <div key={dayIdx} className="w-[12px] h-[12px]" />;
                                return (
                                    <motion.div
                                        key={dayIdx}
                                        className="w-[12px] h-[12px] rounded-[2px] cursor-default"
                                        style={{ backgroundColor: INTENSITY_COLORS[cell.intensity] }}
                                        title={`${cell.date}: ${cell.activities} activities`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: weekIdx * 0.02 + dayIdx * 0.01 }}
                                        whileHover={{
                                            scale: 1.5,
                                            boxShadow: `0 0 6px ${INTENSITY_COLORS[cell.intensity]}`,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 ml-8 text-xs text-gray-500">
                <span>Less</span>
                {INTENSITY_COLORS.map((c, i) => (
                    <div key={i} className="w-[12px] h-[12px] rounded-[2px]" style={{ backgroundColor: c }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
