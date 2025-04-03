const API_BASE_URL = 'https://auth-api-bluepay.vercel.app';

const ApiConfig = {
    baseUrl: API_BASE_URL,
    endpoints: {
        auth: {
            login: `${API_BASE_URL}/api/auth/login`,
            register: `${API_BASE_URL}/api/auth/register`,
            verify: `${API_BASE_URL}/api/auth/verify`
        },
        users: {
            list: `${API_BASE_URL}/api/users`,
            get: (id) => `${API_BASE_URL}/api/users/${id}`,
            create: `${API_BASE_URL}/api/users`,
            update: (id) => `${API_BASE_URL}/api/users/${id}`,
            delete: (id) => `${API_BASE_URL}/api/users/${id}`
        },
        colaboradores: {
            list: `${API_BASE_URL}/api/colaboradores`,
            get: (id) => `${API_BASE_URL}/api/colaboradores/${id}`,
            create: `${API_BASE_URL}/api/colaboradores`,
            update: (id) => `${API_BASE_URL}/api/colaboradores/${id}`,
            delete: (id) => `${API_BASE_URL}/api/colaboradores/${id}`
        }
    }
};

module.exports = ApiConfig; 