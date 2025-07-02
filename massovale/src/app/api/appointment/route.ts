import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, availabilityId } = await req.json();

    // Verifica se a disponibilidade existe e ainda não foi agendada
    const disponibilidade = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { appointment: true },
    });

    if (!disponibilidade) {
      return NextResponse.json({ error: 'Horário não encontrado.' }, { status: 404 });
    }

    if (disponibilidade.appointment) {
      return NextResponse.json({ error: 'Este horário já está agendado.' }, { status: 400 });
    }

    // Cria o agendamento
    const agendamento = await prisma.appointment.create({
      data: {
        userId,
        availabilityId,
      },
    });

    return NextResponse.json({ message: 'Agendamento realizado com sucesso.', agendamento });
  } catch (error) {
    console.error('Erro ao agendar:', error);
    return NextResponse.json({ error: 'Erro ao agendar horário.' }, { status: 500 });
  }
}

/**
 * DELETE: Cancelar um agendamento (Paciente)
 * Body: { appointmentId, userId }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { appointmentId, userId } = await req.json();

    // Verifica se o agendamento existe e pertence ao usuário
    const agendamento = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });
    }

    if (agendamento.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão para cancelar este agendamento.' }, { status: 403 });
    }

    // Cancela o agendamento
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json({ error: 'Erro ao cancelar agendamento.' }, { status: 500 });
  }
}
