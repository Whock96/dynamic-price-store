import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Logo from '../../assets/logo';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card overflow-hidden animate-fade-in">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-4 transform transition-transform hover:scale-105 duration-300">
          <Logo size="lg" />
        </div>
        <CardTitle className="text-2xl font-bold text-ferplas-600">Bem-vindo(a)</CardTitle>
        <CardDescription className="text-gray-500">
          Acesse sua conta para continuar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Usuário
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-transition"
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 input-transition"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-ferplas-500 hover:bg-ferplas-600 text-white button-transition"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2" />
                Entrando...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </div>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-center text-xs text-gray-500 pt-0">
        <p>Login padrão: admin / Senha: admin</p>
        <p className="mt-4">© {new Date().getFullYear()} Ferplas. Todos os direitos reservados.</p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
