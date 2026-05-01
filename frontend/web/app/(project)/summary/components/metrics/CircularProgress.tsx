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
                <circle cx="34" cy="34" r={radius} stroke="#F3F4F6" strokeWidth="5" fill="transparent" />
                
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
                        <motion.stop offset="0%" animate={{ stopColor: ["#0052CC", "#3B82F6", "#0052CC"] }} transition={{ repeat: Infinity, duration: 4 }} />
                        <motion.stop offset="100%" animate={{ stopColor: ["#0747A6", "#2563EB", "#0747A6"] }} transition={{ repeat: Infinity, duration: 4 }} />
                    </linearGradient>
                </defs>
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center pt-0.5">
                <span className="font-arimo text-[14px] font-bold text-[#101828] leading-none">{displayValue}%</span>
            </div>
        </div>
    );
}
