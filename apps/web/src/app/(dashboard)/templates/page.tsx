'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LayoutTemplate, Plus, MoreHorizontal, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { maskCurrency, unmaskCurrency } from '@/lib/masks';

const TYPE_LABELS: Record<string, string> = {
    PROPOSTA: 'Proposta',
    CONTRATO: 'Contrato',
    RECIBO: 'Recibo',
};

const TYPE_COLORS: Record<string, string> = {
    PROPOSTA: 'bg-blue-100 text-blue-700',
    CONTRATO: 'bg-purple-100 text-purple-700',
    RECIBO: 'bg-green-100 text-green-700',
};

interface Template {
    id: string;
    name: string;
    type: string;
    content: string;
    value: number | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterActive, setFilterActive] = useState('all');

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [form, setForm] = useState({
        name: '',
        type: '',
        content: '',
        value: '',
    });

    // Preview
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filterType && filterType !== 'all') params.type = filterType;
            if (filterActive && filterActive !== 'all') params.active = filterActive;

            const res = await api.get('/templates', { params });
            setTemplates(res.data);
        } catch (error) {
            if ((error as { response?: { status?: number } })?.response?.status === 403) {
                toast.error('Templates requer plano PRO ou superior');
            } else {
                toast.error('Erro ao carregar templates');
            }
        } finally {
            setLoading(false);
        }
    }, [filterType, filterActive]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                type: form.type,
                content: form.content,
                value: form.value ? unmaskCurrency(form.value) : null,
            };

            if (editing) {
                await api.put(`/templates/${editing.id}`, payload);
                toast.success('Template atualizado');
            } else {
                await api.post('/templates', payload);
                toast.success('Template criado');
            }
            setDialogOpen(false);
            setEditing(null);
            fetchTemplates();
        } catch {
            toast.error('Erro ao salvar template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;
        try {
            await api.delete(`/templates/${id}`);
            toast.success('Template excluído');
            fetchTemplates();
        } catch {
            toast.error('Erro ao excluir template');
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await api.post(`/templates/${id}/duplicate`);
            toast.success('Template duplicado');
            fetchTemplates();
        } catch {
            toast.error('Erro ao duplicar template');
        }
    };

    const handleToggleActive = async (template: Template) => {
        try {
            await api.put(`/templates/${template.id}`, { active: !template.active });
            toast.success(template.active ? 'Template desativado' : 'Template ativado');
            fetchTemplates();
        } catch {
            toast.error('Erro ao atualizar template');
        }
    };

    const openNewDialog = () => {
        setEditing(null);
        setForm({ name: '', type: '', content: '', value: '' });
        setDialogOpen(true);
    };

    const openEditDialog = (t: Template) => {
        setEditing(t);
        setForm({
            name: t.name,
            type: t.type,
            content: t.content,
            value: t.value ? maskCurrency(String(Math.round(Number(t.value) * 100))) : '',
        });
        setDialogOpen(true);
    };

    const stripHtml = (html: string) => {
        const div = typeof document !== 'undefined' ? document.createElement('div') : null;
        if (!div) return html.replace(/<[^>]*>/g, '');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Templates</h1>
                    <p className="text-muted-foreground">Modelos reutilizáveis para propostas, contratos e recibos</p>
                </div>
                <Button onClick={openNewDialog}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Template
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="PROPOSTA">Proposta</SelectItem>
                        <SelectItem value="CONTRATO">Contrato</SelectItem>
                        <SelectItem value="RECIBO">Recibo</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterActive} onValueChange={setFilterActive}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Ativos</SelectItem>
                        <SelectItem value="false">Inativos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12">
                    <LayoutTemplate className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-muted-foreground">Nenhum template encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro template para agilizar a criação de orçamentos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <Card key={t.id} className={`relative ${!t.active ? 'opacity-60' : ''}`}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{t.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge className={TYPE_COLORS[t.type] || ''} variant="secondary">
                                                {TYPE_LABELS[t.type] || t.type}
                                            </Badge>
                                            {!t.active && (
                                                <Badge variant="outline" className="text-slate-500">Inativo</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(t)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicate(t.id)}>
                                                <Copy className="h-4 w-4 mr-2" /> Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleActive(t)}>
                                                {t.active ? (
                                                    <><EyeOff className="h-4 w-4 mr-2" /> Desativar</>
                                                ) : (
                                                    <><Eye className="h-4 w-4 mr-2" /> Ativar</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                    {stripHtml(t.content)}
                                </p>

                                <div className="flex items-center justify-between text-sm">
                                    {t.value ? (
                                        <span className="font-medium text-green-600">{formatCurrency(Number(t.value))}</span>
                                    ) : (
                                        <span className="text-muted-foreground">Sem valor padrão</span>
                                    )}
                                    <span className="text-muted-foreground">{formatDate(t.updatedAt)}</span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-3"
                                    onClick={() => setPreviewTemplate(t)}
                                >
                                    Visualizar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Nome *</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Ex: Proposta de Desenvolvimento Web"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo *</Label>
                                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROPOSTA">Proposta</SelectItem>
                                        <SelectItem value="CONTRATO">Contrato</SelectItem>
                                        <SelectItem value="RECIBO">Recibo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Valor padrão (opcional)</Label>
                                <Input
                                    value={form.value}
                                    onChange={e => {
                                        const masked = maskCurrency(e.target.value);
                                        setForm({ ...form, value: masked });
                                    }}
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Conteúdo *</Label>
                            <RichTextEditor
                                value={form.content}
                                onChange={v => setForm({ ...form, content: v })}
                                placeholder="Escreva o conteúdo do template..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!form.name || !form.type || !form.content}
                        >
                            {editing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {previewTemplate && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{previewTemplate.name}</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center gap-2 mb-4">
                                <Badge className={TYPE_COLORS[previewTemplate.type] || ''} variant="secondary">
                                    {TYPE_LABELS[previewTemplate.type] || previewTemplate.type}
                                </Badge>
                                {previewTemplate.value && (
                                    <span className="text-sm font-medium text-green-600">
                                        {formatCurrency(Number(previewTemplate.value))}
                                    </span>
                                )}
                            </div>
                            <div className="border rounded-lg p-4">
                                <RichTextDisplay content={previewTemplate.content} />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
