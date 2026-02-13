'use client';

import { useEffect, useState } from 'react';
import { Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import axios from 'axios';

interface FiscalConfig {
    cnae: string | null;
    issAliquota: number | null;
    inscricaoMunicipal: string | null;
    regimeTributario: number | null;
    codigoServico: string | null;
    enotasEmpresaId: string | null;
    cnpj: string | null;
    company: string | null;
}

const REGIMES_TRIBUTARIOS = [
    { value: '1', label: 'Simples Nacional' },
    { value: '2', label: 'Lucro Presumido' },
    { value: '3', label: 'Lucro Real' },
    { value: '4', label: 'MEI' },
];

export function FiscalSection() {
    const [config, setConfig] = useState<FiscalConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [cnae, setCnae] = useState('');
    const [issAliquota, setIssAliquota] = useState('');
    const [inscricaoMunicipal, setInscricaoMunicipal] = useState('');
    const [regimeTributario, setRegimeTributario] = useState('');
    const [codigoServico, setCodigoServico] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();

    const isPro = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';

    useEffect(() => {
        if (isPro) {
            fetchConfig();
        } else {
            setIsLoading(false);
        }
    }, [isPro]);

    const fetchConfig = async () => {
        try {
            const response = await api.get('/notas-fiscais/config');
            const data = response.data;
            setConfig(data);
            setCnae(data.cnae || '');
            setIssAliquota(data.issAliquota ? String(data.issAliquota) : '');
            setInscricaoMunicipal(data.inscricaoMunicipal || '');
            setRegimeTributario(data.regimeTributario ? String(data.regimeTributario) : '');
            setCodigoServico(data.codigoServico || '');
        } catch (error) {
            console.error('Erro ao buscar config fiscal:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await api.put('/notas-fiscais/config', {
                cnae,
                issAliquota,
                inscricaoMunicipal,
                regimeTributario,
                codigoServico,
            });

            toast({
                title: 'Sucesso',
                description: 'Configuração fiscal salva com sucesso',
            });

            fetchConfig();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao salvar configuração',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isPro) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Dados Fiscais
                    </CardTitle>
                    <CardDescription>
                        Configure seus dados para emissão de NFS-e
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            A emissão de NFS-e está disponível a partir do plano PRO.{' '}
                            <a href="/configuracoes?tab=assinatura" className="font-medium underline">
                                Fazer upgrade
                            </a>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dados Fiscais</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-slate-200 rounded" />
                        <div className="h-10 bg-slate-200 rounded" />
                        <div className="h-10 bg-slate-200 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Dados Fiscais
                        </CardTitle>
                        <CardDescription>
                            Configure seus dados para emissão de NFS-e via eNotas
                        </CardDescription>
                    </div>
                    {config?.enotasEmpresaId ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            eNotas conectado
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Não configurado
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="cnae">CNAE</Label>
                            <Input
                                id="cnae"
                                value={cnae}
                                onChange={(e) => setCnae(e.target.value)}
                                placeholder="Ex: 6201-5/01"
                            />
                            <p className="text-xs text-slate-500">
                                Código CNAE principal da sua atividade
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issAliquota">Alíquota ISS (%)</Label>
                            <Input
                                id="issAliquota"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={issAliquota}
                                onChange={(e) => setIssAliquota(e.target.value)}
                                placeholder="Ex: 5.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                            <Input
                                id="inscricaoMunicipal"
                                value={inscricaoMunicipal}
                                onChange={(e) => setInscricaoMunicipal(e.target.value)}
                                placeholder="Número da inscrição municipal"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="regimeTributario">Regime Tributário</Label>
                            <Select
                                value={regimeTributario}
                                onValueChange={setRegimeTributario}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o regime" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REGIMES_TRIBUTARIOS.map((regime) => (
                                        <SelectItem key={regime.value} value={regime.value}>
                                            {regime.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="codigoServico">Código do Serviço Municipal</Label>
                            <Input
                                id="codigoServico"
                                value={codigoServico}
                                onChange={(e) => setCodigoServico(e.target.value)}
                                placeholder="Ex: 01.07"
                            />
                            <p className="text-xs text-slate-500">
                                Código de serviço conforme lista da sua prefeitura
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Configuração Fiscal'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
