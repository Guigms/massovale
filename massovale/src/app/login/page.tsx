// app/page.tsx

import Image from 'next/image';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Entre com sua conta
          </h1>
          <p className="mt-2 text-base text-black">
            Não tem conta?{' '}
            <Link href="/register" className="font-semibold text-black hover:text-white">
              Registre-se
            </Link>
          </p>

          <form className="mt-10 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-black">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
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
                  autoComplete="current-password"
                  required
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
                className="flex w-full justify-center rounded-md bg-gray-900 py-2.5 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-black focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              >
                Login
              </button>
            </div>
          </form>

          {/* Divisor */}
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-900" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
              </div>
            </div>
          </div>
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