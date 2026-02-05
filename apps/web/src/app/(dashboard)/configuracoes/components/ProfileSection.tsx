'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import axios from 'axios';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    bio: string | null;
    cpf: string | null;
    cnpj: string | null;
    plan: string;
    avatar: string | null;
    createdAt: string;
}

interface ProfileSectionProps {
    profile: UserProfile;
    onUpdate: (profile: UserProfile) => void;
}

export function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
    const [name, setName] = useState(profile.name);
    const [phone, setPhone] = useState(profile.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        }
        return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Erro',
                description: 'Nome é obrigatório',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            const response = await api.put('/auth/profile', {
                name: name.trim(),
                phone: phone.replace(/\D/g, '') || null,
            });

            onUpdate(response.data.user);

            toast({
                title: 'Sucesso',
                description: 'Perfil atualizado com sucesso',
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao atualizar perfil',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                </CardTitle>
                <CardDescription>
                    Atualize suas informações básicas de perfil
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-semibold">
                            {getInitials(name)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{name}</p>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={profile.email}
                                disabled
                                className="bg-slate-50"
                            />
                            <p className="text-xs text-slate-500">
                                O email não pode ser alterado
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plan">Plano</Label>
                            <Input
                                id="plan"
                                value={profile.plan}
                                disabled
                                className="bg-slate-50"
                            />
                        </div>
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
