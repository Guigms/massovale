'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isToday, compareAsc, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

// --- TIPOS ---
type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type SlotStatus = 'booked' | 'blocked' | 'available' | 'completed';

type SlotDetails = {
  status: SlotStatus;
  appointmentId?: number;
  patientId?: number; 
  patient?: { name: string; };
};

type Schedule = { [isoDate: string]: SlotDetails; };
type Patient = { id: number; name: string; };

// --- Fetcher genérico para o SWR ---
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Falha ao carregar os dados.');
  }
  return res.json();
});

export default function ClinicoDashboard() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<SlotDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');
  
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [, setPatientLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: userData, isLoading: isLoadingUser, error: userError } = useSWR('/api/userJWT', fetcher);
  const user: UserProfile | null = userData?.user || null;

  const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
  const scheduleUrl = user ? `/api/clinico/schedule?weekStartDate=${weekStartDate}&userId=${user.id}` : null;
  const { data: schedule, isLoading: isLoadingSchedule } = useSWR<Schedule>(scheduleUrl, fetcher, {
    refreshInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      router.push('/login');
    }
  };

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


  useEffect(() => {
    if (patientQuery.length < 3) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      setSelectedPatient(null);
      return;
    }
    setPatientLoading(true);
    if (patientDebounceTimeout.current) clearTimeout(patientDebounceTimeout.current);
    patientDebounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patient?search=${encodeURIComponent(patientQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setPatientResults(data);
          setShowPatientDropdown(true);
        } else { setPatientResults([]); }
      } catch (error) {
        console.error('Erro na busca de pacientes:', error);
        setPatientResults([]);
      } finally { setPatientLoading(false); }
    }, 400);
    return () => { if (patientDebounceTimeout.current) clearTimeout(patientDebounceTimeout.current); };
  }, [patientQuery]);

  const handleAgendar = async () => {
    if (!selectedDate || !selectedPatient || !user) {
      toast.warning('Por favor, selecione um paciente para agendar.');
      return;
    }
    try {
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          patientId: selectedPatient.id,
          clinicoId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { throw new Error(data.message || 'Erro ao agendar consulta.'); }

      toast.success('Agendamento realizado com sucesso!');
      setModalOpen(false);
      setPatientQuery('');
      mutate(scheduleUrl);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Ocorreu um erro inesperado.');
      }
    }
  };

  const handleSetSlotStatus = async (status: 'blocked' | 'available') => {
    if (!selectedDate || !user) return;
    try {
      let res;
      if (status === 'blocked') {
        res = await fetch('/api/clinico/blocked-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: selectedDate.toISOString(), clinicoId: user.id }),
        });
      } else {
        const params = new URLSearchParams({ date: selectedDate.toISOString(), clinicoId: String(user.id) });
        res = await fetch(`/api/clinico/blocked-slots?${params.toString()}`, { method: 'DELETE' });
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Horário ${status === 'blocked' ? 'bloqueado' : 'disponibilizado'} com sucesso!`);
        setModalOpen(false);
        mutate(scheduleUrl);
      } else {
        toast.error(data.message || 'Erro ao atualizar horário.');
      }
    } catch {
      toast.error('Erro de conexão ao atualizar horário.');
    }
  };

  const handleCancelarAgendamento = async (e: React.MouseEvent, appointmentId: number) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      const res = await fetch(`/api/appointment?appointmentId=${appointmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Agendamento cancelado com sucesso.');
        mutate(scheduleUrl);
      } else {
        toast.error(data.message || 'Erro ao cancelar agendamento.');
      }
    } catch {
      toast.error('Erro de conexão ao cancelar agendamento.');
    }
  };
    
  const handleFinalizarAtendimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment?.appointmentId) return;
    try {
      const res = await fetch('/api/clinico/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.appointmentId,
          service,
          notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Falha ao finalizar atendimento.');
      }
      toast.success('Atendimento finalizado com sucesso!');
      setFinalizeModalOpen(false);
      setService('');
      setNotes('');
      mutate(scheduleUrl);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Ocorreu um erro inesperado.');
    }
  };

  const startHour = 8;
  const endHour = 18;
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  if (userError) router.push('/login');
  if (isLoadingUser || !user) return <div className="text-center p-10 text-gray-500">Carregando...</div>;

  return (
    <main className="bg-[#d1d1d1] min-h-screen p-4 md:p-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <Image src="/logover2.png" alt="Logo da Clínica" width={110} height={50} priority/>
        <div className="flex items-center gap-4 self-end md:self-center">
          <span className="text-base md:text-lg font-medium text-gray-700 text-right md:text-left">Bem-vinda, Dr(a).<br className="md:hidden"/> {user.name}!</span>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(p => !p)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Image src={user.avatarUrl || "/default-avatar.png"} alt="avatar" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow object-cover"/>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <Link href="/clinical/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Perfil</Link>
                <Link href="/clinical/consultas" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Relatórios</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Sair</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoadingSchedule ? <div className="text-center p-10 text-gray-500">Carregando agenda...</div> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <section className="col-span-1 xl:col-span-3 bg-white p-4 md:p-6 rounded-2xl shadow">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">← Semana</button>
                <h2 className="text-lg md:text-xl font-semibold text-gray-700 text-center">Semana de {format(currentWeek, 'dd/MM')}</h2>
                <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">Próxima →</button>
              </div>
              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-sm text-gray-500 text-left">Hora</th>
                      {weekDays.map((day) => (
                        <th key={day.toISOString()} className={`border px-3 py-2 text-sm text-center transition-colors ${isToday(day) ? 'bg-blue-100' : ''}`}>
                          <div className={`font-semibold ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>{format(day, 'EEEE', { locale: ptBR })}</div>
                          <div className={`${isToday(day) ? 'text-blue-500' : 'text-gray-500'}`}>{format(day, 'dd/MM')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hour) => (
                      <tr key={hour} className="bg-white hover:bg-gray-50 transition">
                        <td className="border px-3 py-2 font-semibold text-sm text-gray-700">{`${hour.toString().padStart(2, '0')}:00`}</td>
                        {weekDays.map((day) => {
                          const slotDate = new Date(day);
                          slotDate.setHours(hour, 0, 0, 0);
                          const slotDetails = schedule ? schedule[slotDate.toISOString()] : undefined;
                          
                          let content;
                          if (slotDetails?.status === 'completed') {
                            content = (
                                <div className="flex flex-col items-center justify-center p-1">
                                    <div className="bg-gray-200 text-gray-600 text-xs rounded-xl px-2 py-1 font-medium whitespace-nowrap">{slotDetails.patient?.name}</div>
                                    <Link href={`/clinical/patient-history/${slotDetails.patientId}`} className="text-xs text-gray-500 hover:underline mt-1">(Ver Histórico)</Link>
                                </div>
                            );
                          } else if (slotDetails?.status === 'booked') {
                            content = (
                                <div className="flex flex-col items-center justify-center gap-1 p-1">
                                    <div className="bg-blue-100 text-blue-800 text-xs md:text-sm rounded-xl px-2 py-1 font-medium whitespace-nowrap">{slotDetails.patient?.name}</div>
                                    <div className="flex items-center flex-wrap justify-center gap-x-2 gap-y-1 mt-1">
                                        <Link href={`/clinical/patient-history/${slotDetails.patientId}`} className="text-xs text-blue-600 hover:underline">Ver Histórico</Link>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedAppointment(slotDetails); setFinalizeModalOpen(true); }} className="text-xs text-green-600 hover:underline" disabled={!isPast(slotDate) && !isToday(slotDate)}>Finalizar</button>
                                        <button onClick={(e) => handleCancelarAgendamento(e, slotDetails.appointmentId!)} className="text-xs text-red-600 hover:underline">Cancelar</button>
                                    </div>
                                </div>
                            );
                          }
                          else if (slotDetails?.status === 'blocked') content = <div className="bg-red-100 text-red-800 text-xs md:text-sm rounded-xl px-2 py-1 font-medium">Bloqueado</div>;
                          else content = <div className="bg-green-100 text-green-800 text-xs md:text-sm rounded-xl px-2 py-1 font-medium">Disponível</div>;
                          
                          return (
                            <td key={slotDate.toISOString()} className={`border text-center px-1 md:px-2 py-2 transition-all ${slotDetails?.status === 'completed' ? 'bg-gray-100' : 'cursor-pointer hover:bg-blue-50'} ${isToday(day) && slotDetails?.status !== 'completed' ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                if (slotDetails?.status === 'completed' || slotDetails?.status === 'booked') return;
                                setSelectedDate(slotDate);
                                setModalOpen(true);
                                setPatientQuery('');
                                setSelectedPatient(null);
                              }}>{content}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
            <section className="bg-white p-4 md:p-6 rounded-2xl shadow h-fit xl:col-span-1">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-700">Próximos Pacientes (Hoje)</h2>
              {(() => {
                const todayAppointments = schedule ? Object.entries(schedule).filter(([isoDate, details]) => details.status === 'booked' && isSameDay(new Date(isoDate), new Date())).map(([isoDate, details]) => ({ id: details.appointmentId!, date: isoDate, patientName: details.patient!.name })).sort((a, b) => compareAsc(new Date(a.date), new Date(b.date))) : [];
                return (
                  <ul className="space-y-3">
                    {todayAppointments.length > 0 ? todayAppointments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <span className="font-bold text-blue-600 text-sm w-14">{format(new Date(a.date), 'HH:mm')}</span>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl text-sm font-medium">{a.patientName}</div>
                      </li>
                    )) : <li className="text-sm text-gray-500">Nenhum paciente agendado para hoje.</li>}
                  </ul>
                );
              })()}
            </section>
          </div>
        </>
      )}

      {modalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-black text-xl font-semibold mb-4">Selecionado: {format(selectedDate, 'dd/MM/yyyy HH:mm')}</h2>
            <div className="space-y-4">
              <div className="relative">
                <input type="text" placeholder="Buscar paciente..." value={patientQuery} onChange={(e) => { setPatientQuery(e.target.value); setSelectedPatient(null); }} className="text-black border p-2 rounded w-full" onFocus={() => { if (patientResults.length > 0) setShowPatientDropdown(true); }} onBlur={() => { setTimeout(() => setShowPatientDropdown(false), 150); }}/>
                {showPatientDropdown && patientResults.length > 0 && (
                  <ul className="absolute z-10 bg-white text-black border rounded w-full mt-1 max-h-40 overflow-y-auto shadow">
                    {patientResults.map((patient) => (
                      <li key={patient.id} onClick={() => { setSelectedPatient(patient); setPatientQuery(patient.name); setShowPatientDropdown(false); }} className="px-4 py-2 text-sm hover:bg-blue-100 cursor-pointer">{patient.name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={handleAgendar} disabled={!selectedPatient} className={`w-full py-2 rounded text-white transition-colors ${selectedPatient ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}>Agendar para {selectedPatient?.name || '...'}</button>
              <button onClick={() => handleSetSlotStatus('blocked')} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">Bloquear horário</button>
              <button onClick={() => handleSetSlotStatus('available')} className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">Disponibilizar horário</button>
              <button onClick={() => setModalOpen(false)} className="w-full text-gray-500 hover:text-gray-700 text-sm pt-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {finalizeModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50 p-4">
              <form onSubmit={handleFinalizarAtendimento} className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg">
                  <h2 className="text-black text-xl font-semibold mb-2">Finalizar Atendimento</h2>
                  <p className="text-gray-600 mb-4">Paciente: {selectedAppointment.patient?.name}</p>
                  <div className="space-y-4">
                      <div>
                          <label htmlFor="service" className="block text-sm font-medium text-gray-700">Serviço Realizado</label>
                          <input type="text" id="service" value={service} onChange={(e) => setService(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" placeholder="Ex: Massagem Relaxante"/>
                      </div>
                      <div>
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Anotações da Sessão</label>
                          <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black" placeholder="Descreva observações..."/>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                           <button type="button" onClick={() => { setFinalizeModalOpen(false); setService(''); setNotes(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Salvar e Finalizar</button>
                      </div>
                  </div>
              </form>
          </div>
      )}
    </main>
  );
}