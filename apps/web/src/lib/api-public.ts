import axios from 'axios';

const apiPublic = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:3001/api',
});

export default apiPublic;