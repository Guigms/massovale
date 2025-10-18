'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chama a API que gera o token e envia o e-mail
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Embora a API retorne 200 por segurança, tratamos aqui se houver uma falha interna
        throw new Error(data.message || 'Erro ao processar sua solicitação.');
      }
      
      // Mensagem genérica para sucesso (enviada pela sua API por segurança)
      toast.success(data.message);
      setSuccess(true);
      setEmail('');

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro de conexão com o servidor.');
      }
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full">
      {/* Coluna da esquerda - Formulário */}
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Recuperar Senha
          </h1>
          <p className="mt-2 text-base text-black">
            Informe o e-mail da sua conta para receber o link de redefinição.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
            
            <button
              type="submit"
              disabled={loading || success}
              className="flex w-full justify-center rounded-md bg-gray-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </button>
            
             <div className="text-center text-sm pt-4">
                <Link href="/login" className="font-semibold text-black hover:text-white">
                  ← Voltar para o Login
                </Link>
             </div>
          </form>
          
           {success && (
                <div className="mt-6 rounded-md px-4 py-3 text-sm bg-green-100 text-green-800 border border-green-400">
                    Verifique sua caixa de entrada. O link foi enviado com sucesso!
                </div>
            )}
        </div>
      </div>

      {/* Coluna da direita com a imagem*/}
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