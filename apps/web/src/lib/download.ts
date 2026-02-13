import api from './api';

export async function downloadFile(
    endpoint: string,
    filename: string,
    mimeType = 'text/csv'
) {
    const response = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
