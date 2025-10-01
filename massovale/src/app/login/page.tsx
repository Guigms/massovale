import Image from 'next/image';
import { Suspense } from 'react';
import LoginForm from './login-form'; // Importa o novo componente cliente

export default function SignInPage() {
  return (
    <main className="flex min-h-screen w-full">
      {/* Coluna da esquerda que agora usa Suspense para carregar o formulário */}
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <Suspense fallback={<div className="text-center">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Coluna da direita com a imagem, que pode ser renderizada no servidor */}
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
