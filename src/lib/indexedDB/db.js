import Dexie from 'dexie';

export const db = new Dexie('POSDatabase');

db.version(2).stores({
  products: 'id, name, code, category',
  variants: 'id, productId, barcode, fullName',
  customers: 'id, name, phone',
  distributors: 'id, name, phone',
  employees: 'id, name',
  pendingSales: '++id, createdAt'
});

// Helper to update all variants for a product list
export async function syncMasterData({ products, customers, distributors, employees }) {
  await db.transaction('rw', [db.products, db.variants, db.customers, db.distributors, db.employees], async () => {
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
  });
}
