import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Não precisamos mais do endOfWeek, vamos removê-lo

// --- TIPOS (sem alterações) ---
type SlotDetails = {
  status: 'booked' | 'blocked';
  appointmentId?: number;
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
    
    // Para evitar problemas de fuso horário, tratamos a data como UTC desde o início.
    const weekStart = new Date(`${weekStartDateStr}T00:00:00.000Z`);

    // ✅ CORREÇÃO: Cálculo manual e robusto do fim da semana
    // Pegamos a data de início e adicionamos 6 dias para chegar ao domingo.
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999); // Garantimos que cobre até o último milissegundo do domingo

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicoId: userId,
        date: {
          gte: weekStart,
          lte: weekEnd, // Usamos lte (menor ou igual) para incluir o domingo
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
          lte: weekEnd, // Usamos lte (menor ou igual) para incluir o domingo
        },
      },
    });

    // O restante do código não precisa de alterações
    const schedule: Schedule = {};

    appointments.forEach(app => {
      schedule[app.date.toISOString()] = {
        status: 'booked',
        appointmentId: app.id,
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