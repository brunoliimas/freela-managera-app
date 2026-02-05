import axios from 'axios';

const apiPublic = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1` || 'http://localhost:3001/api/v1',
});

export default apiPublic;