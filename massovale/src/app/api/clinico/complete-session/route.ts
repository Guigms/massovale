// src/app/api/clinico/complete-session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  const { appointmentId, service, notes } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ message: 'ID do agendamento é obrigatório.' }, { status: 400 });
  }

  try {
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: Number(appointmentId),
      },
      data: {
        service: service, // Salva o serviço realizado
        notes: notes,     // Salva as anotações
        status: 'CONCLUIDO', // Muda o status para CONCLUIDO
      },
    });

    return NextResponse.json(updatedAppointment, { status: 200 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
    }
    console.error("Erro ao finalizar atendimento:", error);
    return NextResponse.json({ message: 'Erro interno ao finalizar atendimento.' }, { status: 500 });
  }
}