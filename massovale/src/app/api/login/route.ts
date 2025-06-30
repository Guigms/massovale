// /app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: 'E-mail ainda não verificado.' }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Login realizado com sucesso.',
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
}
