'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import axios from 'axios';
import { maskCpf, maskCnpj } from '@/lib/masks';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    bio: string | null;
    cpf: string | null;
    cnpj: string | null;
    slug: string | null;
    plan: string;
    avatar: string | null;
    createdAt: string;
}

interface CompanySectionProps {
    profile: UserProfile;
    onUpdate: (profile: UserProfile) => void;
}

export function CompanySection({ profile, onUpdate }: CompanySectionProps) {
    const [company, setCompany] = useState(profile.company || '');
    const [cpf, setCpf] = useState(profile.cpf || '');
    const [cnpj, setCnpj] = useState(profile.cnpj || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCpf(maskCpf(e.target.value));
    };

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCnpj(maskCnpj(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await api.put('/auth/profile', {
                company: company.trim() || null,
                cpf: cpf.replace(/\D/g, '') || null,
                cnpj: cnpj.replace(/\D/g, '') || null,
                bio: bio.trim() || null,
            });

            onUpdate(response.data.user);

            toast({
                title: 'Sucesso',
                description: 'Dados da empresa atualizados com sucesso',
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao atualizar dados',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados da Empresa
                </CardTitle>
                <CardDescription>
                    Informações que aparecem em orçamentos e contratos
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="company">Nome da Empresa</Label>
                            <Input
                                id="company"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Nome fantasia ou razão social"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                                id="cpf"
                                value={cpf}
                                onChange={handleCpfChange}
                                placeholder="000.000.000-00"
                                maxLength={14}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                                id="cnpj"
                                value={cnpj}
                                onChange={handleCnpjChange}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                            />
                            <p className="text-xs text-slate-500">
                                Opcional. Usado para emissão de notas fiscais.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Descrição / Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Conte um pouco sobre você e seus serviços..."
                            rows={4}
                        />
                        <p className="text-xs text-slate-500">
                            Esta descrição pode aparecer em propostas enviadas aos clientes.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar alterações'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
