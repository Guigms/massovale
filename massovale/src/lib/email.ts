// src/lib/email.ts

import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { User, Appointment } from '@prisma/client';

// Configura o "transportador" de e-mail reutilizando as variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

// Tipagem para os detalhes do agendamento
type AppointmentDetails = Appointment & {
  patient: User;
  clinico: User;
};

// Função para enviar e-mail de CONFIRMAÇÃO de agendamento
export async function sendAppointmentConfirmationEmail(details: AppointmentDetails) {
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