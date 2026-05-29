import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from '@/components/ui';

interface CustomField {
  id: number;
  name: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  options?: string[];
  value?: string | null;
}

interface CustomFieldsSectionProps {
  taskId: number;
  projectId: number;
  canEdit: boolean;
}

export default function CustomFieldsSection({ taskId, projectId, canEdit }: CustomFieldsSectionProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchFields = async () => {
      try {
        setLoading(true);
        const res = await api.get<CustomField[]>(`/api/tasks/${taskId}/custom-fields`);
        if (active) {
          setFields(res.data || []);
        }
      } catch {
        toast('Failed to load custom fields', 'error');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void fetchFields();
    return () => { active = false; };
  }, [taskId]);

  const handleUpdate = async (field: CustomField, newValue: string) => {
    if (field.value === newValue) return;

    try {
      await api.patch(`/api/tasks/${taskId}/custom-fields`, {
        customFieldId: field.id,
        value: newValue || null,
      });
      setFields((prev) =>
        prev.map((f) => (f.id === field.id ? { ...f, value: newValue } : f))
      );
      toast(`${field.name} updated`, 'success');
      window.dispatchEvent(new CustomEvent('planora:task-updated', { detail: { taskId } }));
    } catch {
      toast(`Failed to update ${field.name}`, 'error');
      const res = await api.get<CustomField[]>(`/api/tasks/${taskId}/custom-fields`);
      setFields(res.data || []);
    }
  };

  if (loading) {
    return <div className="text-xs text-cu-text-muted animate-pulse py-2">Loading custom fields...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-cu-border/60 my-4" />
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-cu-text-muted uppercase tracking-wider">Custom Fields</span>
        {canEdit && (
          <Link
            href={`/project/${projectId}/settings`}
            className="text-cu-text-muted hover:text-cu-primary transition-colors"
            title="Manage Custom Fields"
          >
            <Plus size={14} />
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {fields.map((field) => {
          const value = field.value ?? '';
          return (
            <div key={field.id} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-cu-text-muted uppercase tracking-wider">
                {field.name}
              </span>
              
              {field.fieldType === 'TEXT' && (
                <input
                  type="text"
                  value={value}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, value: val } : f))
                    );
                  }}
                  onBlur={(e) => handleUpdate(field, e.target.value)}
                  className="w-full text-sm border border-cu-border rounded-lg px-2.5 h-9 bg-cu-bg text-cu-text-primary disabled:bg-cu-bg-secondary disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cu-primary focus:border-cu-primary transition-all"
                  placeholder="Enter text..."
                />
              )}

              {field.fieldType === 'NUMBER' && (
                <input
                  type="number"
                  value={value}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, value: val } : f))
                    );
                  }}
                  onBlur={(e) => handleUpdate(field, e.target.value)}
                  className="w-full text-sm border border-cu-border rounded-lg px-2.5 h-9 bg-cu-bg text-cu-text-primary disabled:bg-cu-bg-secondary disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cu-primary focus:border-cu-primary transition-all"
                  placeholder="Enter number..."
                />
              )}

              {field.fieldType === 'DATE' && (
                <input
                  type="date"
                  value={value}
                  disabled={!canEdit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, value: val } : f))
                    );
                  }}
                  onBlur={(e) => handleUpdate(field, e.target.value)}
                  className="w-full text-sm border border-cu-border rounded-lg px-2.5 h-9 bg-cu-bg text-cu-text-primary disabled:bg-cu-bg-secondary disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cu-primary focus:border-cu-primary transition-all"
                />
              )}

              {field.fieldType === 'SELECT' && (
                <select
                  value={value}
                  disabled={!canEdit}
                  onChange={(e) => handleUpdate(field, e.target.value)}
                  className="w-full text-sm border border-cu-border rounded-lg px-2.5 h-9 bg-cu-bg text-cu-text-primary disabled:bg-cu-bg-secondary disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-cu-primary focus:border-cu-primary transition-all"
                >
                  <option value="">Select option...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
