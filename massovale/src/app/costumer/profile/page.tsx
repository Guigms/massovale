'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { toast } from 'sonner';

// --- TIPOS ---
type UserProfile = {
  id: number;
  name: string;
  email: string;
  contact: string;
  avatarUrl?: string | null;
};

// --- Fetcher genérico ---
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Não autorizado');
    }
    throw new Error('Falha ao carregar os dados.');
  }
  return res.json();
});

export default function CostumerProfile() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- BUSCA DADOS DO USUÁRIO ---
  const { data: userData, isLoading, error } = useSWR('/api/userJWT', fetcher);
  const user: UserProfile | null = userData?.user || null;

  // Efeito para lidar com erros de autenticação
  useEffect(() => {
    if (error) {
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      router.push('/login');
    }
  }, [error, router]);

  // Efeito para atualizar a preview quando a foto do usuário é carregada
  useEffect(() => {
    if (user?.avatarUrl) {
      setPreview(user.avatarUrl);
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning('Por favor, selecione uma imagem primeiro.');
      return;
    }
    if (!user) {
      toast.error('Usuário não encontrado. Tente fazer login novamente.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('userId', String(user.id));

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao enviar imagem.');
      }

      toast.success('Avatar atualizado com sucesso!');
      // A foto no menu (que usa SWR) será atualizada automaticamente na próxima revalidação
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ocorreu um erro inesperado.');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center p-10 text-gray-500">Carregando perfil...</div>;
  }

  if (!user) {
    // O useEffect já deve ter redirecionado, mas é uma garantia
    return <div className="text-center p-10 text-gray-500">Usuário não encontrado.</div>;
  }

  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-6 font-sans flex justify-center items-center">
        <button
    onClick={() => router.push('/costumer/dashboard')}
    className="absolute top-4 left-4 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 transition-colors duration-300 shadow-md"
  >
    ← Voltar
  </button>
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-md">
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Meu Perfil</h1>
        
        <div className="flex flex-col items-center gap-4 mb-6">
          <Image
            src={preview || "/default-avatar.png"}
            alt="Preview do Avatar"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-gray-200"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Escolher outra foto
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Nome</label>
            <p className="text-lg text-gray-700">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg text-gray-700">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">contato</label>
            <p className="text-lg text-gray-700">{user.contact}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
              !selectedFile 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Salvar Alterações
          </button>
          
          {/* ✅ ESTA É A ÚNICA MUDANÇA REAL */}
          <Link href="/costumer/dashboard" className="w-full text-center py-2 px-4 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            Voltar ao Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}