'use client';

import React from 'react';

interface StatMetricProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    iconBg: string;
}

/**
 * A reusable card for displaying simple numerical metrics with an icon.
 */
export function StatMetric({ icon, value, label, iconBg }: StatMetricProps) {
    return (
        <div className="h-full w-full flex flex-col justify-between group">
            <div className="flex justify-between items-start">
                <p className="font-arimo text-[14px] text-gray-500 font-medium group-hover:text-[#0052CC] transition-colors">
                    {label}
                </p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
            </div>
            <h3 className="font-arimo text-[28px] text-gray-900 leading-none font-bold mt-auto">
                {value}
            </h3>
        </div>
    );
}
