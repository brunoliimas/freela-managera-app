import axios from 'axios';

const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
    withCredentials: true, // Enviar cookies httpOnly automaticamente
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                // Evitar loop de redirecionamento em páginas públicas
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
