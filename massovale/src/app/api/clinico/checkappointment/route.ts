import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const dateParam = searchParams.get('data');
  const userId = Number(searchParams.get('userId'));

  if (!dateParam || !userId) {
    return NextResponse.json({ message: 'Parâmetros ausentes.' }, { status: 400 });
  }

  const start = new Date(dateParam);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  try {
    const agendamentos = await prisma.availability.findMany({
  where: {
    userId,
    date: {
      gte: start,
      lte: end,
    },
    NOT: {
      appointment: null,
    },
  },
  include: {
    appointment: {
      include: {
        user: true, // paciente
      },
    },
  },
});


    return NextResponse.json(agendamentos, { status: 200 });
  } catch (error: unknown) {
  if (error instanceof Error) {
    return NextResponse.json({ message: 'Erro ao buscar agendamentos.', error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Erro inesperado ao buscar agendamentos.' }, { status: 500 });
}

}
