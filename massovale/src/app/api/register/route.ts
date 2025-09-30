// src/app/api/register/route.ts (CÓDIGO CORRIGIDO)

import { prisma } from '@/lib/prisma'; // ✅ USA A CONEXÃO CORRETA
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { name, email, password, contact } = await req.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      contact,
      role: 'PACIENTE',
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    },
  });

  // ✅ MOVIDO PARA DENTRO DA FUNÇÃO
  const transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: `Jessica Vale <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verifique seu e-mail',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 40px 20px;">
      <div style="max-width: 500px; margin: auto; background-color: #d1d1d1; border-radius: 8px; text-align: center; padding: 30px;">
        <img src="https://i.imgur.com/dPVL559.png" alt="Logo" style="width: 120px; margin-bottom: 20px;" />
        <h2 style="color: #333333; margin: 0 0 10px;">Confirme seu e-mail</h2>
        <p style="font-size: 16px; color: #555555; margin: 0 0 20px;">
          Olá, <strong>${name}</strong> 👋<br />
          Para ativar sua conta, clique no botão abaixo:
        </p>
        <a href="https://massovale.vercel.app/api/verify?token=${token}" style="display: inline-block; margin: 20px 0; background-color: #787f7e; color: white; text-decoration: none; padding: 14px 28px; border-radius: 24px; font-weight: bold;">
          Verificar e-mail
        </a>
        <p style="font-size: 14px; color: #999999; margin-top: 30px;">
          Se você não solicitou este cadastro, ignore este e-mail.
        </p>
      </div>
      <div style="text-align: center; color: #cccccc; font-size: 12px; margin-top: 20px;">
        <img src="https://i.imgur.com/dPVL559.png" alt="Rodapé" style="width: 100px; opacity: 0.3;" />
      </div>
    </div>
    `
  });


  return NextResponse.json({ message: 'Cadastro realizado. Verifique seu e-mail.' });
}