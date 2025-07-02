import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET() {
  try {
    const disponibilidades = await prisma.availability.findMany({
      include: { appointment: true }, // traz info do agendamento junto
    });
    return NextResponse.json(disponibilidades);
  } catch (error) {
    console.error('Erro ao buscar disponibilidades:', error);
    return NextResponse.json({ error: 'Erro ao buscar disponibilidades' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, date } = await req.json();

  if (!userId || !date) {
    return NextResponse.json({ error: 'userId e date são obrigatórios.' }, { status: 400 });
  }

  // Verifica se o usuário é um CLINICO
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== 'CLINICO') {
    return NextResponse.json({ error: 'Usuário não autorizado.' }, { status: 403 });
  }

  try {
    const disponibilidade = await prisma.availability.create({
      data: {
        date: new Date(date),
        userId,
      },
    });

    return NextResponse.json(disponibilidade, { status: 201 });
  } catch (error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    return NextResponse.json({ error: 'Horário já cadastrado.' }, { status: 409 });
  }

  console.error('Erro ao criar disponibilidade:', error);
  return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
}

}
