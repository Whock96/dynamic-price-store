
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/layout/PageContainer';

const Login = () => {
  const { user, login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      setLoginError(error);
      setIsLoggingIn(false);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      await login(username, password);
    } catch (err) {
      // Error is handled through the useAuth context
    }
  };

  return (
    <PageContainer requireAuth={false}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-md rounded-lg p-6 border">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Ferplas ERP</h1>
              <p className="text-gray-500">Faça login para acessar o sistema</p>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Nome de Usuário
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-ferplas-500 focus:outline-none focus:ring-ferplas-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-ferplas-500 focus:outline-none focus:ring-ferplas-500"
                  />
                </div>
                
                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {loginError}
                  </div>
                )}
                
                <div>
                  <button
                    type="submit"
                    disabled={isLoggingIn || loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ferplas-500 hover:bg-ferplas-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ferplas-500 disabled:opacity-50"
                  >
                    {isLoggingIn || loading ? 'Entrando...' : 'Entrar'}
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-center text-sm text-gray-500">
                  Utilize o usuário e senha fornecidos pelo administrador do sistema.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Login;
