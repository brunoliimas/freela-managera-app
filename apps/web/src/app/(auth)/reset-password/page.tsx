'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validations/auth';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    if (!token) {
        return (
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Link inválido</CardTitle>
                    <CardDescription>
                        O link de recuperação de senha é inválido ou está incompleto.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link href="/forgot-password" className="w-full">
                        <Button variant="outline" className="w-full">
                            Solicitar novo link
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    const onSubmit = async (data: ResetPasswordInput) => {
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password,
            });
            toast.success('Senha redefinida!', {
                description: 'Faça login com sua nova senha.',
            });
            router.push('/login');
        } catch (error: unknown) {
            let message = 'Erro ao redefinir senha';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.error || message;
            }
            toast.error('Erro', { description: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
                <CardDescription>
                    Digite sua nova senha abaixo
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
                    </Button>
                    <p className="text-sm text-center text-slate-600">
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Voltar para o login
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </CardContent>
            </Card>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
