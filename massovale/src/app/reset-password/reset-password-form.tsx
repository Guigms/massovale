// Este componente DEVE ter 'use client'
'use client';

import Link from 'next/link';
import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mova o conteúdo da sua função ResetPasswordPage para cá.
export default function ResetPasswordForm() {
  const router = useRouter();
  // Este hook APENAS funciona em um componente cliente
  const searchParams = useSearchParams(); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
        setToken(urlToken);
    } else {
        toast.error('Token de redefinição ausente. Por favor, solicite um novo link.');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    
    if (!token) {
        toast.error('Token inválido. Redirecionando...');
        router.push('/forgot-password');
        setLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao redefinir a senha.');
      }
      
      toast.success(data.message);
      router.push('/login?reset=success'); 

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
        Definir Nova Senha
      </h1>
      <p className="mt-2 text-base text-black">
        Seu token foi validado. Digite sua nova senha.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-black">
            Nova Senha
          </label>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border-0 py-2.5 px-3 bg-white text-stone-500 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

          <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-black">
            Confirme a Nova Senha
          </label>
          <div className="mt-2">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-md border-0 py-2.5 px-3 bg-white text-stone-500 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !token}
          className="flex w-full justify-center rounded-md bg-gray-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        >
          {loading ? 'Redefinindo...' : 'Redefinir Senha'}
        </button>
        
          <div className="text-center text-sm pt-4">
            <Link href="/login" className="font-semibold text-black hover:text-white">
              Voltar para o Login
            </Link>
          </div>
      </form>
    </div>
  );
}