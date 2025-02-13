const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://artmochi-production.up.railway.app'  // Your Railway backend URL
  : 'http://localhost:3000';

export default API_BASE_URL;