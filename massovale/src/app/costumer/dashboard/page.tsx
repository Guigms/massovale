'use client';

import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

type SlotStatus = 'booked' | 'blocked' | 'available';

type SlotDetails = {
  status: SlotStatus;
  appointmentId?: number;
  patientName?: string;
};

type WeekSlots = {
  [date: string]: {
    [hour: string]: SlotDetails;
  };
};

type Patient = {
  id: number;
  name: string;
};

export default function WeeklyScheduler() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [slots, setSlots] = useState<WeekSlots>({});
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStart, i)
  );

  const hours = Array.from({ length: 12 }).map((_, i) => `${8 + i}:00`);

  useEffect(() => {
    fetch(`/api/schedule?start=${currentWeekStart.toISOString()}`)
      .then((res) => res.json())
      .then((data: WeekSlots) => setSlots(data));
  }, [currentWeekStart]);

  const handleSlotClick = (date: string, hour: string) => {
    setSelectedSlot({ date, hour });
    setIsModalOpen(true);
    setSelectedPatient(null);
    setPatientQuery('');
    setPatientResults([]);
    setShowPatientDropdown(false);
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedPatient) return;
    await fetch('/api/appointment', {
      method: 'POST',
      body: JSON.stringify({
        date: `${selectedSlot.date}T${selectedSlot.hour}`,
        userId: selectedPatient.id,
        clinicoId: 1,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (patientQuery.trim().length === 0) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/patient?search=${encodeURIComponent(patientQuery)}`);
      const data = await res.json();
      setPatientResults(data);
      setShowPatientDropdown(true);
    }, 400);
    return () => clearTimeout(timeout);
  }, [patientQuery]);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>Semana anterior</button>
        <h2 className="text-lg font-semibold">
          Semana de {format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>Próxima semana</button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-3 py-2 text-sm text-gray-500 text-left">Hora</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className="border px-3 py-2 text-sm text-gray-700 text-center">
                  <div className="font-semibold">{format(day, 'EEEE', { locale: ptBR })}</div>
                  <div className="text-gray-500 text-sm">{format(day, 'dd/MM')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="border px-3 py-2 text-sm text-gray-500">{hour}</td>
                {weekDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const slot = slots[dateKey]?.[hour];
                  const status = slot?.status ?? 'available';

                  let bgColor = 'bg-white';
                  if (status === 'booked') bgColor = 'bg-red-200';
                  else if (status === 'blocked') bgColor = 'bg-gray-300';
                  else if (status === 'available') bgColor = 'bg-green-100';

                  return (
                    <td
                      key={day.toISOString()}
                      className={`border text-center px-2 py-1 cursor-pointer text-sm ${bgColor}`}
                      onClick={() => handleSlotClick(dateKey, hour)}
                    >
                      {status === 'booked' && slot?.patientName}
                      {status === 'blocked' && 'Indisponível'}
                      {status === 'available' && 'Disponível'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
            <h3 className="text-lg font-semibold mb-2">
              Agendar para {format(parseISO(`${selectedSlot.date}T${selectedSlot.hour}`), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </h3>
            <label className="block mb-2">
              Buscar paciente:
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setSelectedPatient(null);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                className="w-full border p-2 mt-1 rounded"
                placeholder="Digite o nome do paciente"
              />
              {showPatientDropdown && patientResults.length > 0 && (
                <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto shadow">
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
            </label>
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded">
                Cancelar
              </button>
              <button
                onClick={handleBook}
                disabled={!selectedPatient}
                className={`px-4 py-2 rounded ${
                  selectedPatient ? 'bg-blue-600 text-white' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
