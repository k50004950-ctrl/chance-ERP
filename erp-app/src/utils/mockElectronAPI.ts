import type { ElectronAPI } from '../types/electron';

// API base URL - use environment variable or default to /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Web API implementation (replaces Electron IPC)
export const webAPI: ElectronAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
  
  products: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
    create: async (product) => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
    update: async (id, product) => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
    delete: async (id) => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'DELETE',
        });
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
    import: async (products) => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(products),
        });
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
    importCSV: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/import-csv`, {
          method: 'POST',
        });
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
  
  employees: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employees`);
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
  
  attendance: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/attendance`);
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
  
  leaves: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/leaves`);
        return await response.json();
      } catch (error: any) {
        return { success: false, message: error.message };
      }
    },
  },
};

// Helper to get API (Electron or Web)
export const getElectronAPI = (): ElectronAPI => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    // Running in Electron
    return window.electronAPI;
  }
  // Running in browser, use web API
  console.log('Running in web mode with backend API');
  return webAPI;
};

