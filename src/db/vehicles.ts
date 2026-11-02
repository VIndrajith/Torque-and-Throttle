import { db, isSqlConfigured } from './index.ts';
import { vehicles } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { INVENTORY_DATA } from '../data/inventory.ts';

export async function getAllVehicles() {
  if (!isSqlConfigured()) {
    return [];
  }

  try {
    return await db.select().from(vehicles).orderBy(desc(vehicles.year));
  } catch (error: any) {
    return [];
  }
}

export async function getVehicleById(id: string) {
  if (!isSqlConfigured()) {
    return null;
  }

  try {
    const rows = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return rows[0] || null;
  } catch (error: any) {
    return null;
  }
}

export async function upsertVehicle(data: typeof vehicles.$inferInsert) {
  if (!isSqlConfigured()) {
    return data;
  }

  try {
    const result = await db
      .insert(vehicles)
      .values(data)
      .onConflictDoUpdate({
        target: vehicles.id,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  } catch (error: any) {
    return data;
  }
}

export async function deleteVehicle(id: string) {
  if (!isSqlConfigured()) {
    return [{ id }];
  }

  try {
    return await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
  } catch (error: any) {
    return [{ id }];
  }
}
