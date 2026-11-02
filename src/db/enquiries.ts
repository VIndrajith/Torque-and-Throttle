import { db, isSqlConfigured } from './index.ts';
import { enquiries } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

const inMemoryEnquiries: Array<typeof enquiries.$inferSelect> = [];

export async function getAllEnquiries() {
  if (!isSqlConfigured()) {
    return [...inMemoryEnquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  try {
    return await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
  } catch (error: any) {
    if (error?.message?.includes('ENOENT') || error?.cause?.message?.includes('ENOENT')) {
      return inMemoryEnquiries;
    }
    console.warn('PostgreSQL query notice (falling back to memory):', error?.message);
    return inMemoryEnquiries;
  }
}

export async function insertEnquiry(data: Partial<typeof enquiries.$inferInsert> & { customerName: string; customerPhone: string }) {
  const payload = {
    ...data,
    id: data.id || `ENQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerEmail: data.customerEmail || '',
    preferredContact: data.preferredContact || 'phone',
    message: data.message || '',
    vehicleName: data.vehicleName || '',
    status: data.status || 'new',
    assignedAdminId: data.assignedAdminId || '',
    source: data.source || 'website',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as typeof enquiries.$inferInsert;

  if (!isSqlConfigured()) {
    inMemoryEnquiries.push(payload as any);
    return payload;
  }

  try {
    try {
      const result = await db.insert(enquiries).values(payload).returning();
      return result[0];
    } catch (fkErr: any) {
      if (payload.vehicleId) {
        const fallbackPayload = { ...payload, vehicleId: null };
        const result = await db.insert(enquiries).values(fallbackPayload).returning();
        return result[0];
      }
      throw fkErr;
    }
  } catch (error: any) {
    // Non-fatal fallback to in-memory store
    inMemoryEnquiries.push(payload as any);
    return payload;
  }
}

export async function updateEnquiryStatus(id: string, status: string) {
  if (!isSqlConfigured()) {
    const item = inMemoryEnquiries.find((e) => e.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }

  try {
    const result = await db
      .update(enquiries)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, id))
      .returning();
    return result[0];
  } catch (error: any) {
    const item = inMemoryEnquiries.find((e) => e.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date();
      return item;
    }
    return null;
  }
}
