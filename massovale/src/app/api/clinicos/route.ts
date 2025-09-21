// src/app/api/clinicos/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clinicos = await prisma.user.findMany({
      where: { role: 'CLINICO' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(clinicos);
  } catch (error) {
    console.error('Erro ao buscar clínicos:', error);
    return NextResponse.json({ message: 'Erro ao buscar clínicos' }, { status: 500 });
  }
}
