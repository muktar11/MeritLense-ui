// app/api/admin/invoices/types.ts
export interface AdminInvoice {
  id: string;
  user: number;
  user_email: string;
  user_full_name: string;
  customer: number;
  subscription: number | null;
  stripe_invoice_id: string;
  stripe_payment_intent: number | null;
  number: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  amount_due: string;
  amount_paid: string;
  amount_remaining: string;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  voided_at: string | null;
  invoice_pdf: string;
  hosted_invoice_url: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
