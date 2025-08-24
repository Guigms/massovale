// src/app/api/user/avatar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  console.log('--- [API /api/user/avatar] Rota acessada ---');
  
  const token = req.cookies.get('token')?.value;

  if (!token) {
    console.error('[AVATAR API] Erro: Token de autenticação ausente.');
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;
    console.log(`[AVATAR API] Usuário autenticado com ID: ${userId}`);

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      console.error('[AVATAR API] Erro: Nenhum arquivo foi encontrado no FormData.');
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    console.log(`[AVATAR API] Arquivo recebido: ${file.name}, Tipo: ${file.type}`);

    if (!file.type.startsWith('image/')) {
      console.error(`[AVATAR API] Erro: Tipo de arquivo inválido - ${file.type}`);
      return NextResponse.json({ error: 'Tipo de arquivo inválido. Apenas imagens são permitidas.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const uploadPath = path.join(uploadDir, filename);

    // Garante que o diretório de uploads existe
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      console.error('[AVATAR API] Falha ao criar o diretório de uploads:', e);
      return NextResponse.json({ error: 'Erro no servidor ao preparar upload.' }, { status: 500 });
    }
    
    console.log(`[AVATAR API] Tentando salvar o arquivo em: ${uploadPath}`);
    await writeFile(uploadPath, buffer);
    console.log(`[AVATAR API] SUCESSO: Arquivo salvo fisicamente.`);

    const publicUrl = `/uploads/${filename}`;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl) {
      try {
        const oldPath = path.join(process.cwd(), 'public', user.avatarUrl);
        await unlink(oldPath);
        console.log(`[AVATAR API] Avatar antigo deletado: ${oldPath}`);
      } catch (error) {
        console.error('[AVATAR API] Aviso: Não foi possível deletar o avatar antigo (pode já não existir):', error);
      }
    }
    
    console.log(`[AVATAR API] Atualizando banco de dados com a URL: ${publicUrl}`);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });
    console.log(`[AVATAR API] SUCESSO: Banco de dados atualizado.`);

    return NextResponse.json({ success: true, avatarUrl: updatedUser.avatarUrl });

  } catch (error) {
    console.error('[AVATAR API] ERRO GERAL NO BLOCO TRY/CATCH:', error);
    return NextResponse.json({ error: 'Token inválido ou erro interno.' }, { status: 500 });
  }
}