'use client';

import { useState } from 'react';
import { Download, Trash2, Eye, MoreVertical, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Arquivo } from '@/types/projeto';
import { formatDate } from '@/lib/format';
import { formatFileSize, getFileIcon, getFileColor, isImage } from '@/lib/file-utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface FileListProps {
    arquivos: Arquivo[];
    onUpdate: () => void;
}

export function FileList({ arquivos, onUpdate }: FileListProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [arquivoToDelete, setArquivoToDelete] = useState<Arquivo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewArquivo, setPreviewArquivo] = useState<Arquivo | null>(null);

    const handleDownload = async (arquivo: Arquivo) => {
        try {
            const response = await api.get(`/arquivos/${arquivo.id}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', arquivo.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Download iniciado!');
        } catch (error) {
            toast.error('Erro ao fazer download');
        }
    };

    const handleDelete = async () => {
        if (!arquivoToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/arquivos/${arquivoToDelete.id}`);
            toast.success('Arquivo excluído com sucesso!');
            onUpdate();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir arquivo');
            } else {
                toast.error('Erro ao excluir arquivo');
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setArquivoToDelete(null);
        }
    };

    const handlePreview = (arquivo: Arquivo) => {
        if (isImage(arquivo.type)) {
            setPreviewArquivo(arquivo);
            setPreviewOpen(true);
        } else {
            handleDownload(arquivo);
        }
    };

    if (arquivos.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <FileIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>Nenhum arquivo anexado ainda.</p>
                <p className="text-sm mt-1">
                    Envie arquivos para este projeto usando o formulário acima.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arquivos.map((arquivo) => (
                    <div
                        key={arquivo.id}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {isImage(arquivo.type) ? (
                            <div
                                className="h-48 bg-slate-100 cursor-pointer overflow-hidden"
                                onClick={() => handlePreview(arquivo)}
                            >
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}${arquivo.url}`}
                                    alt={arquivo.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                            </div>
                        ) : (
                            <div className={`h-48 flex items-center justify-center ${getFileColor(arquivo.type)}`}>
                                <span className="text-6xl">{getFileIcon(arquivo.type)}</span>
                            </div>
                        )}

                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-medium text-slate-900 truncate flex-1">
                                    {arquivo.name}
                                </h4>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handlePreview(arquivo)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {isImage(arquivo.type) ? 'Visualizar' : 'Abrir'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownload(arquivo)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setArquivoToDelete(arquivo);
                                                setDeleteDialogOpen(true);
                                            }}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{formatFileSize(arquivo.size)}</span>
                                <span>{formatDate(arquivo.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Dialog */}
            {previewArquivo && (
                <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <AlertDialogContent className="max-w-4xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{previewArquivo.name}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {formatFileSize(previewArquivo.size)} • {formatDate(previewArquivo.createdAt)}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="max-h-[70vh] overflow-auto">
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${previewArquivo.url}`}
                                alt={previewArquivo.name}
                                className="w-full rounded-lg"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Fechar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDownload(previewArquivo)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Arquivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o arquivo{' '}
                            <strong>{arquivoToDelete?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}