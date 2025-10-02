'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';


// --- TIPOS ---
type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

// ✅ TIPO ATUALIZADO
type Clinico = { 
  id: number; 
  name: string; 
  avatarUrl?: string | null; // Adicionado avatarUrl
};

type AvailabilitySlot = { date: string; status: 'free' | 'booked' | 'blocked'; };
type MyAppointment = {
  id: number;
  date: string;
  clinico: { name: string; };
};

// --- Fetcher para o SWR ---
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Falha ao buscar os dados.');
  }
  return res.json();
});

export default function PacienteDashboard() {
  const router = useRouter();
  
  // --- Estados do Componente ---
  const [selectedClinico, setSelectedClinico] = useState<Clinico | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // --- Gerenciamento de dados com SWR ---
  const { data: userData, error: userError } = useSWR<{user: UserProfile}>('/api/userJWT', fetcher);
  const { data: clinicos, error: clinicosError } = useSWR<Clinico[]>('/api/clinicos', fetcher);
  const { data: myAppointments, error: appointmentsError } = useSWR<MyAppointment[]>('/api/patient/myAppointment', fetcher);
  
  const availabilityUrl = selectedClinico ? `/api/availability?clinicoId=${selectedClinico.id}&startDate=${format(currentWeek, 'yyyy-MM-dd')}` : null;
  const { data: availability, isLoading: isLoadingAvailability } = useSWR<AvailabilitySlot[]>(availabilityUrl, fetcher);

  const user = userData?.user;

  // Efeito para lidar com erro de autenticação
  useEffect(() => {
    if (userError) {
      router.push('/login');
    }
  }, [userError, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      router.push('/login');
    }
  };

  // Efeito para fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);



  const handleAgendar = async (slot: AvailabilitySlot) => {
    if (!user || !selectedClinico) return;
    if (!confirm(`Confirmar agendamento com ${selectedClinico.name} em ${format(new Date(slot.date), 'dd/MM/yyyy \'às\' HH:mm')}?`)) return;

    if (isPast(new Date(slot.date))) {
    toast.error('Não é possível agendar em um horário que já passou.');
    return;
  }

    const dateInISOString = new Date(slot.date).toISOString();

    try {
      await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateInISOString, patientId: user.id, clinicoId: selectedClinico.id }),
      });
      toast.success('Agendado com sucesso!');
      mutate('/api/patient/myAppointment');
      mutate(availabilityUrl);
    } catch (error) {
      if(error instanceof Error) toast.error(error.message);
    }
  };

  const handleCancelar = async (appointmentId: number) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      await fetch(`/api/appointment?appointmentId=${appointmentId}`, { method: 'DELETE' });
      toast.success('Agendamento cancelado com sucesso!');
      mutate('/api/patient/myAppointment');
      mutate(availabilityUrl);
    } catch (error) {
      if(error instanceof Error) toast.error(error.message);
    }
  };

  // --- Constantes de Renderização ---
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i));

  // --- Renderização da Tela de Seleção de Clínico ---
  if (!selectedClinico) {
    return (
      <main className="bg-[#d1d1d1] min-h-screen flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center">
            <Image src="/logover2.png" alt="Logo da Clínica" width={140} height={60} priority className="mx-auto" />
            <h1 className="text-2xl font-bold text-zinc-800 mt-4">Bem-vindo(a), {user?.name}!</h1>
            <p className="text-zinc-600 mb-8">Selecione um profissional para ver a agenda.</p>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-3">
          {!clinicos && !clinicosError && <p className="text-center text-zinc-500">Carregando profissionais...</p>}
          {clinicos?.map(clinico => (
            // ✅ BOTÃO DE SELEÇÃO ATUALIZADO COM FOTO
            <button 
                key={clinico.id} 
                onClick={() => setSelectedClinico(clinico)} 
                className="w-full text-left p-4 rounded-lg bg-gray-100 hover:bg-blue-100 transition-colors flex items-center gap-4"
            >
              <Image 
                src={clinico.avatarUrl || '/default-avatar.png'} 
                alt={`Foto de ${clinico.name}`}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-zinc-800">{clinico.name}</p>
                <p className="text-sm text-zinc-500">Massoterapeuta</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-800 mt-8">Sair</button>
      </main>
    );
  }

  // --- Renderização do Dashboard Principal do Paciente ---
  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <Image src="/logover2.png" alt="Logo da Clínica" width={110} height={50} priority />
        <div className="flex items-center gap-4 self-end md:self-center">
          <span className="text-base md:text-lg font-medium text-zinc-700 text-right md:text-left">Bem-vindo(a),<br className="md:hidden"/> {user?.name}!</span>
           <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Image
                src={user?.avatarUrl || "/default-avatar.png"}
                alt="avatar"
                width={48}
                height={48}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow object-cover"
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <Link href="/costumer/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Meu Perfil
                </Link>
                <Link href="/costumer/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Histórico</Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <section className="col-span-1 xl:col-span-3 bg-white p-4 md:p-6 rounded-2xl shadow">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4">
            <button onClick={() => setSelectedClinico(null)} className="text-sm text-blue-600 font-medium hover:underline self-start">← Trocar de Clínico</button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 order-first md:order-none">Agenda de {selectedClinico.name}</h2>
            <div className="flex items-center gap-2 self-end md:self-center">
              <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">← Anterior</button>
              <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">Próxima →</button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl">
             {isLoadingAvailability ? (<div className="text-center p-10 text-zinc-500">Carregando agenda...</div>) : (
                <table className="min-w-full border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="p-1 md:p-2"></th>
                    {weekDays.map(day => (
                      <th key={day.toISOString()} className={`p-2 rounded-lg transition-colors ${isToday(day) ? 'bg-blue-100' : 'bg-gray-50'}`}>
                        <p className={`font-semibold text-xs md:text-sm ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>{format(day, 'EEE', { locale: ptBR })}</p>
                        <p className={`font-normal text-xs ${isToday(day) ? 'text-blue-500' : 'text-gray-500'}`}>{format(day, 'dd/MM')}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map(hour => (
                    <tr key={hour}>
                      <td className="p-1 md:p-2 text-center text-xs font-semibold text-gray-500">{`${hour}:00`}</td>
                      {weekDays.map(day => {
                        const slotDate = `${format(day, 'yyyy-MM-dd')}T${String(hour).padStart(2, '0')}:00`;
                        const slot = availability?.find(s => s.date.startsWith(slotDate));
                        
                        return (
                          <td key={day.toISOString() + hour} className="p-1">
                            {slot ? (
                              <button
                                onClick={() => handleAgendar(slot)}
                                disabled={slot.status !== 'free'}
                                className={`w-full p-2 rounded-md text-xs font-semibold text-center transition-all ${
                                  slot.status === 'free' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-700 cursor-not-allowed'
                                }`}
                              >
                                {slot.status === 'free' ? 'Agendar' : 'Ocupado'}
                              </button>
                            ) : (
                              <div className="w-full p-2 rounded-md bg-gray-100 h-9"></div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
             )}
          </div>
        </section>

        <aside className="bg-white p-4 md:p-6 rounded-2xl shadow h-fit">
          <h2 className="text-xl font-semibold mb-4 text-zinc-800">Meus Agendamentos</h2>
          <div className="space-y-3">
            {!myAppointments && !appointmentsError && <div className="text-sm text-center text-zinc-500 py-4">Carregando...</div>}
            {appointmentsError && <div className="text-sm text-center text-red-500 py-4">Falha ao carregar.</div>}
            {myAppointments && myAppointments.length > 0 ? (
              myAppointments.map(app => (
                <div key={app.id} className="p-3 rounded-lg bg-gray-50 border">
                  <p className="font-bold text-zinc-700">{format(new Date(app.date), "eeee, dd 'de' MMMM", { locale: ptBR })}</p>
                  <p className="text-zinc-600">às {format(new Date(app.date), 'HH:mm')} com {app.clinico.name}</p>
                  <button onClick={() => handleCancelar(app.id)} className="text-xs text-red-500 hover:underline mt-2">Cancelar consulta</button>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4">Você não possui agendamentos futuros.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}