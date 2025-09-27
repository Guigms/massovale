// src/app/costumer/history/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// Tipos para os dados que virão da API
type AppointmentHistory = {
  id: number;
  date: string;
  status: 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';
  service: string | null;
  clinico: {
    name: string;
    avatarUrl: string | null;
  };
};

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Falha ao carregar os dados.');
  }
  return res.json();
});


export default function PatientHistoryPage() {
  const router = useRouter();
  
  const { data: history, error, isLoading } = useSWR<AppointmentHistory[]>(
    '/api/patient/history',
    fetcher
  );

  if (error) return <div className="p-10 text-center text-red-500">Falha ao carregar seu histórico.</div>;
  if (isLoading) return <div className="p-10 text-center">Carregando histórico...</div>;

  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Meu Histórico</h1>
            <button
              onClick={() => router.push('/costumer/dashboard')}
              className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              ← Voltar ao Dashboard
            </button>
        </div>

        {/* Linha do Tempo de Atendimentos */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="space-y-6">
            {history && history.length > 0 ? (
              history.map(app => (
                <div key={app.id} className={`border-l-4 pl-4 transition-all duration-300
                  ${app.status === 'CONCLUIDO' ? 'border-green-500' : ''}
                  ${app.status === 'AGENDADO' ? 'border-blue-500' : ''}
                  ${app.status === 'CANCELADO' ? 'border-red-500' : ''}
                `}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-700">
                      {format(new Date(app.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full
                      ${app.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : ''}
                      ${app.status === 'AGENDADO' ? 'bg-blue-100 text-blue-800' : ''}
                      ${app.status === 'CANCELADO' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {app.status}
                    </span>
                  </div>
                   <div className="flex items-center gap-2 mt-2">
                      <Image 
                        src={app.clinico.avatarUrl || '/default-avatar.png'} 
                        alt={`Foto de ${app.clinico.name}`}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <p className="text-sm text-gray-500">com {app.clinico.name}</p>
                   </div>
                  {app.status === 'CONCLUIDO' && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p><strong>Serviço:</strong> {app.service || 'Não informado'}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Você ainda não possui atendimentos em seu histórico.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}