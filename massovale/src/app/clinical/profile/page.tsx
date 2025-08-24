'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr'; // Importe o mutate global

// Tipagem para os dados do usuário
type UserProfile = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

// Fetcher para o SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ProfilePage() {
  const router = useRouter();
  // Usamos uma chave constante para a mutação global
  const userCacheKey = '/api/userJWT';
  const { data: userData, error } = useSWR(userCacheKey, fetcher);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const user: UserProfile | null = userData?.user;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Por favor, selecione uma imagem primeiro.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha no upload da imagem.');
      }

      toast.success('Foto de perfil atualizada com sucesso!');
      
      mutate(userCacheKey, { user: { ...user, avatarUrl: data.avatarUrl } }, false);
      
      setFile(null);
      setPreview(null);

    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (error) {
    router.push('/login');
    return null;
  }
  
  if (!user) {
    return <div className="text-center p-10">Carregando perfil...</div>;
  }

  const avatarSrc = preview || user.avatarUrl || '/default-avatar.png';

  return (
    <main className="bg-[#d1d1d1] min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Meu Perfil</h1>
        
        <div className="flex flex-col items-center gap-4">
          <Image
            src={avatarSrc}
            alt="Foto de Perfil"
            width={128}
            height={128}
            className="rounded-full object-cover w-32 h-32 border-4 border-gray-200"
            key={avatarSrc} // Adicionar uma key força o React a recriar o componente de imagem
          />
          <h2 className="text-xl font-semibold text-gray-700">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Alterar foto de perfil
            </label>
            <input 
              id="file-upload"
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <button 
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-black text-white font-bold py-2 px-6 rounded-full hover:bg-gray-800 transition-colors duration-300 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Enviando...' : 'Salvar Nova Foto'}
          </button>
        </form>
      </div>
    </main>
  );
}