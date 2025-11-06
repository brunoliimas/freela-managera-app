'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileList } from '@/components/arquivos/FileList';
import { Arquivo } from '@/types/projeto';
import { Projeto } from '@/types/projeto';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ArquivosPage() {
    const [arquivos, setArquivos] = useState<Arquivo[]>([]);
    const [loading, setLoading] = useState(true);
    const [projetoFilter, setProjetoFilter] = useState<string>('all');
    const [projetos, setProjetos] = useState<Projeto[]>([]);

    const fetchArquivos = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (projetoFilter !== 'all') {
                params.projetoId = projetoFilter;
            }

            const response = await api.get('/arquivos', { params });
            setArquivos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar arquivos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [projetoFilter]);

    const fetchProjetos = async () => {
        try {
            const response = await api.get('/projetos');
            setProjetos(response.data);
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
        }
    };

    useEffect(() => {
        fetchArquivos();
        fetchProjetos();
    }, [fetchArquivos]);

    const totalSize = arquivos.reduce((sum, arquivo) => sum + arquivo.size, 0);
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Arquivos</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie todos os arquivos dos seus projetos
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <FileIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total de Arquivos</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {arquivos.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Upload className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Espaço Utilizado</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatBytes(totalSize)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <FileIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Projetos com Arquivos</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {new Set(arquivos.map(a => a.projetoId)).size}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <Select value={projetoFilter} onValueChange={setProjetoFilter}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Projetos</SelectItem>
                        {projetos.map((projeto) => (
                            <SelectItem key={projeto.id} value={projeto.id}>
                                {projeto.number} - {projeto.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-64 w-full" />
                        ))}
                    </div>
                ) : (
                    <FileList arquivos={arquivos} onUpdate={fetchArquivos} />
                )}
            </div>
        </div>
    );
}