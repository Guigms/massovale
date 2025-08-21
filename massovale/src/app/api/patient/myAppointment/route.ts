// /src/app/api/patient/my-appointments/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  // 1. Pega o token do cookie
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // 2. Decodifica o token para obter o ID do paciente
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const patientId = decoded.userId;

    // 3. Busca no banco todos os agendamentos futuros para esse paciente
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId,
        date: {
          // Busca apenas agendamentos de hoje em diante
          gte: new Date(),
        },
      },
      // Inclui o nome do clínico para cada agendamento
      include: {
        clinico: {
          select: {
            name: true,
          },
        },
      },
      // Ordena do mais próximo para o mais distante
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