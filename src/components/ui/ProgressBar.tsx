import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0 to 100
    color?: string; // Hex color or Tailwind class
    label?: string;
    showValue?: boolean;
}

export function ProgressBar({
    progress,
    color = "#00F0FF", // Neon Cyan default
    label,
    showValue = true
}: ProgressBarProps) {
    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-sm">
                {label && <span className="text-gray-400 font-medium">{label}</span>}
                {showValue && <span className="text-white font-bold">{progress}%</span>}
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full relative"
                    style={{ backgroundColor: color }}
                >
                    <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </motion.div>
            </div>
        </div>
    );
}
