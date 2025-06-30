"use client";

import Image from 'next/image';
import { useState, FormEvent } from 'react';

export default function SignInPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCarregando(true);
    setErro('');
    setMensagem('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  name: name,
  email: email,
  password: password,
  contact: contact,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao registrar.');
      }

      setMensagem('Registro realizado com sucesso! Verifique seu email!');
      
      setName('');
      setEmail('');
      setPassword('');
      setContact('');

    } catch (error: unknown) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Ocorreu um erro inesperado.');
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8"></div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Registre-se
          </h1>
          <br />
          <form className="max-w-md mx-auto" onSubmit={handleSubmit}>

            <div className="relative z-0 w-full mb-5 group">
              <input type="text" id="nome" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-black dark:border-gray-600 dark:focus:border-black focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label htmlFor="nome" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Nome Completo</label>
            </div>

            <div className="relative z-0 w-full mb-5 group">
              <input type="email" id="email" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-black dark:border-gray-600 dark:focus:border-black focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="email" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Email</label>
            </div>
            
            <div className="relative z-0 w-full mb-5 group">
              <input type="password" id="password" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-black dark:border-gray-600 dark:focus:border-black focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Senha</label>
            </div>

            <div className="relative z-0 w-full mb-5 group">
              <input type="tel" id="floating_phone" className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-black dark:border-gray-600 dark:focus:border-black focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required 
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <label htmlFor="floating_phone" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Contato</label>
            </div>
            
            <button type="submit" className="bg-gray-900 text-white font-bold py-2 px-6 rounded-full hover:bg-white hover:text-black transition-colors duration-300 shadow-lg" disabled={carregando}>
              {carregando ? 'Registrando...' : 'Registrar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {erro && <p className="text-red-500 font-bold">{erro}</p>}
            {mensagem && <p className="text-green-500 font-bold">{mensagem}</p>}
          </div>

          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-900" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <Image
          src="/logomasso.png"
          alt="Workspace com um laptop e teclado"
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
    </main>
  );
}