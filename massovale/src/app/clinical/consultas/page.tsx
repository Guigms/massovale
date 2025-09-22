'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// --- TIPOS ---
type UserProfile = {
  id: number;
  name: string;
};

type Patient = {
  id: number;
  name: string;
};

type ReportAppointment = {
  id: number;
  date: string;
  service: string | null;
  notes: string | null;
  patient: {
    name: string;
  };
};

// --- Fetcher ---
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Falha ao carregar os dados.');
  return res.json();
});

export default function ReportsPage() {
  const router = useRouter();
  
  // --- Estados dos Filtros ---
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Estado para acionar a busca ---
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // --- SWR para buscar dados do usuário e do relatório ---
  const { data: userData, error: userError } = useSWR('/api/userJWT', fetcher);
  const user: UserProfile | null = userData?.user;

  // Monta a URL da API com os filtros
  const query = new URLSearchParams(filters).toString();
  const reportUrl = user ? `/api/clinico/consultas?${query}` : null;
  const { data: reportData, isLoading: isLoadingReport, error: reportError } = useSWR(reportUrl, fetcher);

  // Busca de pacientes para o filtro
  useEffect(() => {
    if (patientQuery.length < 2) {
      setPatientResults([]);
      return;
    }
    if (patientDebounceTimeout.current) clearTimeout(patientDebounceTimeout.current);
    patientDebounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patient?search=${encodeURIComponent(patientQuery)}`);
        if (res.ok) setPatientResults(await res.json());
      } catch {
        toast.error("Erro ao buscar pacientes");
      }
    }, 400);
  }, [patientQuery]);

  // Função para aplicar os filtros e acionar o SWR
  const handleGenerateReport = () => {
    if (!user) return;
    const newFilters: Record<string, string> = { clinicoId: String(user.id) };
    if (startDate && endDate) {
      newFilters.startDate = startDate;
      newFilters.endDate = endDate;
    }
    if (selectedPatient) {
      newFilters.patientId = String(selectedPatient.id);
    }
    setFilters(newFilters);
  };
  
  // Limpar filtro de paciente
  const clearPatientFilter = () => {
    setSelectedPatient(null);
    setPatientQuery('');
    // Gera o relatório novamente sem o filtro de paciente
    handleGenerateReport(); 
  };
  
  if (userError) router.push('/login');
  if (!user) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Relatório de Atendimentos</h1>
            <button
              onClick={() => router.push('/clinical/dashboard')}
              className="bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-50 transition-colors"
            >
              ← Voltar ao Dashboard
            </button>
        </div>

        {/* --- Card de Filtros --- */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                {/* Filtro Data Inicial */}
                <div>
                    <label className="block text-sm font-medium text-gray-600">Data Inicial</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full border border-gray-300 p-2 rounded-lg text-gray-700"/>
                </div>
                {/* Filtro Data Final */}
                <div>
                    <label className="block text-sm font-medium text-gray-600">Data Final</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full border border-gray-300 p-2 rounded-lg text-gray-700"/>
                </div>
                {/* Filtro Paciente */}
                <div className="relative md:col-span-1 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-600">Paciente (opcional)</label>
                    <input type="text" placeholder="Digite para buscar..." value={patientQuery} onChange={e => setPatientQuery(e.target.value)} onFocus={() => setShowPatientDropdown(true)} onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)} className="mt-1 w-full border border-gray-300 p-2 rounded-lg text-black"/>
                    {showPatientDropdown && patientResults.length > 0 && (
                      <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {patientResults.map(p => (
                          <li key={p.id} onClick={() => { setSelectedPatient(p); setPatientQuery(p.name); setShowPatientDropdown(false); }} className="px-4 py-2 text-sm hover:bg-blue-100 text-black cursor-pointer">{p.name}</li>
                        ))}
                      </ul>
                    )}
                </div>
                {/* Botões */}
                <div className="flex gap-2">
                    <button onClick={handleGenerateReport} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Gerar Relatório</button>
                    <button onClick={clearPatientFilter} title="Limpar filtro de paciente" className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300">X</button>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
            {isLoadingReport && <p className="text-center">Carregando relatório...</p>}
            {reportError && <p className="text-center text-black">Nenhum filtro aplicado.</p>}
            {reportData && (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço Realizado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anotações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.length > 0 ? reportData.map((app: ReportAppointment) => (
                    <tr key={app.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{format(new Date(app.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{app.patient.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{app.service || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{app.notes || 'N/A'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">Nenhum atendimento concluído para os filtros selecionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
        </div>

      </div>
    </main>
  );
}