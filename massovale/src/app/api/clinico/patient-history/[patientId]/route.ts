// src/app/api/clinico/patient-history/[patientId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Garante que a rota seja dinâmica e sempre busque os dados mais recentes
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  // A tipagem de 'params' agora é uma Promise
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    // Corrigido: Usamos 'await' para obter o valor de 'params'
    const { patientId: patientIdStr } = await params;
    const patientId = parseInt(patientIdStr, 10);

    if (isNaN(patientId)) {
      return NextResponse.json({ message: 'ID do paciente inválido.' }, { status: 400 });
    }

    // Busca o paciente e todos os seus agendamentos, ordenados do mais recente para o mais antigo
    const patientHistory = await prisma.user.findUnique({
      where: {
        id: patientId,
        role: 'PACIENTE', // Garante que estamos buscando um paciente
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        avatarUrl: true,
        appointmentsAsPaciente: {
          orderBy: {
            date: 'desc', // O mais recente primeiro
          },
          select: {
            id: true,
            date: true,
            status: true,
            service: true,
            notes: true,
          },
        },
      },
    });

    if (!patientHistory) {
      return NextResponse.json({ message: 'Paciente não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(patientHistory);

  } catch (error) {
    console.error('Erro ao buscar histórico do paciente:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor ao buscar histórico.' },
      { status: 500 }
    );
  }
}