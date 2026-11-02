import { db, isSqlConfigured } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  const fallbackUser = {
    id: uid,
    uid,
    email,
    name: name || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!isSqlConfigured()) {
    return fallbackUser;
  }

  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    return fallbackUser;
  }
}
