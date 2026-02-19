import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'neon';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: ReactNode;
}

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    children,
    ...props
}: ButtonProps) {

    const variants = {
        primary: "bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10",
        secondary: "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700",
        ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white",
        neon: "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5",
        lg: "px-8 py-3 text-lg",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : null}
            {children}
        </motion.button>
    );
}
