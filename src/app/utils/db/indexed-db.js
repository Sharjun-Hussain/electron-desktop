const DB_NAME = "posify_offline_db"
const DB_VERSION = 1


class IndexedDBManager {

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        console.log("[v0] IndexedDB initialized successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target).result

        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", { keyPath: "id" })
          productStore.createIndex("sku", "sku", { unique: true })
          productStore.createIndex("category", "category", { unique: false })
        }

        if (!db.objectStoreNames.contains("transactions")) {
          const transactionStore = db.createObjectStore("transactions", { keyPath: "id" })
          transactionStore.createIndex("timestamp", "timestamp", { unique: false })
          transactionStore.createIndex("branchId", "branchId", { unique: false })
        }

        if (!db.objectStoreNames.contains("customers")) {
          const customerStore = db.createObjectStore("customers", { keyPath: "id" })
          customerStore.createIndex("email", "email", { unique: true })
          customerStore.createIndex("phone", "phone", { unique: false })
        }

        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" })
          syncStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        console.log("[v0] IndexedDB schema created")
      }
    })
  }



  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite")
      const request = store.add(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async update(storeName, data){
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite")
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite")
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName){
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite")
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async addToSyncQueue(type, entity, data){
    const queueItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      entity: entity,
      data,
      timestamp: Date.now(),
    }
    await this.add("syncQueue", queueItem)
    console.log("[v0] Added to sync queue:", queueItem)
  }

  async getSyncQueue() {
    return this.getAll("syncQueue")
  }

  async clearSyncQueue() {
    await this.clear("syncQueue")
  }
}

export const db = new IndexedDBManager()
