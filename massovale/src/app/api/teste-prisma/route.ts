// src/app/api/test-prisma/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao acessar o Prisma:', error);
    return NextResponse.json({ error: 'Erro no Prisma' }, { status: 500 });
  }
}
