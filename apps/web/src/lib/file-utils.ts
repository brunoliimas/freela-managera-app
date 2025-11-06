// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Obter ícone baseado no tipo de arquivo
export function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
    if (mimeType.startsWith('text/')) return '📃';
    return '📎';
}

// Verificar se é imagem
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

// Obter cor baseada no tipo
export function getFileColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'bg-purple-100 text-purple-700';
    if (mimeType === 'application/pdf') return 'bg-red-100 text-red-700';
    if (mimeType.includes('word')) return 'bg-blue-100 text-blue-700';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'bg-green-100 text-green-700';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
}

// Validar arquivo antes de upload
export function validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
        return { valid: false, error: 'Arquivo muito grande. Máximo 10MB.' };
    }

    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Tipo de arquivo não permitido.' };
    }

    return { valid: true };
}