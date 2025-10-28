// src/app/api/user/avatar/route.ts (Versão Cloudinary)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary'; // Importa o Cloudinary

const JWT_SECRET = process.env.JWT_SECRET!;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    const publicId = `massovale_avatars/user-${userId}`; 

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
        public_id: publicId,
        overwrite: true, 
        invalidate: true, 
        folder: 'massovale_avatars',
    });

    const publicUrl = uploadResult.secure_url; 
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl }, 
    });

    return NextResponse.json({ success: true, avatarUrl: updatedUser.avatarUrl });

  } catch (error) {
    console.error('Ocorreu um erro inesperado no upload de avatar:', error);
    return NextResponse.json({ error: 'Falha no upload do avatar (serviço de armazenamento externo).' }, { status: 500 });
  }
}