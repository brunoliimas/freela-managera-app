'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import axios from 'axios';

export function SecuritySection() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: 'Erro',
                description: 'A nova senha deve ter no mínimo 6 caracteres',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Erro',
                description: 'As senhas não coincidem',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);

        try {
            await api.put('/auth/change-password', {
                currentPassword,
                newPassword,
            });

            toast({
                title: 'Sucesso',
                description: 'Senha alterada com sucesso',
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao alterar senha',
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
                    <Shield className="h-5 w-5" />
                    Segurança
                </CardTitle>
                <CardDescription>
                    Gerencie a segurança da sua conta
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha atual</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Digite sua senha atual"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova senha</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite a nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Mínimo de 6 caracteres
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirme a nova senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Alterando...' : 'Alterar senha'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
