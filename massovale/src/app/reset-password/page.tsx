import Image from 'next/image';
import { Suspense } from 'react'; // Importar Suspense
import ResetPasswordForm from './reset-password-form'; // Importar o novo componente

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col justify-center bg-[#dcdcdc] p-8 sm:p-12 md:p-16 lg:w-1/2">
        <Suspense fallback={<div className="text-center text-black">Carregando formulário...</div>}>
          <ResetPasswordForm />
        </Suspense>
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