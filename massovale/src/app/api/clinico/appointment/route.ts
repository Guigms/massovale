import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { availabilityId, userId } = await req.json();

  if (!availabilityId || !userId) {
    return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 });
  }

  try {
    // Verifica se o horário ainda está disponível
    const availability = await prisma.availability.findUnique({
      where: { id: Number(availabilityId) },
      include: { appointment: true },
    });

    if (!availability || availability.appointment) {
      return NextResponse.json({ message: 'Horário não disponível.' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        availabilityId: Number(availabilityId),
        userId: Number(userId),
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: unknown) {
  if (error instanceof Error) {
    return NextResponse.json(
      { message: 'Erro ao agendar.', error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Erro desconhecido ao agendar.' },
    { status: 500 }
  );
}

}
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const userId = Number(searchParams.get('userId'));
  const weekStartDate = searchParams.get('weekStartDate');

  if (!userId || !weekStartDate) {
    return NextResponse.json({ message: 'Parâmetros ausentes.' }, { status: 400 });
  }

  try {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const appointments = await prisma.appointment.findMany({
      where: {
        availability: {
          date: {
            gte: start,
            lt: end,
          },
          userId: userId,
        },
      },
      include: {
        availability: true,
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(appointments);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: 'Erro ao buscar agendamentos.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Erro desconhecido ao buscar agendamentos.' },
      { status: 500 }
    );
  }
}
