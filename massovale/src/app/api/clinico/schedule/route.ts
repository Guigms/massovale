import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus } from '@prisma/client';

// --- TIPOS ATUALIZADOS ---
type SlotStatus = 'booked' | 'blocked' | 'completed';

type SlotDetails = {
  status: SlotStatus;
  appointmentId?: number;
  patientId?: number;
  patient?: { name:string | null };
};
type Schedule = {
  [key: string]: SlotDetails;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStartDateStr = searchParams.get('weekStartDate');
    const userIdStr = searchParams.get('userId');

    if (!weekStartDateStr || !userIdStr) {
      return NextResponse.json({ message: 'Parâmetros weekStartDate e userId são obrigatórios' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const weekStart = new Date(`${weekStartDateStr}T00:00:00.000Z`);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicoId: userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        patient: { 
          select: { name: true },
        },
      },
    });

    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        clinicoId: userId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const schedule: Schedule = {};

    // ✅ LÓGICA ATUALIZADA AQUI
    appointments.forEach(app => {
      // Mapeia o status do banco de dados para o status do frontend
      const status: SlotStatus = app.status === AppointmentStatus.CONCLUIDO ? 'completed' : 'booked';
      
      schedule[app.date.toISOString()] = {
        status: status,
        appointmentId: app.id,
        patientId: app.patientId,
        patient: { name: app.patient?.name ?? null },
      };
    });

    blockedSlots.forEach(slot => {
      if (!schedule[slot.date.toISOString()]) {
        schedule[slot.date.toISOString()] = {
          status: 'blocked',
        };
      }
    });

    return NextResponse.json(schedule);

  } catch (error) {
    console.error("Erro ao buscar agenda:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}