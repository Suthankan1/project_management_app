'use client';

import React, { useState, useEffect } from 'react';
import { motion, animate } from 'framer-motion';

/**
 * A beautiful animated circular progress indicator with gradients and glow effects.
 */
export function CircularProgress({ percentage }: { percentage: number }) {
    const [displayValue, setDisplayValue] = useState(0);
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    
    useEffect(() => {
        const controls = animate(0, percentage, {
            duration: 2,
            ease: "easeOut",
            onUpdate: (v: number) => setDisplayValue(Math.round(v))
        });
        return () => controls.stop();
    }, [percentage]);

    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-[68px] h-[68px] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 68 68" className="transform -rotate-90 w-full h-full overflow-visible">
                <circle cx="34" cy="34" r={radius} stroke="var(--cu-bg-tertiary)" strokeWidth="5" fill="transparent" />
                
                {/* Glow effect layer */}
                <motion.circle
                    cx="34" cy="34" r={radius} stroke="url(#progressGradient)" strokeWidth="6" fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference, opacity: 0 }}
                    animate={{ strokeDashoffset, opacity: [0.2, 0.4, 0.2], scale: [1, 1.02, 1] }}
                    transition={{ 
                        strokeDashoffset: { duration: 2, ease: "easeOut" },
                        opacity: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                        scale: { repeat: Infinity, duration: 3, ease: "easeInOut" }
                    }}
                    strokeLinecap="round" className="opacity-40"
                />

                {/* Main progress bar */}
                <motion.circle
                    cx="34" cy="34" r={radius} stroke="url(#progressGradient)" strokeWidth="5" fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    strokeLinecap="round"
                />

                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--cu-primary-light)" />
                        <stop offset="100%" stopColor="var(--cu-primary)" />
                    </linearGradient>
                </defs>
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center pt-0.5">
                <span className="font-arimo text-[14px] font-bold text-cu-text-primary leading-none">{displayValue}%</span>
            </div>
        </div>
    );
}
