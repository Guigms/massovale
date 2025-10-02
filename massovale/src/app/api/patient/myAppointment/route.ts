// DENTRO DE: src/app/api/patient/myAppointment/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { startOfDay } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {

  process.env.TZ = 'UTC';

  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const patientId = decoded.userId;

    const startOfToday = startOfDay(new Date());


    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId,

        date: {
          gte: startOfToday,
        },

        status: 'AGENDADO',
      },
      include: {
        clinico: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(appointments);

  } catch (error) {
    console.error("Erro ao buscar agendamentos do paciente:", error);
    return NextResponse.json({ error: 'Token inválido ou erro interno' }, { status: 401 });
  }
}