import axios from 'axios';

interface LoginParams {
  username: string;
  password: string;
}

export const login = async (params: LoginParams) => {
  const response = await axios.post('/api/auth/login', params);
  return response.data;
}; 