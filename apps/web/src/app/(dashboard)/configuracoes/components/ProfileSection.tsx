'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import axios from 'axios';
import { maskPhone } from '@/lib/masks';

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

interface ProfileSectionProps {
    profile: UserProfile;
    onUpdate: (profile: UserProfile) => void;
}

export function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
    const [name, setName] = useState(profile.name);
    const [phone, setPhone] = useState(profile.phone || '');
    const [slug, setSlug] = useState(profile.slug || '');
    const [avatar, setAvatar] = useState(profile.avatar);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(maskPhone(e.target.value));
    };

    const handleAvatarUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post('/auth/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatar(response.data.avatar);
        onUpdate({ ...profile, avatar: response.data.avatar });
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
                slug: slug.trim() || undefined,
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
                        <AvatarUpload
                            currentAvatar={avatar}
                            name={name}
                            onUpload={handleAvatarUpload}
                            size="lg"
                            color="blue"
                        />
                        <div>
                            <p className="text-sm font-medium text-slate-900">{name}</p>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                            <p className="text-xs text-slate-400 mt-1">Clique na foto para alterar</p>
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

                    {/* Link público */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">Seu link público</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 whitespace-nowrap">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/f/
                            </span>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="seu-slug"
                            />
                            <span className="text-sm text-slate-500 whitespace-nowrap">
                                /solicitar-orcamento
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Compartilhe este link com seus clientes para receber solicitações de orçamento
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
