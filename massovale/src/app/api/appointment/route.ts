import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST: Cria um novo agendamento
export async function POST(req: NextRequest) {
  const { date, patientId, clinicoId } = await req.json();

  if (!date || !patientId || !clinicoId) {
    return NextResponse.json({ message: 'Dados incompletos para o agendamento.' }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        patientId: Number(patientId),
        clinicoId: Number(clinicoId),
      },
    });

    return NextResponse.json(appointment, { status: 201 });

  } catch (error: unknown) {
    // Trata o erro caso o horário já tenha sido agendado (por causa do @@unique)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Este horário acabou de ser agendado por outra pessoa.' }, { status: 409 });
    }
    
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ message: 'Erro interno ao agendar.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentIdStr = searchParams.get('appointmentId');

    if (!appointmentIdStr) {
      return NextResponse.json({ message: 'O ID do agendamento é obrigatório' }, { status: 400 });
    }

    const appointmentId = parseInt(appointmentIdStr, 10);

    // Verificar se o agendamento existe antes de deletar
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Deletar o agendamento
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ message: 'Agendamento cancelado com sucesso!' });

  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}