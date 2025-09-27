// src/app/clinical/patient-history/[patientId]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// Tipos para os dados que virão da API
type Appointment = {
  id: number;
  date: string;
  status: 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';
  service: string | null;
  notes: string | null;
};

type PatientHistory = {
  id: number;
  name: string;
  email: string;
  contact: string;
  avatarUrl: string | null;
  appointmentsAsPaciente: Appointment[];
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PatientHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId;

  const { data: history, error, isLoading } = useSWR<PatientHistory>(
    patientId ? `/api/clinico/patient-history/${patientId}` : null,
    fetcher
  );

  if (error) return <div className="p-10 text-center text-red-500">Falha ao carregar o histórico.</div>;
  if (isLoading) return <div className="p-10 text-center">Carregando histórico...</div>;

  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Botão de Voltar */}
        <button
          onClick={() => router.push('/clinical/dashboard')}
          className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-50 transition-colors mb-6"
        >
          ← Voltar ao Dashboard
        </button>

        {/* Card de Informações do Paciente */}
        {history && (
          <div className="bg-white p-6 rounded-2xl shadow mb-8 flex items-center gap-6">
            <Image
              src={history.avatarUrl || '/default-avatar.png'}
              alt={`Foto de ${history.name}`}
              width={80}
              height={80}
              className="rounded-full object-cover border-4 border-gray-200"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{history.name}</h1>
              <p className="text-gray-600">{history.email}</p>
              <p className="text-gray-600">{history.contact}</p>
            </div>
          </div>
        )}

        {/* Linha do Tempo de Atendimentos */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Atendimentos</h2>
<div className="space-y-6">
  {history && history.appointmentsAsPaciente && history.appointmentsAsPaciente.length > 0 ? (
    history.appointmentsAsPaciente.map(app => (
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
        {app.status === 'CONCLUIDO' && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p><strong>Serviço:</strong> {app.service || 'Não informado'}</p>
            <p className="mt-1"><strong>Anotações:</strong> {app.notes || 'Nenhuma'}</p>
          </div>
        )}
      </div>
    ))
  ) : (
    <p className="text-center text-gray-500 py-4">Nenhum atendimento encontrado para este paciente.</p>
  )}
</div>
        </div>
      </div>
    </main>
  );
}