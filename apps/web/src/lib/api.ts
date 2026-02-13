import axios from 'axios';

const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
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
                    // Limpar estado de auth antes de redirecionar para evitar loop
                    localStorage.removeItem('auth-storage');
                    window.location.assign('/login');
                }
            }
        }

        // 2FA enforcement: token exists but 2FA not verified
        if (error.response?.status === 403 && error.response?.data?.requires2FA) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage');
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
