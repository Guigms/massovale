// src/lib/email.ts (CÓDIGO CORRIGIDO)

import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { User, Appointment } from '@prisma/client';

// Tipagem para os detalhes do agendamento
type AppointmentDetails = Appointment & {
  patient: User;
  clinico: User;
};

// Função para enviar e-mail de CONFIRMAÇÃO de agendamento
export async function sendAppointmentConfirmationEmail(details: AppointmentDetails) {
  // ✅ O transporter agora é criado DENTRO da função.
  const transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const appointmentDate = new Date(details.date);
  const formattedDate = format(appointmentDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(appointmentDate, 'HH:mm');

  // E-mail para o Paciente
  await transporter.sendMail({
    from: `Jessica Vale Massoterapia <${process.env.SMTP_USER}>`,
    to: details.patient.email,
    subject: 'Agendamento Confirmado!',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Olá, ${details.patient.name}!</h2>
        <p>Seu agendamento foi confirmado com sucesso.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f2f2f2; border-radius: 8px; display: inline-block;">
          <p><strong>Profissional:</strong> ${details.clinico.name}</p>
          <p><strong>Data:</strong> ${formattedDate}</p>
          <p><strong>Horário:</strong> ${formattedTime}</p>
        </div>
        <p>Até breve!</p>
      </div>
    `,
  });

  // E-mail para o Clínico
  await transporter.sendMail({
    from: `Sistema de Agenda <${process.env.SMTP_USER}>`,
    to: details.clinico.email,
    subject: 'Novo Agendamento Recebido!',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Olá, ${details.clinico.name}!</h2>
        <p>Você tem um novo agendamento.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f2f2f2; border-radius: 8px; display: inline-block;">
          <p><strong>Paciente:</strong> ${details.patient.name}</p>
          <p><strong>Data:</strong> ${formattedDate}</p>
          <p><strong>Horário:</strong> ${formattedTime}</p>
        </div>
      </div>
    `,
  });
}

// Função para enviar e-mail de CANCELAMENTO de agendamento
export async function sendAppointmentCancellationEmail(details: AppointmentDetails) {
  // ✅ O transporter também é criado DENTRO desta função.
  const transporter = nodemailer.createTransport({
    host: 'smtp.titan.email',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  const appointmentDate = new Date(details.date);
  const formattedDate = format(appointmentDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  // E-mail para o Paciente
  await transporter.sendMail({
    from: `Jessica Vale Massoterapia <${process.env.SMTP_USER}>`,
    to: details.patient.email,
    subject: 'Agendamento Cancelado',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Olá, ${details.patient.name},</h2>
        <p>Seu agendamento para o dia ${formattedDate} com <strong>${details.clinico.name}</strong> foi cancelado.</p>
        <p>Se você não solicitou o cancelamento, por favor entre em contato.</p>
      </div>
    `,
  });

  // E-mail para o Clínico
  await transporter.sendMail({
    from: `Sistema de Agenda <${process.env.SMTP_USER}>`,
    to: details.clinico.email,
    subject: 'Um Agendamento foi Cancelado',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Atenção, ${details.clinico.name},</h2>
        <p>O agendamento com <strong>${details.patient.name}</strong> para o dia ${formattedDate} foi cancelado.</p>
        <p>Este horário está novamente disponível em sua agenda.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user: User, token: string) {
  // Cria o transporter (use o mesmo código existente que cria o seu transporter)
  const transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 465,
      secure: true,
      auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
      },
  });

  const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `Jessica Vale Massoterapia <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Redefinição de Senha',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px 20px;">
        <h2>Olá, ${user.name},</h2>
        <p>Você solicitou a redefinição de senha. Clique no link abaixo para criar uma nova:</p>
        <a href="${resetLink}" style="display: inline-block; margin: 20px 0; background-color: #787f7e; color: white; text-decoration: none; padding: 14px 28px; border-radius: 24px; font-weight: bold;">
          Redefinir Senha
        </a>
        <p style="font-size: 14px; color: #999999; margin-top: 30px;">
          Este link é válido por 1 hora. Se você não solicitou isso, ignore este e-mail.
        </p>
      </div>
    `,
  });
}