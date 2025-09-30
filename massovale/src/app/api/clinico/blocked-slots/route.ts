import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, clinicoId } = body;

    if (!date || !clinicoId) {
      return NextResponse.json(
        { message: 'Parâmetros date e clinicoId são obrigatórios' },
        { status: 400 }
      );
    }

    const slotDate = new Date(date);

    // Verificação extra: não permitir bloquear um horário que já tem um agendamento
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: slotDate,
        clinicoId: clinicoId,
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { message: 'Este horário já está agendado e não pode ser bloqueado.' },
        { status: 409 }
      );
    }

    // Cria o registro de bloqueio
    const newBlockedSlot = await prisma.blockedSlot.create({
      data: {
        date: slotDate,
        clinicoId: clinicoId,
      },
    });

    return NextResponse.json(newBlockedSlot, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Este horário já está bloqueado.' },
        { status: 409 }
      );
    }

    console.error("Erro ao bloquear horário:", error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const clinicoIdStr = searchParams.get('clinicoId');

    if (!date || !clinicoIdStr) {
      return NextResponse.json(
        { message: 'Parâmetros date e clinicoId são obrigatórios na URL' },
        { status: 400 }
      );
    }

    const clinicoId = parseInt(clinicoIdStr, 10);

    await prisma.blockedSlot.deleteMany({
      where: {
        date: new Date(date),
        clinicoId: clinicoId,
      },
    });

    return NextResponse.json(
      { message: 'Horário disponibilizado com sucesso.' },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao disponibilizar horário:", error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
