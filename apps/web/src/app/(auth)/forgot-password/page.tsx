'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validations/auth';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordInput) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', data);
            setEmailSent(true);
            toast.success('Email enviado!', {
                description: 'Verifique sua caixa de entrada.',
            });
        } catch (error: unknown) {
            let message = 'Erro ao enviar email de recuperação';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.error || message;
            }
            toast.error('Erro', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Verifique seu email</CardTitle>
                    <CardDescription>
                        Se o email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a pasta de spam.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col space-y-4">
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            Voltar para o login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Esqueci minha senha</CardTitle>
                <CardDescription>
                    Digite seu email para receber um link de recuperação de senha
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                    </Button>
                    <p className="text-sm text-center text-slate-600">
                        Lembrou sua senha?{' '}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Voltar para o login
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
