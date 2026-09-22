import axios from 'axios';

// API publica do Rick and Morty (nao precisa de chave / token)
const api = axios.create({
  baseURL: 'https://rickandmortyapi.com/api',
  timeout: 10000,
});

export default api;
