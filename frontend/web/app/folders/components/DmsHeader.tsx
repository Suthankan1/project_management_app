'use client';

import { Upload } from 'lucide-react';

interface DmsHeaderProps {
    title: string;
    isTrashMode: boolean;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DmsHeader({ title, isTrashMode, onUpload }: DmsHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-cu-border bg-cu-bg">
            <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-cu-text-secondary">Knowledge</p>
                <h1 className="text-[20px] font-semibold text-cu-text-primary">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
                {!isTrashMode && (
                    <label className="inline-flex items-center gap-2 bg-cu-primary hover:bg-cu-primary-hover text-white px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors">
                        <Upload size={16} />
                        Upload
                        <input type="file" className="hidden" onChange={onUpload} />
                    </label>
                )}
            </div>
        </div>
    );
}
