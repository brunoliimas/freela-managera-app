'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    FolderKanban,
    CreditCard,
    FileText,
    MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarEvent } from '@/types/calendario';
import { formatCurrency, formatDate } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
    projeto: 'Projeto',
    pagamento: 'Pagamento',
    orcamento: 'Orçamento',
    solicitacao: 'Solicitação',
};

const typeIcons: Record<string, typeof FolderKanban> = {
    projeto: FolderKanban,
    pagamento: CreditCard,
    orcamento: FileText,
    solicitacao: MessageSquare,
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    PAUSADO: 'Pausado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
    AGUARDANDO: 'Aguardando',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    EXPIRADO: 'Expirado',
    NOVA: 'Nova',
    ANALISANDO: 'Analisando',
    ORCAMENTO_ENVIADO: 'Orçamento Enviado',
    ARQUIVADA: 'Arquivada',
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarioPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [filters, setFilters] = useState({
        projeto: true,
        pagamento: true,
        orcamento: true,
        solicitacao: true,
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0, 23, 59, 59);

            const response = await api.get('/calendario/eventos', {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                },
            });
            setEvents(response.data);
        } catch {
            toast.error('Erro ao carregar eventos do calendário');
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const toggleFilter = (type: keyof typeof filters) => {
        setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
    };

    // Calendar grid calculation
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    const filteredEvents = events.filter((e) => filters[e.type]);

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(year, month, day).toDateString();
        return filteredEvents.filter((e) => new Date(e.date).toDateString() === dateStr);
    };

    const selectedEvents = selectedDate
        ? filteredEvents.filter(
              (e) => new Date(e.date).toDateString() === selectedDate.toDateString()
          )
        : [];

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isSelected = (day: number) =>
        selectedDate &&
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear();

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-[500px] lg:col-span-2" />
                    <Skeleton className="h-[500px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Calendário</h1>
                <div className="flex gap-2">
                    {(Object.keys(filters) as Array<keyof typeof filters>).map((type) => (
                        <Button
                            key={type}
                            variant={filters[type] ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleFilter(type)}
                            className="text-xs"
                        >
                            {typeLabels[type]}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">
                                {MONTH_NAMES[month]} {year}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={goToday}>
                                Hoje
                            </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-slate-500 py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                if (day === null) {
                                    return <div key={`empty-${idx}`} className="h-24" />;
                                }
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(new Date(year, month, day))}
                                        className={`h-24 p-1 border rounded-lg text-left transition-colors hover:bg-slate-50 ${
                                            isSelected(day)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                                isToday(day)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                            {day}
                                        </span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {dayEvents.slice(0, 3).map((e) => (
                                                <div
                                                    key={e.id}
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: e.color }}
                                                    title={e.title}
                                                />
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <span className="text-xs text-slate-400">
                                                    +{dayEvents.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Events sidebar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {selectedDate
                                ? `Eventos - ${formatDate(selectedDate)}`
                                : 'Selecione um dia'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedDate ? (
                            <p className="text-sm text-slate-500">
                                Clique em um dia no calendário para ver os eventos.
                            </p>
                        ) : selectedEvents.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Nenhum evento neste dia.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {selectedEvents.map((event) => {
                                    const Icon = typeIcons[event.type];
                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                                        >
                                            <div
                                                className="mt-0.5 p-1.5 rounded"
                                                style={{ backgroundColor: `${event.color}20` }}
                                            >
                                                <Icon
                                                    className="h-4 w-4"
                                                    style={{ color: event.color }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {event.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {typeLabels[event.type]}
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {statusLabels[event.status] || event.status}
                                                    </Badge>
                                                </div>
                                                {event.meta?.value != null && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {formatCurrency(Number(event.meta.value))}
                                                    </p>
                                                )}
                                                {event.meta?.clienteName != null && (
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {String(event.meta.clienteName)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
