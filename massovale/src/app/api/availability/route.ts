// /app/api/availability/route.ts -> Apenas a função GET, que é a única que precisa mudar.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const clinicoId = Number(searchParams.get('clinicoId'));
  const startDateParam = searchParams.get('startDate');

  if (!clinicoId || !startDateParam) {
    return NextResponse.json({ message: 'ID do clínico e data de início são obrigatórios.' }, { status: 400 });
  }

  // ✅ AQUI ESTÁ A CORREÇÃO DEFINITIVA
  const weekStart = startOfDay(new Date(`${startDateParam}T00:00:00`));
  const weekEnd = endOfDay(addDays(weekStart, 4));

  try {
    const [bookedAppointments, blockedSlots] = await Promise.all([
      prisma.appointment.findMany({
        where: { clinicoId, date: { gte: weekStart, lte: weekEnd } },
        include: { patient: { select: { name: true } } },
      }),
      prisma.blockedSlot.findMany({
        where: { clinicoId, date: { gte: weekStart, lte: weekEnd } },
      }),
    ]);
    
    // ... o resto do código continua exatamente igual ...

    const bookedTimestamps = new Set(bookedAppointments.map(a => a.date.getTime()));
    const blockedTimestamps = new Set(blockedSlots.map(b => b.date.getTime()));

    const allPossibleSlots = [];
    const workingHours = Array.from({ length: 11 }, (_, i) => 8 + i);

    for (let i = 0; i < 5; i++) {
      const currentDay = addDays(weekStart, i);
      for (const hour of workingHours) {
        const slotDate = new Date(currentDay);
        slotDate.setUTCHours(hour + 3, 0, 0, 0);
        allPossibleSlots.push(slotDate);
      }
    }

    const finalCalendar = allPossibleSlots.map(slotDate => {
      const timestamp = slotDate.getTime();
      let status: 'free' | 'booked' | 'blocked' = 'free';
      let appointmentDetails: { patientName: string } | null = null;

      if (blockedTimestamps.has(timestamp)) {
        status = 'blocked';
      } else if (bookedTimestamps.has(timestamp)) {
        status = 'booked';
        const appointment = bookedAppointments.find(a => a.date.getTime() === timestamp);
        appointmentDetails = { patientName: appointment?.patient.name || 'Desconhecido' };
      }

      return {
        date: `${format(slotDate, 'yyyy-MM-dd')}T${String(slotDate.getUTCHours() - 3).padStart(2, '0')}:00`,
        status,
        appointmentDetails,
      };
    });

    return NextResponse.json(finalCalendar);

  } catch (error) {
    console.error("Erro ao calcular disponibilidade:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}