'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { EventInput } from '@fullcalendar/core';
import {Button} from '@/components/ui/button';

interface Disponibilidade {
  id: number;
  date: string;
  appointment?: unknown;
  status: 'disponivel' | 'bloqueado' | 'ocupado';
}

export default function ClinicoDashboard() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/availability')
      .then(res => res.json())
      .then((data: Disponibilidade[]) => {
        const formatted = data.map(d => ({
          id: d.id.toString(),
          title: d.status === 'bloqueado'
            ? '⛔ Bloqueado'
            : d.appointment
            ? '🔒 Ocupado'
            : '✅ Disponível',
          start: d.date,
          backgroundColor: d.status === 'bloqueado'
            ? '#f87171'
            : d.appointment
            ? '#fde68a'
            : '#86efac',
          borderColor: '#1f2937',
          textColor: '#000000',
        }));
        setEvents(formatted);
        setLoading(false);
      });
  }, []);

  const handleDateClick = async (arg: DateClickArg) => {
    const action = prompt(`Digite o que deseja fazer em ${arg.dateStr} (disponivel | bloquear):`);

    if (!action || !['disponivel', 'bloquear'].includes(action)) return;

    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 37, // ⚠️ Substituir pelo ID real do clínico autenticado
          date: arg.dateStr,
          status: action === 'bloquear' ? 'bloqueado' : 'disponivel',
        }),
      });

      if (!res.ok) throw new Error('Erro ao criar disponibilidade');
      alert('Ação realizada com sucesso!');
      location.reload();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar horário.');
    }
  };

  return (
    <div className="min-h-screen bg-[#d1d1d1] p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📅 Dashboard do Clínico</h1>
          <div className="flex gap-4">
            <Button variant="default">Pacientes Agendados</Button>
            <Button variant="outline">Cadastrar Paciente Manualmente</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : (
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            editable={false}
            selectable={true}
            selectMirror={true}
            dateClick={handleDateClick}
            events={events}
            headerToolbar={{ start: 'title', center: '', end: 'today prev,next' }}
            slotMinTime="08:00:00"
            slotMaxTime="18:00:00"
            slotDuration="00:30:00"
            height="auto"
            nowIndicator={true}
          />
        )}
      </div>
    </div>
  );
}
