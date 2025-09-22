// src/app/api/patient/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mantemos esta linha, ela é essencial
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ aguardamos o params
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }

    const patient = await prisma.user.findUnique({
      where: {
        id: patientId,
        role: 'PACIENTE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        avatarUrl: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(patient);

  } catch (error) {
    console.error('Erro ao buscar detalhes do paciente:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
