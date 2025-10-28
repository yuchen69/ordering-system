import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault(); 
    setError(''); 

    axios.post('http://localhost:3001/api/login', { username, password })
      .then(response => {
        const token = response.data.token;
        onLogin(token); 
        navigate('/admin/orders'); 
      })
      .catch(err => {
        if (err.response) {
          setError(err.response.data.error || '登入失敗');
        } else {
          setError('無法連接到伺服器');
        }
      });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow-lg bg-white">
      <h1 className="text-3xl font-bold text-center mb-6">管理者登入</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            帳號 (admin)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            密碼 (admin123)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          登入
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;