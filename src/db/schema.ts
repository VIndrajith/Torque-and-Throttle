import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  year: integer('year').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  trim: text('trim').default(''),
  chassis: text('chassis').default(''),
  category: text('category').default('sedans'),
  price: integer('price').default(0),
  targetPrice: integer('target_price').default(0),
  floorPrice: integer('floor_price').default(0),
  mileage: integer('mileage').default(0),
  vin: text('vin').default(''),
  fullVin: text('full_vin').default(''),
  registrationNo: text('registration_no').default(''),
  primaryBadge: text('primary_badge').default(''),
  secondaryBadge: text('secondary_badge').default(''),
  imageUrl: text('image_url').default(''),
  galleryImages: jsonb('gallery_images').$type<string[]>().default([]),
  additionalImages: jsonb('additional_images').$type<string[]>().default([]),
  exteriorColor: text('exterior_color').default(''),
  interiorColor: text('interior_color').default(''),
  location: text('location').default(''),
  status: text('status').default('available'),
  isSold: boolean('is_sold').default(false),
  specs: jsonb('specs').default({}),
  dynoTelemetry: jsonb('dyno_telemetry').default({}),
  inspection: jsonb('inspection').default({}),
  carfax: jsonb('carfax').default({}),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const enquiries = pgTable('enquiries', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email').default(''),
  preferredContact: text('preferred_contact').default('phone'),
  message: text('message').default(''),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  vehicleName: text('vehicle_name').default(''),
  status: text('status').default('new'),
  assignedAdminId: text('assigned_admin_id').default(''),
  source: text('source').default('website'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  enquiries: many(enquiries),
}));

export const enquiriesRelations = relations(enquiries, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [enquiries.vehicleId],
    references: [vehicles.id],
  }),
}));
