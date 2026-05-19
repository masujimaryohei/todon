import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api-utils';
import { COOKIE_NAME, signUserToken } from '@/lib/auth/jwt';
import { BadRequestError, UnauthorizedError } from '@/lib/http';
import { mapUser } from '@/lib/mappers';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const payload = loginSchema.safeParse(await req.json());
    if (!payload.success) {
      throw new BadRequestError('入力内容を確認してください');
    }

    const user = await prisma.user.findUnique({ where: { email: payload.data.email } });
    if (!user) {
      throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません');
    }

    const ok = await bcrypt.compare(payload.data.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('メールアドレスまたはパスワードが正しくありません');
    }

    const token = await signUserToken(user.id);
    const res = NextResponse.json({
      user: mapUser(user),
      token,
    });

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
