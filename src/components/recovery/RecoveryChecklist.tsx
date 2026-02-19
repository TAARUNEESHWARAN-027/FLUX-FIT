import { GlassCard } from '@/components/ui/GlassCard';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProtocolConfig {
    category: string;
    items: string[];
    color: string;
}

const protocols: ProtocolConfig[] = [
    {
        category: 'Supplements',
        items: ['Creatine (5g)', 'Magnesium', 'Omega-3', 'Whey Protein', 'Zinc'],
        color: 'text-neon-cyan'
    },
    {
        category: 'Active Recovery',
        items: ['Stretching (15m)', 'Foam Rolling', 'Cold Shower / Bath', 'Meditation (10m)'],
        color: 'text-neon-teal'
    }
];

export function RecoveryChecklist() {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleItem = (item: string) => {
        const newSet = new Set(checkedItems);
        if (newSet.has(item)) {
            newSet.delete(item);
        } else {
            newSet.add(item);
        }
        setCheckedItems(newSet);
    };

    return (
        <GlassCard>
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-neon-teal" />
                Recovery Protocols
            </h3>

            <div className="space-y-6">
                {protocols.map((section) => (
                    <div key={section.category}>
                        <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-3 opacity-80", section.color)}>
                            {section.category}
                        </h4>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => toggleItem(item)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                        checkedItems.has(item)
                                            ? "bg-neon-teal border-neon-teal text-black"
                                            : "border-gray-600 group-hover:border-neon-teal/50"
                                    )}>
                                        {checkedItems.has(item) && <CheckCircle2 className="w-4 h-4" />}
                                    </div>
                                    <span className={cn(
                                        "text-sm transition-colors",
                                        checkedItems.has(item) ? "text-white line-through opacity-50" : "text-gray-300"
                                    )}>
                                        {item}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
