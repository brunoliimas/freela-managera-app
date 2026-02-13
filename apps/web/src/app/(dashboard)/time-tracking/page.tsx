'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { downloadFile } from '@/lib/download';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Clock, Play, Square, Plus, MoreHorizontal, Pencil, Trash2, Download } from 'lucide-react';

interface Projeto {
    id: string;
    number: string;
    title: string;
    cliente: { name: string; company: string | null };
}

interface TimeEntry {
    id: string;
    description: string;
    startTime: string;
    endTime: string | null;
    duration: number | null;
    billable: boolean;
    hourlyRate: number | null;
    projeto: { number: string; title: string; cliente: { name: string; company: string | null } };
}

function formatDuration(minutes: number | null): string {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}m`;
}

export default function TimeTrackingPage() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterProjeto, setFilterProjeto] = useState('all');

    // Timer dialog
    const [timerDialogOpen, setTimerDialogOpen] = useState(false);
    const [timerProjeto, setTimerProjeto] = useState('');
    const [timerDescription, setTimerDescription] = useState('');
    const [timerBillable, setTimerBillable] = useState(true);
    const [timerHourlyRate, setTimerHourlyRate] = useState('');

    // Manual entry dialog
    const [entryDialogOpen, setEntryDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [entryForm, setEntryForm] = useState({
        projetoId: '',
        description: '',
        startTime: '',
        endTime: '',
        billable: true,
        hourlyRate: '',
    });

    // Elapsed time for active timer
    const [elapsed, setElapsed] = useState('00:00:00');

    // Resumo
    const [resumo, setResumo] = useState({ totalHoras: 0, billableHoras: 0, totalEntries: 0 });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filterProjeto && filterProjeto !== 'all') params.projetoId = filterProjeto;

            const [entriesRes, projetosRes, activeRes, resumoRes] = await Promise.all([
                api.get('/time-entries', { params }),
                api.get('/projetos'),
                api.get('/time-entries/active'),
                api.get('/time-entries/resumo'),
            ]);

            setEntries(entriesRes.data);
            setProjetos(projetosRes.data);
            setActiveTimer(activeRes.data);
            setResumo(resumoRes.data);
        } catch {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [filterProjeto]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update elapsed time every second
    useEffect(() => {
        if (!activeTimer) {
            setElapsed('00:00:00');
            return;
        }

        const update = () => {
            const start = new Date(activeTimer.startTime).getTime();
            const diff = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [activeTimer]);

    const handleStartTimer = async () => {
        try {
            await api.post('/time-entries/start', {
                projetoId: timerProjeto,
                description: timerDescription,
                billable: timerBillable,
                hourlyRate: timerHourlyRate || undefined,
            });
            toast.success('Timer iniciado');
            setTimerDialogOpen(false);
            setTimerProjeto('');
            setTimerDescription('');
            setTimerHourlyRate('');
            fetchData();
        } catch {
            toast.error('Erro ao iniciar timer');
        }
    };

    const handleStopTimer = async () => {
        if (!activeTimer) return;
        try {
            await api.post(`/time-entries/${activeTimer.id}/stop`);
            toast.success('Timer parado');
            fetchData();
        } catch {
            toast.error('Erro ao parar timer');
        }
    };

    const handleSaveEntry = async () => {
        try {
            if (editingEntry) {
                await api.put(`/time-entries/${editingEntry.id}`, entryForm);
                toast.success('Registro atualizado');
            } else {
                await api.post('/time-entries', entryForm);
                toast.success('Registro criado');
            }
            setEntryDialogOpen(false);
            setEditingEntry(null);
            fetchData();
        } catch {
            toast.error('Erro ao salvar registro');
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        try {
            await api.delete(`/time-entries/${id}`);
            toast.success('Registro excluído');
            fetchData();
        } catch {
            toast.error('Erro ao excluir registro');
        }
    };

    const openEditDialog = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setEntryForm({
            projetoId: '',
            description: entry.description,
            startTime: new Date(entry.startTime).toISOString().slice(0, 16),
            endTime: entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : '',
            billable: entry.billable,
            hourlyRate: entry.hourlyRate?.toString() || '',
        });
        setEntryDialogOpen(true);
    };

    const openNewDialog = () => {
        setEditingEntry(null);
        setEntryForm({
            projetoId: '',
            description: '',
            startTime: new Date().toISOString().slice(0, 16),
            endTime: '',
            billable: true,
            hourlyRate: '',
        });
        setEntryDialogOpen(true);
    };

    // Resumo horas hoje
    const today = new Date().toDateString();
    const horasHoje = entries
        .filter(e => new Date(e.startTime).toDateString() === today && e.duration)
        .reduce((sum, e) => sum + (e.duration || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Time Tracking</h1>
                    <p className="text-muted-foreground">Registre e acompanhe suas horas de trabalho</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadFile('/export/time-entries', 'time-entries.csv')}>
                        <Download className="h-4 w-4 mr-2" /> Exportar CSV
                    </Button>
                    <Button variant="outline" onClick={openNewDialog}>
                        <Plus className="h-4 w-4 mr-2" /> Entrada Manual
                    </Button>
                    {activeTimer ? (
                        <Button variant="destructive" onClick={handleStopTimer}>
                            <Square className="h-4 w-4 mr-2" /> Parar {elapsed}
                        </Button>
                    ) : (
                        <Button onClick={() => setTimerDialogOpen(true)}>
                            <Play className="h-4 w-4 mr-2" /> Iniciar Timer
                        </Button>
                    )}
                </div>
            </div>

            {/* Active timer banner */}
            {activeTimer && (
                <Card className="border-green-500 bg-green-50">
                    <CardContent className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                            <div>
                                <p className="font-medium">{activeTimer.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    {activeTimer.projeto.number} - {activeTimer.projeto.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-mono font-bold text-green-700">{elapsed}</span>
                            <Button variant="destructive" size="sm" onClick={handleStopTimer}>
                                <Square className="h-4 w-4 mr-1" /> Parar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(horasHoje)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resumo.totalHoras}h</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Horas Faturáveis</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resumo.billableHoras}h</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Registros</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resumo.totalEntries}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
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
                            <TableHead>Projeto</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Fim</TableHead>
                            <TableHead>Duração</TableHead>
                            <TableHead>Faturável</TableHead>
                            <TableHead>Valor/h</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    Nenhum registro encontrado
                                </TableCell>
                            </TableRow>
                        ) : entries.map(entry => (
                            <TableRow key={entry.id}>
                                <TableCell className="font-medium">{entry.description}</TableCell>
                                <TableCell>
                                    <span className="text-sm">{entry.projeto.number} - {entry.projeto.title}</span>
                                </TableCell>
                                <TableCell className="text-sm">{formatDateTime(entry.startTime)}</TableCell>
                                <TableCell className="text-sm">
                                    {entry.endTime ? formatDateTime(entry.endTime) : (
                                        <Badge variant="outline" className="text-green-600 border-green-600">Em andamento</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono">{formatDuration(entry.duration)}</TableCell>
                                <TableCell>
                                    <Badge variant={entry.billable ? 'default' : 'secondary'}>
                                        {entry.billable ? 'Sim' : 'Não'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {entry.hourlyRate ? formatCurrency(entry.hourlyRate) : '-'}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteEntry(entry.id)}>
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

            {/* Start Timer Dialog */}
            <Dialog open={timerDialogOpen} onOpenChange={setTimerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Iniciar Timer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Projeto *</Label>
                            <Select value={timerProjeto} onValueChange={setTimerProjeto}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o projeto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projetos.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.number} - {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Descrição *</Label>
                            <Input
                                value={timerDescription}
                                onChange={e => setTimerDescription(e.target.value)}
                                placeholder="O que você está fazendo?"
                            />
                        </div>
                        <div>
                            <Label>Valor/hora (opcional)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={timerHourlyRate}
                                onChange={e => setTimerHourlyRate(e.target.value)}
                                placeholder="Ex: 150.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTimerDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleStartTimer} disabled={!timerProjeto || !timerDescription}>
                            <Play className="h-4 w-4 mr-2" /> Iniciar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Entry / Edit Dialog */}
            <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEntry ? 'Editar Registro' : 'Nova Entrada Manual'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {!editingEntry && (
                            <div>
                                <Label>Projeto *</Label>
                                <Select value={entryForm.projetoId} onValueChange={v => setEntryForm({ ...entryForm, projetoId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o projeto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projetos.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.number} - {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div>
                            <Label>Descrição *</Label>
                            <Input
                                value={entryForm.description}
                                onChange={e => setEntryForm({ ...entryForm, description: e.target.value })}
                                placeholder="O que foi feito?"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Início *</Label>
                                <Input
                                    type="datetime-local"
                                    value={entryForm.startTime}
                                    onChange={e => setEntryForm({ ...entryForm, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Fim</Label>
                                <Input
                                    type="datetime-local"
                                    value={entryForm.endTime}
                                    onChange={e => setEntryForm({ ...entryForm, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Valor/hora (opcional)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={entryForm.hourlyRate}
                                onChange={e => setEntryForm({ ...entryForm, hourlyRate: e.target.value })}
                                placeholder="Ex: 150.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEntry}>{editingEntry ? 'Salvar' : 'Criar'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
