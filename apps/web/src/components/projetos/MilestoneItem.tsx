'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Milestone } from '@/types/projeto';
import { formatDate } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface MilestoneItemProps {
    milestone: Milestone;
    projetoId: string;
    onUpdate: () => void;
}

export function MilestoneItem({ milestone, projetoId, onUpdate }: MilestoneItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(milestone.title);
    const [description, setDescription] = useState(milestone.description || '');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggleComplete = async () => {
        try {
            await api.put(`/projetos/${projetoId}/milestones/${milestone.id}`, {
                completed: !milestone.completed,
            });
            toast.success(milestone.completed ? 'Milestone reaberto' : 'Milestone concluído!');
            onUpdate();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao atualizar milestone');
            } else {
                toast.error('Erro ao atualizar milestone');
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Título é obrigatório');
            return;
        }

        setIsUpdating(true);
        try {
            await api.put(`/projetos/${projetoId}/milestones/${milestone.id}`, {
                title,
                description,
            });
            toast.success('Milestone atualizado!');
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao atualizar milestone');
            } else {
                toast.error('Erro ao atualizar milestone');
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este milestone?')) return;

        try {
            await api.delete(`/projetos/${projetoId}/milestones/${milestone.id}`);
            toast.success('Milestone excluído!');
            onUpdate();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir milestone');
            } else {
                toast.error('Erro ao excluir milestone');
            }
        }
    };

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg bg-white space-y-3">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título do milestone"
                />
                <RichTextEditor
                    value={description}
                    onChange={(value) => setDescription(value)}
                    placeholder="Descrição (opcional)"
                />
                <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" disabled={isUpdating}>
                        {isUpdating ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} size="sm" variant="outline">
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${milestone.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-slate-50'
            }`}>
            <GripVertical className="h-5 w-5 text-slate-400 mt-0.5 cursor-move" />

            <Checkbox
                checked={milestone.completed}
                onCheckedChange={handleToggleComplete}
                className="mt-1"
            />

            <div className="flex-1 min-w-0">
                <p className={`font-medium ${milestone.completed ? 'line-through text-slate-500' : ''}`}>
                    {milestone.title}
                </p>
                {milestone.description && (
                    <p className="text-sm text-slate-600 mt-1">{milestone.description}</p>
                )}
                {milestone.completedAt && (
                    <p className="text-xs text-green-600 mt-2">
                        <Check className="inline h-3 w-3 mr-1" />
                        Concluído em {formatDate(milestone.completedAt)}
                    </p>
                )}
            </div>

            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}