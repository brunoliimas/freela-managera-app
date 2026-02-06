import axios from 'axios';

const apiPortal = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/portal`,
    withCredentials: true,
});

apiPortal.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/portal/login') {
                    window.location.href = '/portal/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiPortal;
