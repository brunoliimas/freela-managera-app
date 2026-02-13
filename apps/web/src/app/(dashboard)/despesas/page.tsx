'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { downloadFile } from '@/lib/download';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, Plus, MoreHorizontal, Pencil, Trash2, Download } from 'lucide-react';

const CATEGORIES = [
    { value: 'SOFTWARE', label: 'Software / Licenças' },
    { value: 'HARDWARE', label: 'Hardware / Equipamentos' },
    { value: 'TRANSPORTE', label: 'Transporte' },
    { value: 'ALIMENTACAO', label: 'Alimentação' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'EDUCACAO', label: 'Educação' },
    { value: 'ESCRITORIO', label: 'Escritório' },
    { value: 'IMPOSTOS', label: 'Impostos / Taxas' },
    { value: 'OUTROS', label: 'Outros' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

interface Projeto {
    id: string;
    number: string;
    title: string;
}

interface Despesa {
    id: string;
    description: string;
    value: number;
    date: string;
    category: string;
    receipt: string | null;
    notes: string | null;
    projeto: { number: string; title: string; cliente: { name: string; company: string | null } } | null;
}

interface ResumoDespesas {
    total: number;
    count: number;
    porCategoria: Array<{ category: string; label: string; total: number; count: number }>;
}

export default function DespesasPage() {
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [resumo, setResumo] = useState<ResumoDespesas>({ total: 0, count: 0, porCategoria: [] });
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterProjeto, setFilterProjeto] = useState('all');

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Despesa | null>(null);
    const [form, setForm] = useState({
        description: '',
        value: '',
        date: '',
        category: '',
        projetoId: '',
        notes: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filterCategory && filterCategory !== 'all') params.category = filterCategory;
            if (filterProjeto && filterProjeto !== 'all') params.projetoId = filterProjeto;

            const [despesasRes, projetosRes, resumoRes] = await Promise.all([
                api.get('/despesas', { params }),
                api.get('/projetos'),
                api.get('/despesas/resumo'),
            ]);

            setDespesas(despesasRes.data);
            setProjetos(projetosRes.data);
            setResumo(resumoRes.data);
        } catch {
            toast.error('Erro ao carregar despesas');
        } finally {
            setLoading(false);
        }
    }, [filterCategory, filterProjeto]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        try {
            if (editing) {
                await api.put(`/despesas/${editing.id}`, form);
                toast.success('Despesa atualizada');
            } else {
                await api.post('/despesas', form);
                toast.success('Despesa criada');
            }
            setDialogOpen(false);
            setEditing(null);
            fetchData();
        } catch {
            toast.error('Erro ao salvar despesa');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        try {
            await api.delete(`/despesas/${id}`);
            toast.success('Despesa excluída');
            fetchData();
        } catch {
            toast.error('Erro ao excluir despesa');
        }
    };

    const openNewDialog = () => {
        setEditing(null);
        setForm({
            description: '',
            value: '',
            date: new Date().toISOString().slice(0, 10),
            category: '',
            projetoId: '',
            notes: '',
        });
        setDialogOpen(true);
    };

    const openEditDialog = (d: Despesa) => {
        setEditing(d);
        setForm({
            description: d.description,
            value: d.value.toString(),
            date: new Date(d.date).toISOString().slice(0, 10),
            category: d.category,
            projetoId: '',
            notes: d.notes || '',
        });
        setDialogOpen(true);
    };

    // Despesas deste mês
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const despesasMes = despesas
        .filter(d => {
            const date = new Date(d.date);
            return date.getMonth() === mesAtual && date.getFullYear() === anoAtual;
        })
        .reduce((sum, d) => sum + Number(d.value), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Despesas</h1>
                    <p className="text-muted-foreground">Controle e categorize seus gastos</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadFile('/export/despesas', 'despesas.csv')}>
                        <Download className="h-4 w-4 mr-2" /> Exportar CSV
                    </Button>
                    <Button onClick={openNewDialog}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Despesa
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total (geral)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(resumo.total)}</div>
                        <p className="text-xs text-muted-foreground">{resumo.count} despesas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Este mês</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(despesasMes)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Top Categoria</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {resumo.porCategoria.length > 0 ? (
                            <>
                                <div className="text-2xl font-bold">{formatCurrency(resumo.porCategoria[0].total)}</div>
                                <p className="text-xs text-muted-foreground">{resumo.porCategoria[0].label}</p>
                            </>
                        ) : (
                            <div className="text-2xl font-bold">-</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterProjeto} onValueChange={setFilterProjeto}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Filtrar por projeto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os projetos</SelectItem>
                        {projetos.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.number} - {p.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : despesas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhuma despesa encontrada
                                </TableCell>
                            </TableRow>
                        ) : despesas.map(d => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.description}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{CATEGORY_MAP[d.category] || d.category}</Badge>
                                </TableCell>
                                <TableCell>
                                    {d.projeto ? `${d.projeto.number} - ${d.projeto.title}` : (
                                        <span className="text-muted-foreground">Sem projeto</span>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{formatCurrency(d.value)}</TableCell>
                                <TableCell>{formatDate(d.date)}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(d)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(d.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Descrição *</Label>
                            <Input
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Ex: Licença Figma"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Valor *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={form.value}
                                    onChange={e => setForm({ ...form, value: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label>Data *</Label>
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Categoria *</Label>
                            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Projeto (opcional)</Label>
                            <Select value={form.projetoId || 'none'} onValueChange={v => setForm({ ...form, projetoId: v === 'none' ? '' : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sem projeto" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem projeto</SelectItem>
                                    {projetos.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.number} - {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Observações</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notas adicionais..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            disabled={!form.description || !form.value || !form.date || !form.category}
                        >
                            {editing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
