import { db } from './index.ts';
import { vehicles } from './schema.ts';
import { INVENTORY_DATA } from '../data/inventory.ts';
import { enrichVehiclesWithMetadata } from '../firebase/vehicleService.ts';

async function seed() {
  try {
    const list = enrichVehiclesWithMetadata(INVENTORY_DATA);
    for (const car of list) {
      await db
        .insert(vehicles)
        .values({
          id: car.id,
          year: car.year,
          make: car.make,
          model: car.model,
          trim: car.trim || '',
          chassis: car.chassis || '',
          category: car.category || 'sedans',
          price: car.price || 0,
          targetPrice: car.targetPrice || car.price || 0,
          floorPrice: car.floorPrice || Math.round((car.price || 0) * 0.92),
          mileage: car.mileage || 0,
          vin: car.vin || '',
          fullVin: car.fullVin || '',
          registrationNo: car.registrationNo || '',
          primaryBadge: car.primaryBadge || '',
          secondaryBadge: car.secondaryBadge || '',
          imageUrl: car.imageUrl || '',
          galleryImages: car.galleryImages || [car.imageUrl],
          additionalImages: car.additionalImages || [],
          exteriorColor: car.exteriorColor || '',
          interiorColor: car.interiorColor || '',
          location: car.location || '',
          status: car.status || (car.isSold ? 'sold' : 'available'),
          isSold: car.isSold || false,
          specs: car.specs || {},
          dynoTelemetry: car.dynoTelemetry || {},
          inspection: car.inspection || {},
          carfax: car.carfax || {},
          notes: car.notes || '',
        })
        .onConflictDoNothing();
    }
    console.log(`Seeded ${list.length} vehicles into Cloud SQL`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
