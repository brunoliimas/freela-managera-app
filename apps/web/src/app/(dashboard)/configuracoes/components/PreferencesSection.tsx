'use client';

import { Palette, Bell, Monitor, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFreelancerTheme } from '@/hooks/useTheme';

export function PreferencesSection() {
    const { theme, setTheme } = useFreelancerTheme();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Aparência
                    </CardTitle>
                    <CardDescription>
                        Personalize a aparência do aplicativo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Tema</Label>
                            <p className="text-sm text-slate-500">
                                Escolha entre tema claro, escuro ou automático
                            </p>
                        </div>
                        <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        Claro
                                    </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        Escuro
                                    </div>
                                </SelectItem>
                                <SelectItem value="system">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        Sistema
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notificações
                    </CardTitle>
                    <CardDescription>
                        Configure suas preferências de notificação
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Notificações por email</Label>
                            <p className="text-sm text-slate-500">
                                Receba atualizações sobre novos orçamentos e projetos
                            </p>
                        </div>
                        <Switch id="email-notifications" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="payment-notifications">Alertas de pagamento</Label>
                            <p className="text-sm text-slate-500">
                                Seja notificado quando um pagamento estiver próximo do vencimento
                            </p>
                        </div>
                        <Switch id="payment-notifications" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing-notifications">Novidades e dicas</Label>
                            <p className="text-sm text-slate-500">
                                Receba dicas sobre como melhorar sua gestão freelance
                            </p>
                        </div>
                        <Switch id="marketing-notifications" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
