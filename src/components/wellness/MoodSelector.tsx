import { useState } from 'react';
import { motion } from 'framer-motion';

interface MoodSelectorProps {
    value?: number;
    energyLevel?: number;
    onMoodChange: (mood: number) => void;
    onEnergyChange?: (energy: number) => void;
    selectedTags?: string[];
    availableTags?: string[];
    onTagsChange?: (tags: string[]) => void;
    compact?: boolean;
}

const MOODS = [
    { score: 1, emoji: '😢', label: 'Awful', color: '#FF4D6A' },
    { score: 2, emoji: '😕', label: 'Bad', color: '#FF8C00' },
    { score: 3, emoji: '😐', label: 'Okay', color: '#FFB800' },
    { score: 4, emoji: '🙂', label: 'Good', color: '#00F0FF' },
    { score: 5, emoji: '😊', label: 'Great', color: '#00FF9D' },
];

const ENERGY_LEVELS = [
    { score: 1, label: 'Drained' },
    { score: 2, label: 'Low' },
    { score: 3, label: 'Moderate' },
    { score: 4, label: 'Energized' },
    { score: 5, label: 'Peak' },
];

export function MoodSelector({
    value, energyLevel, onMoodChange, onEnergyChange,
    selectedTags = [], availableTags = [], onTagsChange,
    compact = false,
}: MoodSelectorProps) {
    const [hoveredMood, setHoveredMood] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            {/* Mood selection */}
            <div>
                {!compact && <p className="text-sm text-gray-400 mb-2">How are you feeling?</p>}
                <div className="flex items-center gap-3 justify-center">
                    {MOODS.map((mood) => {
                        const isSelected = value === mood.score;
                        const isHovered = hoveredMood === mood.score;
                        return (
                            <motion.button
                                key={mood.score}
                                onClick={() => onMoodChange(mood.score)}
                                onMouseEnter={() => setHoveredMood(mood.score)}
                                onMouseLeave={() => setHoveredMood(null)}
                                className={`
                                    flex flex-col items-center gap-1 p-2 rounded-xl transition-colors
                                    ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                                `}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                            >
                                <span className={compact ? 'text-2xl' : 'text-3xl'}
                                    style={{ filter: isSelected ? `drop-shadow(0 0 8px ${mood.color})` : undefined }}>
                                    {mood.emoji}
                                </span>
                                {!compact && (
                                    <span className={`text-xs ${isSelected || isHovered ? 'text-white' : 'text-gray-500'}`}
                                        style={{ color: isSelected ? mood.color : undefined }}>
                                        {mood.label}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Energy level (optional) */}
            {onEnergyChange && !compact && (
                <div>
                    <p className="text-sm text-gray-400 mb-2">Energy level</p>
                    <div className="flex items-center gap-2">
                        {ENERGY_LEVELS.map((e) => (
                            <button
                                key={e.score}
                                onClick={() => onEnergyChange(e.score)}
                                className={`
                                    flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all
                                    ${energyLevel === e.score
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                        : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'}
                                `}
                            >
                                {e.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags (optional) */}
            {onTagsChange && availableTags.length > 0 && !compact && (
                <div>
                    <p className="text-sm text-gray-400 mb-2">What's on your mind?</p>
                    <div className="flex flex-wrap gap-1.5">
                        {availableTags.map(tag => {
                            const selected = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        onTagsChange(
                                            selected
                                                ? selectedTags.filter(t => t !== tag)
                                                : [...selectedTags, tag]
                                        );
                                    }}
                                    className={`
                                        px-2.5 py-1 rounded-full text-xs transition-all
                                        ${selected
                                            ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/30'
                                            : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'}
                                    `}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
