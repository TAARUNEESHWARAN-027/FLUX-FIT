import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AIRecommendation } from '@/services/aiService';

interface NudgeToastProps {
    nudge: AIRecommendation | null;
    onDismiss?: (id: string) => void;
    autoHideMs?: number;
}

export function NudgeToast({ nudge, onDismiss, autoHideMs = 8000 }: NudgeToastProps) {
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (nudge) {
            setVisible(true);
            if (autoHideMs > 0) {
                const timer = setTimeout(() => setVisible(false), autoHideMs);
                return () => clearTimeout(timer);
            }
        }
    }, [nudge, autoHideMs]);

    const handleDismiss = () => {
        setVisible(false);
        if (nudge && onDismiss) onDismiss(nudge.id);
    };

    const handleAction = () => {
        if (nudge?.actionRoute) {
            navigate(nudge.actionRoute);
        }
        handleDismiss();
    };

    return (
        <AnimatePresence>
            {visible && nudge && (
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm"
                >
                    <div className="glass-card border border-neon-violet/20 bg-gray-900/90 backdrop-blur-xl rounded-xl p-4 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="text-lg mt-0.5">⚡</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm">{nudge.title}</p>
                                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{nudge.message}</p>
                                {nudge.actionLabel && (
                                    <button
                                        onClick={handleAction}
                                        className="flex items-center gap-1 mt-2 text-xs font-medium text-neon-cyan hover:text-neon-teal transition-colors"
                                    >
                                        {nudge.actionLabel}
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-600 hover:text-gray-400 transition-colors p-0.5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
