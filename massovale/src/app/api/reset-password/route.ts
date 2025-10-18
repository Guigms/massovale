import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Certifique-se de que o JWT_SECRET está definido no seu .env
const JWT_SECRET = process.env.JWT_SECRET!; 
// Use o mesmo valor SALT_ROUNDS que você usa em src/app/api/register/route.ts
const SALT_ROUNDS = 10; 

export async function POST(req: NextRequest) {
  try {
    // Recebe o token (da URL, passado pelo front-end) e a nova senha
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: "Token e nova senha são obrigatórios." }, { status: 400 });
    }

    // 1. Verificar a validade do token (se está assinado corretamente)
    let payload: { userId: number };
    try {
      // O token só será válido se for um JWT assinado e dentro do prazo de expiração
      payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Falha na verificação da assinatura ou token expirado no JWT
      return NextResponse.json({ message: "O link de redefinição é inválido ou expirou." }, { status: 401 });
    }
    
    const userId = payload.userId;

    // 2. Buscar o usuário e validar o token e a expiração no banco
    // Usamos findFirst para garantir a compatibilidade de tipagem com o Prisma
    const user = await prisma.user.findFirst({ 
        where: { 
            id: userId,
            passwordResetToken: token, // Garante que o token da URL corresponde ao do banco
        } 
    });

    // Validar se o token existe no banco e se não está expirado
    const now = new Date();
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < now) {
      
      // Limpar o token no banco, se encontrarmos o usuário mas o token estiver expirado.
      if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordResetToken: null, passwordResetExpiry: null },
        });
      }
      return NextResponse.json({ message: "O link de redefinição é inválido ou expirou. Solicite um novo." }, { status: 401 });
    }
    
    // 3. Gerar o hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 4. Atualizar a senha e limpar os campos de reset no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null, // Invalida o token após o uso
        passwordResetExpiry: null,
      },
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso. Redirecionando para o login." }, { status: 200 });
  } catch (error) {
    console.error("Erro na rota reset-password:", error);
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}