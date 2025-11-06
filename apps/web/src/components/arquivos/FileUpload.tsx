'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize, validateFile, getFileIcon } from '@/lib/file-utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

interface FileUploadProps {
    projetoId: string;
    onSuccess: () => void;
    multiple?: boolean;
}

interface FileWithPreview {
    file: File;
    preview?: string;
}

export function FileUpload({ projetoId, onSuccess, multiple = false }: FileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const handleFiles = useCallback((fileList: FileList | null) => {
        if (!fileList) return;

        const newFiles: FileWithPreview[] = [];

        Array.from(fileList).forEach((file) => {
            const validation = validateFile(file);

            if (!validation.valid) {
                toast.error(validation.error);
                return;
            }

            // Criar preview para imagens
            const fileWithPreview: FileWithPreview = { file };

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    fileWithPreview.preview = reader.result as string;
                    setFiles(prev => [...prev, fileWithPreview]);
                };
                reader.readAsDataURL(file);
            } else {
                newFiles.push(fileWithPreview);
            }
        });

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) {
            toast.error('Nenhum arquivo selecionado');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const totalFiles = files.length;
            let uploadedCount = 0;

            for (const { file } of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('projetoId', projetoId);

                await api.post('/arquivos', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                uploadedCount++;
                setProgress((uploadedCount / totalFiles) * 100);
            }

            toast.success(`${uploadedCount} arquivo(s) enviado(s) com sucesso!`);
            setFiles([]);
            onSuccess();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao enviar arquivo');
            } else {
                toast.error('Erro ao enviar arquivo');
            }
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 mb-2">
                    Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-slate-500 mb-4">
                    Máximo 10MB por arquivo. Imagens, PDFs, documentos aceitos.
                </p>
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.zip,.rar"
                />
                <label htmlFor="file-upload">
                    <Button type="button" variant="outline" asChild>
                        <span>Selecionar Arquivos</span>
                    </Button>
                </label>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                        {files.length} arquivo(s) selecionado(s)
                    </p>

                    <div className="space-y-2">
                        {files.map((fileObj, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                            >
                                {fileObj.preview ? (
                                    <img
                                        src={fileObj.preview}
                                        alt={fileObj.file.name}
                                        className="w-12 h-12 object-cover rounded"
                                    />
                                ) : (
                                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded text-2xl">
                                        {getFileIcon(fileObj.file.type)}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        {fileObj.file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatFileSize(fileObj.file.size)}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFile(index)}
                                    disabled={uploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {uploading && (
                        <div className="space-y-2">
                            <Progress value={progress} />
                            <p className="text-xs text-center text-slate-600">
                                Enviando... {Math.round(progress)}%
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setFiles([])}
                            disabled={uploading}
                        >
                            Limpar
                        </Button>
                        <Button onClick={uploadFiles} disabled={uploading}>
                            {uploading ? 'Enviando...' : 'Enviar Arquivos'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}