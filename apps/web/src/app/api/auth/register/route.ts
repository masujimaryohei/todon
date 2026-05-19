import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { COOKIE_NAME, signUserToken } from '@/lib/auth/jwt';
import { BadRequestError } from '@/lib/http';
import { mapUser } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const payload = registerSchema.safeParse(await req.json());
    if (!payload.success) {
      throw new BadRequestError('入力内容を確認してください');
    }

    const existing = await prisma.user.findUnique({ where: { email: payload.data.email } });
    if (existing) {
      throw new BadRequestError('このメールアドレスはすでに使われています');
    }

    const passwordHash = await bcrypt.hash(payload.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: payload.data.email,
        passwordHash,
        name: payload.data.name ?? null,
      },
    });

    const token = await signUserToken(user.id);
    const res = NextResponse.json({ user: mapUser(user), token });
    const isProd = process.env.NODE_ENV === 'production';

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
