'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';

type AppointmentWithDetails = {
  id: number;
  availability: {
    date: string;
  };
  user: {
    name: string;
  };
};

type Availability = {
  id: number;
  date: string;
};

type Patient = {
  id: number;
  name: string;
};

export default function ClinicoDashboard() {
  // Estados gerais
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [userName, setUserName] = useState('Carla'); // Vai vir da API
  const [userId, setUserId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // --- Estado para busca dinâmica de pacientes ---
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const patientDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Busca paciente dinâmica com debounce
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
        } else {
          setPatientResults([]);
          setShowPatientDropdown(false);
        }
      } catch (error) {
        console.error('Erro na busca de pacientes:', error);
        setPatientResults([]);
        setShowPatientDropdown(false);
      } finally {
        setPatientLoading(false);
      }
    }, 400);

    return () => {
      if (patientDebounceTimeout.current) clearTimeout(patientDebounceTimeout.current);
    };
  }, [patientQuery]);

  // Função para recarregar agendamentos e disponibilidades
  const refetchData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const weekStartDate = format(currentWeek, 'yyyy-MM-dd');
      const appointmentUrl = `/api/clinico/appointment?weekStartDate=${weekStartDate}&userId=${userId}`;
      const availabilityUrl = `/api/clinico/availability?weekStartDate=${weekStartDate}&userId=${userId}`;

      const [appointmentRes, availabilityRes] = await Promise.all([
        fetch(appointmentUrl),
        fetch(availabilityUrl),
      ]);

      if (appointmentRes.ok) setAppointments(await appointmentRes.json());
      if (availabilityRes.ok) setAvailabilities(await availabilityRes.json());
    } catch (error) {
      console.error("Erro ao buscar dados da agenda:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentWeek]);

  // Busca inicial do usuário
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const userRes = await fetch('/api/userJWT');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserId(userData.user.id);
          setUserName(userData.user.name);
        } else {
          console.error('Usuário não autenticado.');
        }
      } catch (error) {
        console.error("Erro ao buscar dados iniciais:", error);
      }
    }
    fetchInitialData();
  }, []);

  // Recarrega agenda quando userId ou currentWeek mudam
  useEffect(() => {
    refetchData();
  }, [refetchData]);

  // Handlers do modal
  const handleAgendar = async () => {
    if (!selectedDate || !selectedPatient) {
      alert('Selecione uma data e um paciente válidos');
      return;
    }

    try {
      const res = await fetch('/api/clinico/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          userId: selectedPatient.id,
          clinicoId: userId,
        }),
      });

      if (res.ok) {
        alert('Agendado com sucesso!');
        setModalOpen(false);
        setSelectedPatient(null);
        setPatientQuery('');
        setShowPatientDropdown(false);
        await refetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao agendar.');
      }
    } catch (error) {
      alert('Erro ao tentar agendar.');
      console.error(error);
    }
  };

  const handleBloquear = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch('/api/clinico/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, userId }),
      });
      const data = await res.json();
      alert(data.message || 'Horário bloqueado!');
      setModalOpen(false);
      await refetchData();
    } catch (error) {
      alert('Erro ao bloquear horário.');
      console.error(error);
    }
  };

  const handleDisponibilizar = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch('/api/clinico/availability', {
        method: 'DELETE',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, userId }),
      });
      const data = await res.json();
      alert(data.message || 'Horário disponibilizado!');
      setModalOpen(false);
      await refetchData();
    } catch (error) {
      alert('Erro ao disponibilizar horário.');
      console.error(error);
    }
  };

  // Renderização do calendário
  const startHour = 8;
  const endHour = 18;
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <main className="bg-gray-100 min-h-screen p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">Meu Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-gray-700">Bem-vinda, Dr(a). {userName}!</span>
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="avatar" className="w-12 h-12 rounded-full shadow" />
        </div>
      </div>

      {isLoading && (
        <div className="text-center p-10 text-gray-500">
          <p>Carregando agenda...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Cards resumo podem ficar aqui */}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <section className="col-span-1 xl:col-span-3 bg-white p-6 rounded-2xl shadow">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  ← Semana Anterior
                </button>
                <h2 className="text-xl font-semibold text-gray-700">
                  Semana de {format(currentWeek, 'dd/MM/yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Próxima Semana →
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 border text-left text-sm font-semibold text-gray-600"></th>
                      {weekDays.map((d) => (
                        <th
                          key={d.toDateString()}
                          className="p-3 border text-center text-sm font-semibold text-gray-600"
                        >
                          {format(d, 'EEE, dd/MM')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hour) => (
                      <tr key={hour} className="bg-white hover:bg-gray-50 transition">
                        <td className="border px-3 py-2 font-semibold text-sm text-gray-700">{`${hour
                          .toString()
                          .padStart(2, '0')}:00`}</td>
                        {weekDays.map((d) => {
                          const slot = new Date(d);
                          slot.setHours(hour, 0, 0, 0);
                          const foundAppointment = appointments.find(
                            (a) => new Date(a.availability.date).getTime() === slot.getTime()
                          );
                          const foundAvailability = availabilities.find(
                            (a) => new Date(a.date).getTime() === slot.getTime()
                          );
                          const isBooked = !!foundAppointment;
                          const isBlocked = foundAvailability && !isBooked;

                          return (
                            <td
                              key={d.toISOString() + hour}
                              className="border text-center px-2 py-2 cursor-pointer hover:bg-blue-50 transition-all"
                              onClick={() => {
                                setSelectedDate(slot);
                                setModalOpen(true);
                                // Reset seleção paciente ao abrir modal
                                setSelectedPatient(null);
                                setPatientQuery('');
                                setShowPatientDropdown(false);
                              }}
                            >
                              {isBooked ? (
                                <div className="bg-blue-100 text-blue-800 text-sm rounded-xl px-2 py-1 font-medium">
                                  {foundAppointment.user.name}
                                </div>
                              ) : isBlocked ? (
                                <div className="bg-red-100 text-red-800 text-sm rounded-xl px-2 py-1 font-medium">
                                  Bloqueado
                                </div>
                              ) : (
                                <div className="bg-green-100 text-green-800 text-sm rounded-xl px-2 py-1 font-medium">
                                  Disponível
                                </div>
                              )}
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
              <ul className="space-y-3">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="font-bold text-blue-600 text-sm w-14">
                      {format(new Date(a.availability.date), 'HH:mm')}
                    </span>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl text-sm font-medium">
                      {a.user.name}
                    </div>
                  </li>
                ))}
              </ul>
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
              {/* Input busca dinâmica */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar paciente pelo nome..."
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setSelectedPatient(null); // Limpa seleção se digitar algo novo
                  }}
                  className="text-black border p-2 rounded w-full"
                  onFocus={() => {
                    if (patientResults.length > 0) setShowPatientDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowPatientDropdown(false), 150);
                  }}
                />
                {patientLoading && (
                  <div className="absolute top-full left-0 bg-white w-full p-2 text-sm text-black">
                    Buscando...
                  </div>
                )}
                {showPatientDropdown && patientResults.length > 0 && (
                  <ul className="absolute top-full left-0 bg-white border rounded w-full max-h-48 overflow-auto z-10">
                    {patientResults.map((patient) => (
                      <li
                        key={patient.id}
                        className="p-2 hover:bg-white text-black cursor-pointer"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientQuery(patient.name);
                          setShowPatientDropdown(false);
                        }}
                      >
                        {patient.name}
                      </li>
                    ))}
                  </ul>
                )}
                {!patientLoading && patientQuery.length >= 3 && patientResults.length === 0 && (
                  <div className="absolute top-full left-0 bg-white w-full p-2 text-sm text-black">
                    Nenhum paciente encontrado.
                  </div>
                )}
              </div>

              <button
                onClick={handleAgendar}
                disabled={!selectedPatient}
                className={`w-full py-2 rounded text-white ${
                  selectedPatient ? 'bg-green-400 hover:bg-green-600' : 'bg-green-200 cursor-not-allowed'
                }`}
              >
                Agendar em nome de paciente
              </button>
              <button
                onClick={handleBloquear}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
              >
                Bloquear horário
              </button>
              <button
                onClick={handleDisponibilizar}
                className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
              >
                Disponibilizar horário
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-gray-500 hover:text-gray-700 text-sm"
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
