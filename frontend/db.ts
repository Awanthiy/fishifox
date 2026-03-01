import { 
  Customer, 
  Project, 
  Invoice, 
  Service, 
  InvoiceStatus, 
  RecurrencePeriod 
} from './types';

const API_BASE_URL = 'http://localhost:8000/api';
const AUTH_KEY = 'fishifox_auth_token';

class DatabaseService {
  private getHeaders() {
    const token = localStorage.getItem(AUTH_KEY);
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async login(username: string, pass: string): Promise<boolean> {
    // Demo credentials fallback
    if ((username === 'admin' && pass === 'admin123') || (username === 'admin@fishifox.com' && pass === 'admin123')) {
      localStorage.setItem(AUTH_KEY, 'demo_access_token');
      localStorage.setItem('user_profile', JSON.stringify({ name: 'Felix Tondura', role: 'Admin' }));
      return true;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password: pass }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      localStorage.setItem(AUTH_KEY, data.token);
      localStorage.setItem('user_profile', JSON.stringify(data.user));
      return true;
    } catch {
      console.warn("API Offline: Defaulting to local session.");
      return false;
    }
  }

  logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('user_profile');
    window.dispatchEvent(new Event('auth-change'));
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(AUTH_KEY);
  }

  async getStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { totalBilled: 'LKR 842,000', customers: 12, projects: 8, rating: '4.9/5' };
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { 
      return [
        { id: '1', invoice_number: 'INV-2024-001', customer_id: '1', customer_name: 'SoftVibe Solutions', amount: 250000, status: InvoiceStatus.PAID, date: '2024-03-01', is_recurring: false },
        { id: '2', invoice_number: 'INV-2024-002', customer_id: '2', customer_name: 'Global Logistics', amount: 145000, status: InvoiceStatus.PENDING, date: '2024-03-10', is_recurring: true, recurrence_period: RecurrencePeriod.MONTHLY },
      ];
    }
  }

  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { 
      return [
        { id: '1', name: 'SoftVibe Solutions', emails: ['billing@softvibe.com'], phone: '+94 77 123 4567', address: 'Colombo 03', activeProjects: 3, totalBilled: 'LKR 850k', status: 'Enterprise' },
        { id: '2', name: 'Global Logistics', emails: ['finance@globallog.com'], phone: '+94 11 999 8888', address: 'Negombo', activeProjects: 1, totalBilled: 'LKR 1.2M', status: 'Premium' },
      ];
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch { 
      return [
        { id: '1', name: 'SoftVibe Site Redesign', description: 'Next.js headless architecture deployment.', customer_id: '1', customer_name: 'SoftVibe Solutions', status: 'In Progress' },
        { id: '2', name: 'Internal HR Portal', description: 'Employee lifecycle management system.', customer_id: '2', customer_name: 'Global Logistics', status: 'Completed' },
      ];
    }
  }

  async addInvoice(invoice: Invoice): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(invoice),
      });
      return response.ok;
    } catch {
      return true; // Mock success
    }
  }

  clearAll() {
    localStorage.clear();
  }
}

export const db = new DatabaseService();