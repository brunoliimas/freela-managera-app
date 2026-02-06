'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Pencil, FileText, FolderKanban } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClienteDialog } from '@/components/clientes/ClienteDialog';
import { Cliente } from '@/types/cliente';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

export default function ClienteDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter();
    const { id } = use(params);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchCliente = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/clientes/${id}`);
            setCliente(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao carregar cliente');
            } else {
                toast.error('Erro ao carregar cliente');
            }
            router.push('/clientes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCliente();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!cliente) return null;

    const projetosCount = cliente.projetos?.length || 0;
    const orcamentosCount = cliente.orcamentos?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/clientes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <AvatarUpload
                        currentAvatar={cliente.avatar || null}
                        name={cliente.name}
                        onUpload={async (file) => {
                            const formData = new FormData();
                            formData.append('avatar', file);
                            await api.post(`/clientes/${id}/avatar`, formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            fetchCliente();
                        }}
                        size="lg"
                        color="blue"
                    />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{cliente.name}</h1>
                            <Badge variant={cliente.active ? 'default' : 'secondary'}>
                                {cliente.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        <p className="text-slate-600 mt-1">
                            Cliente desde {formatDate(cliente.createdAt)}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
            </div>

            {/* Informações de Contato */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-600">Email</p>
                                <p className="font-medium">{cliente.email}</p>
                            </div>
                        </div>

                        {cliente.phone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Telefone</p>
                                    <p className="font-medium">{cliente.phone}</p>
                                </div>
                            </div>
                        )}

                        {cliente.company && (
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Empresa</p>
                                    <p className="font-medium">{cliente.company}</p>
                                </div>
                            </div>
                        )}

                        {cliente.cnpj && (
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">CNPJ</p>
                                    <p className="font-medium">{cliente.cnpj}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {(cliente.address || cliente.city || cliente.state) && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-600">Endereço</p>
                                    <p className="font-medium">
                                        {cliente.address}
                                        {cliente.city && `, ${cliente.city}`}
                                        {cliente.state && ` - ${cliente.state}`}
                                        {cliente.zipCode && ` - ${cliente.zipCode}`}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {cliente.notes && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm text-slate-600 mb-2">Observações</p>
                                <RichTextDisplay content={cliente.notes} />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Tabs de Projetos e Orçamentos */}
            <Tabs defaultValue="projetos" className="w-full">
                <TabsList>
                    <TabsTrigger value="projetos">
                        <FolderKanban className="mr-2 h-4 w-4" />
                        Projetos ({projetosCount})
                    </TabsTrigger>
                    <TabsTrigger value="orcamentos">
                        <FileText className="mr-2 h-4 w-4" />
                        Orçamentos ({orcamentosCount})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="projetos" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            {!cliente.projetos || cliente.projetos.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">
                                    Nenhum projeto cadastrado para este cliente
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {cliente.projetos.map((projeto) => (
                                        <div
                                            key={projeto.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/projetos/${projeto.id}`)}
                                        >
                                            <div>
                                                <p className="font-medium">{projeto.title}</p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {formatDate(projeto.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge>{projeto.status}</Badge>
                                                <p className="font-semibold">{formatCurrency(projeto.value)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orcamentos" className="mt-6">
                    <Card>
                        <CardContent className="pt-6">
                            {!cliente.orcamentos || cliente.orcamentos.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">
                                    Nenhum orçamento cadastrado para este cliente
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {cliente.orcamentos.map((orcamento) => (
                                        <div
                                            key={orcamento.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/orcamentos/${orcamento.id}`)}
                                        >
                                            <div>
                                                <p className="font-medium">{orcamento.title}</p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {formatDate(orcamento.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge>{orcamento.status}</Badge>
                                                <p className="font-semibold">{formatCurrency(orcamento.value)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialog de Edição */}
            <ClienteDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                cliente={cliente}
                onSuccess={fetchCliente}
            />
        </div>
    );
}