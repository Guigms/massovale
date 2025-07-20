import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST: Cria um novo bloqueio para um clínico em um horário específico
export async function POST(req: NextRequest) {
  const { date, clinicoId } = await req.json();

  if (!date || !clinicoId) {
    return NextResponse.json({ message: 'Dados incompletos para o bloqueio.' }, { status: 400 });
  }

  try {
    // Primeiro, verifica se já não existe um agendamento para este horário
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        clinicoId_date: {
          clinicoId: Number(clinicoId),
          date: new Date(date),
        },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { message: 'Não é possível bloquear um horário que já possui um agendamento.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Se estiver livre, cria o bloqueio
    const blockedSlot = await prisma.blockedSlot.create({
      data: {
        date: new Date(date),
        clinicoId: Number(clinicoId),
      },
    });

    return NextResponse.json(blockedSlot, { status: 201 });

  } catch (error: unknown) {
    // Trata o erro caso o horário já tenha sido bloqueado
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Este horário já está bloqueado.' }, { status: 409 });
    }
    
    console.error("Erro ao criar bloqueio:", error);
    return NextResponse.json({ message: 'Erro interno ao bloquear horário.' }, { status: 500 });
  }
}

// DELETE: Remove um bloqueio de horário
export async function DELETE(req: NextRequest) {
    const { date, clinicoId } = await req.json();

    if (!date || !clinicoId) {
        return NextResponse.json({ message: 'Dados incompletos para o desbloqueio.' }, { status: 400 });
    }

    try {
        // Usa o índice @@unique para encontrar e deletar o bloqueio
        await prisma.blockedSlot.delete({
            where: { 
                clinicoId_date: {
                    clinicoId: Number(clinicoId),
                    date: new Date(date),
                }
             },
        });
        return NextResponse.json({ message: 'Horário desbloqueado com sucesso.' }, { status: 200 });
    } catch (error) {
        // Trata o caso de tentar deletar um bloqueio que não existe
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Este horário não estava bloqueado.' }, { status: 404 });
        }
        console.error("Erro ao desbloquear horário:", error);
        return NextResponse.json({ message: 'Erro ao desbloquear horário.' }, { status: 500 });
    }
}