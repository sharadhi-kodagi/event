import axios from 'axios';

const API = axios.create({
    baseURL: 'const API_URL = "https://event-rd6t.onrender.com/api/";',
});

// Add the token to every request header
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});


export default API;
