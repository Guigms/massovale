'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isToday, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/navigation';

// --- TIPOS ---
type SlotStatus = 'booked' | 'blocked' | 'available';
type SlotDetails = {
  status: SlotStatus;
  appointmentId?: number;
  patient?: { name: string; };
};
type Schedule = { [isoDate: string]: SlotDetails; };
type Patient = { id: number; name: string; };

export default function ClinicoDashboard() {
  const router = useRouter(); 
  const [schedule, setSchedule] = useState<Schedule>({});
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [, setPatientLoading] = useState(false);
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

  const refetchData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      const scheduleUrl = `/api/clinico/schedule?weekStartDate=${weekStartDate}&userId=${userId}`;
      const res = await fetch(scheduleUrl);
      setSchedule(res.ok ? await res.json() : {});
    } catch (error) {
      console.error("Erro ao buscar dados da agenda:", error);
      setSchedule({});
    } finally { setIsLoading(false); }
  }, [userId, currentWeek]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const userRes = await fetch('/api/userJWT');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserId(userData.user.id);
          setUserName(userData.user.name);
        } else { router.push('/login'); }
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
        router.push('/login');
      }
    }
    fetchInitialData();
  }, [router]);

  useEffect(() => { if (userId) { refetchData(); } }, [userId, refetchData]);

  const handleAgendar = async () => {
    if (!selectedDate || !selectedPatient || !userId) {
      alert('Por favor, selecione um paciente para agendar.');
      return;
    }
    try {
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          patientId: selectedPatient.id,
          clinicoId: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { throw new Error(data.message || 'Erro ao agendar consulta.'); }
      alert('Agendamento realizado com sucesso!');
      setModalOpen(false);
      setPatientQuery('');
      await refetchData();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        alert(error.message);
      } else { alert('Ocorreu um erro inesperado.'); }
    }
  };

  const handleSetSlotStatus = async (status: 'blocked' | 'available') => {
    if (!selectedDate || !userId) return;
    try {
      const res = await fetch('/api/clinico/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          clinicoId: userId,
          status,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Horário ${status === 'blocked' ? 'bloqueado' : 'disponibilizado'} com sucesso!`);
        setModalOpen(false);
        await refetchData();
      } else { alert(data.message || 'Erro ao atualizar horário.'); }
    } catch { alert('Erro ao atualizar horário.'); }
  };

  const handleCancelarAgendamento = async (e: React.MouseEvent, appointmentId: number) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      const res = await fetch(`/api/appointment?appointmentId=${appointmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert('Agendamento cancelado com sucesso.');
        await refetchData();
      } else { alert(data.message || 'Erro ao cancelar agendamento.'); }
    } catch { alert('Erro ao cancelar agendamento.'); }
  };

  const startHour = 8;
  const endHour = 18;
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    // ✅ CORREÇÃO APLICADA AQUI: bg-gray-100 foi trocado por bg-[#d1d1d1]
    <main className="bg-[#d1d1d1] min-h-screen p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        
        <Image 
          src="/logover2.png"
          alt="Logo da Clínica"
          width={110}
          height={50}
          priority
        />

        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-gray-700">Bem-vinda, Dr(a). {userName}!</span>
          <img src="/profile.jpeg" alt="avatar" className="w-12 h-12 rounded-full shadow" />
           <button 
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
            title="Sair do sistema"
          >
            Sair
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500"><p>Carregando agenda...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <section className="col-span-1 xl:col-span-3 bg-white p-6 rounded-2xl shadow">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">← Semana Anterior</button>
                <h2 className="text-xl font-semibold text-gray-700">Semana de {format(currentWeek, 'dd/MM/yyyy')}</h2>
                <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-sm text-blue-600 font-medium hover:underline">Próxima Semana →</button>
              </div>

              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-sm text-gray-500 text-left">Hora</th>
                      {weekDays.map((day) => (
                        <th key={day.toISOString()} className={`border px-3 py-2 text-sm text-center transition-colors ${isToday(day) ? 'bg-blue-100' : ''}`}>
                          <div className={`font-semibold ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>{format(day, 'EEEE', {locale: ptBR})}</div>
                          <div className={` ${isToday(day) ? 'text-blue-500' : 'text-gray-500'}`}>{format(day, 'dd/MM')}</div>
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
                          const slotDetails = schedule[slotDate.toISOString()];

                          let content;
                          if (slotDetails?.status === 'booked') {
                            content = (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="bg-blue-100 text-blue-800 text-sm rounded-xl px-2 py-1 font-medium">
                                  {slotDetails.patient?.name}
                                </div>
                                <button
                                  onClick={(e) => handleCancelarAgendamento(e, slotDetails.appointmentId!)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Cancelar
                                </button>
                              </div>
                            );
                          } else if (slotDetails?.status === 'blocked') {
                            content = (
                              <div className="bg-red-100 text-red-800 text-sm rounded-xl px-2 py-1 font-medium">
                                Bloqueado
                              </div>
                            );
                          } else {
                            content = (
                              <div className="bg-green-100 text-green-800 text-sm rounded-xl px-2 py-1 font-medium">
                                Disponível
                              </div>
                            );
                          }

                          return (
                            <td
                              key={slotDate.toISOString()}
                              className={`border text-center px-2 py-2 cursor-pointer hover:bg-blue-50 transition-all ${isToday(day) ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedDate(slotDate);
                                setModalOpen(true);
                                setPatientQuery('');
                                setSelectedPatient(null);
                              }}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
            <section className="bg-white p-6 rounded-2xl shadow h-fit xl:col-span-1">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Próximos Pacientes (Hoje)</h2>
              {(() => {
                const todayAppointments = Object.entries(schedule)
                  .filter(([isoDate, details]) =>
                    details.status === 'booked' && isSameDay(new Date(isoDate), new Date())
                  )
                  .map(([isoDate, details]) => ({
                    id: details.appointmentId!,
                    date: isoDate,
                    patientName: details.patient!.name,
                  }))
                  .sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)));

                return (
                  <ul className="space-y-3">
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((a) => (
                        <li key={a.id} className="flex items-center gap-3">
                          <span className="font-bold text-blue-600 text-sm w-14">{format(new Date(a.date), 'HH:mm')}</span>
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl text-sm font-medium">
                            {a.patientName}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500">Nenhum paciente agendado para hoje.</li>
                    )}
                  </ul>
                );
              })()}
            </section>
          </div>
        </>
      )}

      {modalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-black text-xl font-semibold mb-4">
              Selecionado: {format(selectedDate, 'dd/MM/yyyy HH:mm')}
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar paciente pelo nome..."
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setSelectedPatient(null);
                  }}
                  className="text-black border p-2 rounded w-full"
                  onFocus={() => { if (patientResults.length > 0) setShowPatientDropdown(true); }}
                  onBlur={() => { setTimeout(() => setShowPatientDropdown(false), 150); }}
                />
                {showPatientDropdown && patientResults.length > 0 && (
                  <ul className="absolute z-10 bg-white text-black border rounded w-full mt-1 max-h-40 overflow-y-auto shadow">
                    {patientResults.map((patient) => (
                      <li
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientQuery(patient.name);
                          setShowPatientDropdown(false);
                        }}
                        className="px-4 py-2 text-sm hover:bg-blue-100 cursor-pointer"
                      >
                        {patient.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={handleAgendar}
                disabled={!selectedPatient}
                className={`w-full py-2 rounded text-white transition-colors ${
                  selectedPatient ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                Agendar para {selectedPatient?.name || '...'}
              </button>
              <button
                onClick={() => handleSetSlotStatus('blocked')}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Bloquear horário
              </button>
              <button
                onClick={() => handleSetSlotStatus('available')}
                className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
              >
                Disponibilizar horário
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-gray-500 hover:text-gray-700 text-sm pt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}