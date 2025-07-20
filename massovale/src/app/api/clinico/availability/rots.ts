import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const availability = await prisma.availability.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    return NextResponse.json(availability);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: 'Erro ao buscar disponibilidade.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Erro desconhecido ao buscar disponibilidade.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { date, userId } = await req.json();

  if (!date || !userId) {
    return NextResponse.json({ message: 'Data ou usuário ausente.' }, { status: 400 });
  }

  const dateObj = new Date(date);

  try {
    // Evita duplicação (verifica se já existe esse horário para o clínico)
    const exists = await prisma.availability.findFirst({
      where: {
        userId,
        date: dateObj,
      },
    });

    if (exists) {
      return NextResponse.json({ message: 'Horário já existe.' }, { status: 400 });
    }

    const created = await prisma.availability.create({
      data: {
        userId,
        date: dateObj,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: 'Erro ao criar disponibilidade.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Erro desconhecido ao criar disponibilidade.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { date, userId } = await req.json();

  if (!date || !userId) {
    return NextResponse.json({ message: 'Data ou usuário ausente.' }, { status: 400 });
  }

  const targetDate = new Date(date);

  try {
    // Busca a disponibilidade específica (precisa bater a hora exata)
    const availability = await prisma.availability.findFirst({
      where: {
        userId,
        date: targetDate,
        appointment: null, // só pode remover se não estiver agendado
      },
    });

    if (!availability) {
      return NextResponse.json({ message: 'Horário não encontrado ou já agendado.' }, { status: 404 });
    }

    await prisma.availability.delete({
      where: { id: availability.id },
    });

    return NextResponse.json({ message: 'Disponibilidade removida.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: 'Erro ao remover disponibilidade.', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Erro desconhecido ao remover disponibilidade.' },
      { status: 500 }
    );
  }
}
