import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { sendAppointmentConfirmationEmail, sendAppointmentCancellationEmail } from '@/lib/email';

// POST: Cria um novo agendamento e envia e-mails de confirmação
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

    // Após criar, busca os dados completos para enviar no e-mail
    const appointmentDetails = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: true,
        clinico: true,
      },
    });

    // Envia os e-mails de confirmação (sem bloquear a resposta da API)
    if (appointmentDetails) {
      sendAppointmentConfirmationEmail(appointmentDetails).catch(console.error);
    }

    return NextResponse.json(appointment, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Este horário acabou de ser agendado por outra pessoa.' }, { status: 409 });
    }
    
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json({ message: 'Erro interno ao agendar.' }, { status: 500 });
  }
}

// DELETE: Cancela um agendamento e envia e-mails de notificação
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentIdStr = searchParams.get('appointmentId');

    if (!appointmentIdStr) {
      return NextResponse.json({ message: 'O ID do agendamento é obrigatório' }, { status: 400 });
    }

    const appointmentId = parseInt(appointmentIdStr, 10);

    // Busca os dados do agendamento ANTES de deletar para poder enviar o e-mail
    const appointmentDetails = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        clinico: true,
      },
    });

    if (!appointmentDetails) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Deleta o agendamento
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    // Envia os e-mails de cancelamento (sem bloquear a resposta da API)
    sendAppointmentCancellationEmail(appointmentDetails).catch(console.error);

    return NextResponse.json({ message: 'Agendamento cancelado com sucesso!' });

  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}