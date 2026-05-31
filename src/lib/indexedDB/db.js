import Dexie from 'dexie';

export const db = new Dexie('POSDatabase');

// Version 3: Added batches and improved pendingSales metadata
db.version(3).stores({
  products: 'id, name, code, category',
  variants: 'id, productId, barcode, fullName',
  batches: 'id, variantId, productId, batch_number',
  customers: 'id, name, phone',
  distributors: 'id, name, phone',
  employees: 'id, name',
  branches: 'id, name',
  pendingSales: '++id, createdAt, status, invoice_no' // status: 'pending', 'syncing', 'error'
});

// Helper to update all variants for a product list
export async function syncMasterData({ products, customers, distributors, employees, batches, branches }) {
  await db.transaction('rw', [db.products, db.variants, db.customers, db.distributors, db.employees, db.batches, db.branches], async () => {
    if (products) {
      await db.products.clear();
      await db.variants.clear();
      await db.products.bulkPut(products.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        category: p.category
      })));
      
      const allVariants = products.flatMap(p => p.variants || []);
      await db.variants.bulkPut(allVariants);
    }
    
    if (customers) {
      await db.customers.clear();
      await db.customers.bulkPut(customers);
    }

    if (distributors) {
      await db.distributors.clear();
      await db.distributors.bulkPut(distributors);
    }
    
    if (employees) {
      await db.employees.clear();
      await db.employees.bulkPut(employees);
    }

    if (batches) {
      await db.batches.clear();
      await db.batches.bulkPut(batches);
    }

    if (branches) {
      await db.branches.clear();
      await db.branches.bulkPut(branches);
    }
  });
}

/**
 * Save a sale to the pending queue for background sync
 */
export async function queueSale(saleData) {
  return await db.pendingSales.add({
    ...saleData,
    createdAt: new Date(),
    status: 'pending'
  });
}

/**
 * Get the next sale to sync (FIFO)
 */
export async function getNextPendingSale() {
  return await db.pendingSales.where('status').equals('pending').first();
}

/**
 * Update the status of a pending sale
 */
export async function updatePendingSaleStatus(id, status, error = null) {
  return await db.pendingSales.update(id, { status, error, updatedAt: new Date() });
}

/**
 * Remove a sale from the queue after successful cloud sync
 */
export async function removeSyncedSale(id) {
  return await db.pendingSales.delete(id);
}
