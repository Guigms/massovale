// src/app/api/clinico/reports/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppointmentStatus, Prisma } from '@prisma/client'; // 👈 importa Prisma

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicoId = searchParams.get('clinicoId');
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!clinicoId) {
      return NextResponse.json(
        { message: 'O ID do clínico é obrigatório.' },
        { status: 400 }
      );
    }

    // Tipagem correta
    const whereClause: Prisma.AppointmentWhereInput = {
      clinicoId: parseInt(clinicoId),
      status: AppointmentStatus.CONCLUIDO,
    };

    if (patientId) {
      whereClause.patientId = parseInt(patientId);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      whereClause.date = {
        gte: start,
        lte: end,
      };
    }

    const completedAppointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { name: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(completedAppointments);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao buscar relatório.' },
      { status: 500 }
    );
  }
}
