import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;

    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
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
      // Se o erro não for 'EEXIST' (diretório já existe), é um problema real.
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') {
        console.error('Falha ao criar o diretório de uploads:', e);
        return NextResponse.json({ error: 'Erro no servidor ao preparar upload.' }, { status: 500 });
      }
    }
    
    await writeFile(uploadPath, buffer);

    const publicUrl = `/uploads/${filename}`;
    
    // Busca o usuário para verificar se já existe um avatar antigo a ser deletado
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl) {
      try {
        const oldPath = path.join(process.cwd(), 'public', user.avatarUrl);
        await unlink(oldPath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Ignora o erro caso o arquivo antigo não exista, o que é um cenário comum.
      }
    }
    
    // Atualiza o usuário com a nova URL do avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    return NextResponse.json({ success: true, avatarUrl: updatedUser.avatarUrl });

  } catch (error) {
    // Loga apenas erros inesperados no servidor
    console.error('Ocorreu um erro inesperado no upload de avatar:', error);
    return NextResponse.json({ error: 'Token inválido ou erro interno.' }, { status: 500 });
  }
}