import { motion } from 'framer-motion';

interface MacroRingProps {
    label: string;
    current: number;
    target: number;
    color: string;
    unit?: string;
}

export function MacroRing({ label, current, target, color, unit = 'g' }: MacroRingProps) {
    const percentage = Math.min(100, (current / target) * 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Background Ring */}
                <svg className="w-full h-full rotate-[-90deg]">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-white/5"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{current}</span>
                    <span className="text-[10px] text-gray-500 font-medium uppercase">of {target}{unit}</span>
                </div>
            </div>
            <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
    );
}
