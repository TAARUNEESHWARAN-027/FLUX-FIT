import { GlassCard } from '@/components/ui/GlassCard';
import { Moon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SleepOption {
    label: string;
    hours: string;
    score: number;
    description: string;
}

const sleepOptions: SleepOption[] = [
    { label: 'Poor', hours: '< 5 hrs', score: 40, description: 'Feeling groggy and unrecovered.' },
    { label: 'Fair', hours: '6-7 hrs', score: 70, description: 'Decent, but could be better.' },
    { label: 'Good', hours: '7-8 hrs', score: 90, description: 'Solid rest, ready to train.' },
    { label: 'Optimal', hours: '9+ hrs', score: 100, description: 'Peak recovery state.' },
];

export function SleepSelector() {
    const [selected, setSelected] = useState<string>('Good');

    return (
        <GlassCard className="border-neon-violet/20">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-neon-violet/20 rounded-lg text-neon-violet">
                    <Moon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Sleep Quality</h3>
                    <p className="text-xs text-gray-400">How did you sleep last night?</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {sleepOptions.map((option) => (
                    <button
                        key={option.label}
                        onClick={() => setSelected(option.label)}
                        className={cn(
                            "p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group",
                            selected === option.label
                                ? "bg-neon-violet/20 border-neon-violet/50 shadow-[0_0_15px_rgba(143,0,255,0.2)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                                "font-bold",
                                selected === option.label ? "text-white" : "text-gray-400"
                            )}>{option.label}</span>
                            {selected === option.label && <Star className="w-4 h-4 text-neon-violet fill-neon-violet" />}
                        </div>
                        <div className="text-sm font-medium text-neon-violet mb-1">{option.hours}</div>
                        <div className="text-xs text-gray-500 leading-tight">{option.description}</div>
                    </button>
                ))}
            </div>
        </GlassCard>
    );
}
