// /src/app/api/logout/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Remove o cookie de autenticação
    (await
          // Remove o cookie de autenticação
          cookies()).set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(0), // Define a data de expiração para o passado
      path: '/',
    });

    return NextResponse.json({ message: 'Logout realizado com sucesso!' });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao fazer logout' }, { status: 500 });
  }
}