import { cookies } from 'next/headers';

import { COOKIE_NAME, verifyUserToken } from './jwt';

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifyUserToken(token);
  } catch {
    return null;
  }
}
