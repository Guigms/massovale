import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search');

  if (!search || search.length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const patients = await prisma.user.findMany({
      where: {
        role: 'PACIENTE', 
        
        name: {
          contains: search,
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: 10,
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar pacientes.' }, { status: 500 });
  }
}