import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
// Certifique-se de que esta função está implementada em src/lib/email.ts
import { sendPasswordResetEmail } from "@/lib/email"; 

const JWT_SECRET = process.env.JWT_SECRET!; 

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "E-mail é obrigatório." }, { status: 400 });
    }

    // 1. Encontrar o usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    // Se o usuário não for encontrado, retornamos uma mensagem genérica por segurança
    if (!user) {
      return NextResponse.json({ message: "Se o e-mail estiver registrado, enviaremos um link de redefinição." }, { status: 200 });
    }

   // 2. Gerar Token JWT (o token que será salvo no banco e enviado no link)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    
    // 3. Definir a data/hora de expiração do token no banco de dados
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // Agora + 1 hora

    // 4. Salvar o token e a expiração no banco de dados
    // ✅ SINTAXE CORRETA: O objeto de configuração { where: { id: ... }, data: { ... } }
    await prisma.user.update({ 
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiryDate,
      },
    });

    // 5. Enviar e-mail:
    await sendPasswordResetEmail(user, token); // Chamada ATIVADA
    
    return NextResponse.json({ message: "Se o e-mail estiver registrado, enviaremos um link de redefinição." }, { status: 200 });

// ... bloco catch

    return NextResponse.json({ message: "Se o e-mail estiver registrado, enviaremos um link de redefinição." }, { status: 200 });
  } catch (error) {
    console.error("Erro na rota forgot-password:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}