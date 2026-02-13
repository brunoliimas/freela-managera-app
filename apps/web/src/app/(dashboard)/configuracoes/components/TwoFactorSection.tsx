'use client';

import { useState } from 'react';
import { Smartphone, Copy, Check, ShieldCheck, ShieldOff, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import axios from 'axios';

interface TwoFactorSectionProps {
    twoFactorEnabled: boolean;
    onUpdate: () => void;
}

export function TwoFactorSection({ twoFactorEnabled, onUpdate }: TwoFactorSectionProps) {
    const [step, setStep] = useState<'idle' | 'setup' | 'recovery' | 'disabling'>('idle');
    const [setupData, setSetupData] = useState<{
        secret: string;
        qrCodeDataUrl: string;
    } | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [disablePassword, setDisablePassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleSetup = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/2fa/setup');
            setSetupData(data);
            setStep('setup');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao iniciar configuração 2FA',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable = async () => {
        if (!setupData || verifyCode.length !== 6) return;
        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/2fa/enable', {
                secret: setupData.secret,
                token: verifyCode,
            });
            setRecoveryCodes(data.recoveryCodes);
            setStep('recovery');
            onUpdate();
            toast({
                title: 'Sucesso',
                description: '2FA habilitado com sucesso',
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Código inválido',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!disablePassword) return;
        setIsLoading(true);
        try {
            await api.post('/auth/2fa/disable', { password: disablePassword });
            toast({
                title: 'Sucesso',
                description: '2FA desabilitado com sucesso',
            });
            setDisablePassword('');
            setStep('idle');
            onUpdate();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast({
                    title: 'Erro',
                    description: error.response?.data?.error || 'Erro ao desabilitar 2FA',
                    variant: 'destructive',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const copyRecoveryCodes = () => {
        navigator.clipboard.writeText(recoveryCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDone = () => {
        setStep('idle');
        setSetupData(null);
        setVerifyCode('');
        setRecoveryCodes([]);
    };

    // State: Recovery codes display (after enabling)
    if (step === 'recovery') {
        return (
            <Card className="border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <ShieldCheck className="h-5 w-5" />
                        2FA Habilitado — Códigos de Recuperação
                    </CardTitle>
                    <CardDescription>
                        Salve estes códigos em um local seguro. Cada código pode ser usado apenas uma vez
                        caso você perca acesso ao seu aplicativo autenticador.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 rounded-lg font-mono text-sm">
                        {recoveryCodes.map((code, i) => (
                            <div key={i} className="text-center py-1">
                                {code}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={copyRecoveryCodes}
                        >
                            {copied ? (
                                <><Check className="h-4 w-4 mr-2" /> Copiado!</>
                            ) : (
                                <><Copy className="h-4 w-4 mr-2" /> Copiar códigos</>
                            )}
                        </Button>
                        <Button className="flex-1" onClick={handleDone}>
                            Pronto, salvei os códigos
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // State: QR code setup (scanning)
    if (step === 'setup' && setupData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Configurar Autenticação 2FA
                    </CardTitle>
                    <CardDescription>
                        Escaneie o QR code abaixo com seu aplicativo autenticador
                        (Google Authenticator, Authy, etc.)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={setupData.qrCodeDataUrl}
                            alt="QR Code 2FA"
                            className="w-48 h-48"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500">
                            Ou insira a chave manualmente no app:
                        </Label>
                        <code className="block p-2 bg-slate-100 rounded text-xs text-center break-all select-all">
                            {setupData.secret}
                        </code>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="verifyCode">
                            Digite o código de 6 dígitos do app
                        </Label>
                        <Input
                            id="verifyCode"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            autoComplete="one-time-code"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setStep('idle'); setSetupData(null); setVerifyCode(''); }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleEnable}
                            disabled={isLoading || verifyCode.length !== 6}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Ativar 2FA'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // State: Disabling 2FA (password confirmation)
    if (step === 'disabling') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldOff className="h-5 w-5" />
                        Desabilitar 2FA
                    </CardTitle>
                    <CardDescription>
                        Digite sua senha para confirmar a desativação da autenticação em duas etapas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="disablePassword">Senha</Label>
                        <div className="relative">
                            <Input
                                id="disablePassword"
                                type={showPassword ? 'text' : 'password'}
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Digite sua senha"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setStep('idle'); setDisablePassword(''); }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleDisable}
                            disabled={isLoading || !disablePassword}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Desabilitar 2FA'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // State: Idle (show status + action button)
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Autenticação em Duas Etapas (2FA)
                </CardTitle>
                <CardDescription>
                    Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                        {twoFactorEnabled ? (
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        ) : (
                            <ShieldOff className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                            <p className="font-medium">
                                {twoFactorEnabled ? '2FA está ativo' : '2FA não está ativo'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {twoFactorEnabled
                                    ? 'Sua conta está protegida com autenticação em duas etapas'
                                    : 'Recomendamos ativar para maior segurança da sua conta'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
                            {twoFactorEnabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {twoFactorEnabled ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStep('disabling')}
                            >
                                Desabilitar
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleSetup}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Ativar 2FA'
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
