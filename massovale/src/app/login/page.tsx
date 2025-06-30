'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<'success' | 'error' | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === '1') {
      setMessage('E-mail verificado com sucesso! Faça login.');
      setType('success');
    } else if (error === 'invalid') {
      setMessage('Token inválido ou expirado. Solicite um novo.');
      setType('error');
    } else if (error === 'token') {
      setMessage('Token ausente na verificação.');
      setType('error');
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Erro ao fazer login.');
        setType('error');
        return;
      }

      setMessage('Login realizado com sucesso!');
      setType('success');

      // Redireciona de acordo com o role
      if (data.user.role === 'PACIENTE') {
        router.push('/costumer/dashboard');
      } else if (data.user.role === 'CLINICO') {
        router.push('/clinical/dashboard');
      } else {
        router.push('/'); // fallback
      }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage('Erro ao conectar com o servidor.');
      setType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">

          {message && (
            <div
              className={`mb-6 rounded-md px-4 py-3 text-sm ${
                type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-400'
                  : 'bg-red-100 text-red-800 border border-red-400'
              }`}
            >
              {message}
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Entre com sua conta
          </h1>
          <p className="mt-2 text-base text-black">
            Não tem conta?{' '}
            <Link href="/register" className="font-semibold text-black hover:text-white">
              Registre-se
            </Link>
          </p>

          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-black">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 px-3 bg-white text-stone-500 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-black">
                Senha
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 px-3 bg-white text-stone-500 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-500 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="#" className="font-semibold text-black hover:text-white">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-gray-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              >
                {loading ? 'Entrando...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <Image
          src="/logomasso.png"
          alt="Logo da Jessica Vale Massoterapia"
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
    </main>
  );
}
