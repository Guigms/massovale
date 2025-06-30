'use client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

import {
  DateSelectArg,
  EventClickArg,
  EventInput,
} from '@fullcalendar/core';
import { useEffect, useState } from 'react';


export default function PacienteDashboard() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const res = await fetch('/api/agendamentos');
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error('Erro ao buscar agendamentos', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendamentos();
  }, []);

  const handleSelect = async (selectInfo: DateSelectArg) => {
    const now = new Date();
    if (new Date(selectInfo.start) < now) {
      alert('Não é possível agendar no passado.');
      return;
    }

    const title = prompt('Informe o procedimento desejado:');
    if (!title) return;

    const newEvent = {
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    };

    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });

    if (res.ok) {
      const saved = await res.json();
      setEvents(prev => [...prev, saved]);
    } else {
      alert('Erro ao salvar agendamento.');
    }
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const confirmed = confirm(`Deseja cancelar o agendamento: "${clickInfo.event.title}"?`);

    if (!confirmed) return;

    const res = await fetch(`/api/agendamentos/${clickInfo.event.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      clickInfo.event.remove();
    } else {
      alert('Erro ao cancelar o agendamento.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Agenda do Paciente</h1>

      {loading ? (
        <p className="text-center">Carregando agendamentos...</p>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          selectable={true}
          selectMirror={true}
          events={events}
          select={handleSelect}
          eventClick={handleEventClick}
          height="auto"
          locale={ptBrLocale}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          nowIndicator={true}
          allDaySlot={false}
          eventColor="#6366f1"
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth',
          }}
        />
      )}
    </div>
  );
}
