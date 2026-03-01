
export enum RecurrencePeriod {
  NONE = 'None',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  ANNUALLY = 'Annually'
}

export enum InvoiceStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIAL = 'Partial',
  OVERDUE = 'Overdue'
}

export enum ServiceType {
  DOMAIN = 'Domain',
  SSL = 'SSL',
  HOSTING = 'Hosting',
  MAINTENANCE = 'Maintenance',
  OTHER = 'Other'
}

export interface Customer {
  id: string;
  name: string;
  emails: string[];
  phone: string;
  address: string;
  // Added properties to fix 'Object literal may only specify known properties' errors in db.ts
  activeProjects: number;
  totalBilled: string;
  status: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  cost: number;
  currency: 'LKR' | 'USD';
  delivery_time: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  is_recurring: boolean;
  recurrence_period?: RecurrencePeriod;
  last_invoice_date?: string;
  next_invoice_date?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  customer_id: string;
  customer_name: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
}

export interface ExpirationReminder {
  id: string;
  project_id: string;
  project_name: string;
  item_name: string;
  service_type: ServiceType;
  expiry_date: string;
  reminder_days: number;
}

export interface ProjectVault {
  id: string;
  project_id: string;
  title: string;
  username: string;
  password_encrypted: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_type: 'Agreement' | 'Contract' | 'General';
  uploaded_at: string;
  file_size: string;
}