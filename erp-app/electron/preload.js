const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),

  // Products
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    create: (product) => ipcRenderer.invoke('products:create', product),
    update: (id, product) => ipcRenderer.invoke('products:update', { id, product }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    import: (products) => ipcRenderer.invoke('products:import', products),
    importCSV: () => ipcRenderer.invoke('products:importCSV'),
  },

  // Employees
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
  },

  // Attendance
  attendance: {
    getAll: () => ipcRenderer.invoke('attendance:getAll'),
  },

  // Leaves
  leaves: {
    getAll: () => ipcRenderer.invoke('leaves:getAll'),
  },
});

