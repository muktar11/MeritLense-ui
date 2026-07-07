import { apiClient } from '../auth/client';
import {
  Price,
  Customer,
  PaymentMethod,
  Subscription,
  SubscriptionListItem,
  Payment,
  Invoice,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  CreateSetupIntentResponse,
  AttachPaymentMethodRequest,
  CreateSubscriptionRequest,
  ChangePlanRequest,
  UpdateQuantityRequest,
  CancelSubscriptionRequest,
  UpcomingInvoiceResponse,
  UsageResponse,
} from '@/app/api/payments/types';
import { API_BASE_URL } from '@/lib/config/env';

class PaymentService {
  private baseURL = `${API_BASE_URL}/payments/`;

  private ensureAuthToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found');
    }
    return token;
  }

  async getPrices(params?: {
    interval?: string;
    target_user_type?: string;
  }): Promise<Price[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}prices`, { params });
    return response.data;
  }

  async getPrice(id: string): Promise<Price> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}prices/${id}`);
    return response.data;
  }

  async getPricesForUser(params?: { interval?: string }): Promise<Price[]> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.get(`${this.baseURL}prices/for_user`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }

  async getMyCustomer(): Promise<Customer> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}customers/me`);
    return response.data;
  }


  async createSetupIntent(): Promise<CreateSetupIntentResponse> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}payment-methods/create_setup_intent`);
    return response.data;
  }

  async attachPaymentMethod(data: AttachPaymentMethodRequest): Promise<PaymentMethod> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}payment-methods/attach`, data);
    return response.data;
  }

  async detachPaymentMethod(id: number): Promise<void> {
    this.ensureAuthToken();
    await apiClient.delete(`${this.baseURL}payment-methods/${id}`);
  }

  async setDefaultPaymentMethod(id: number): Promise<void> {
    this.ensureAuthToken();
    await apiClient.post(`${this.baseURL}payment-methods/${id}/set_default`);
  }

  async getSubscriptions(params?: {
    status?: string;
    active_only?: boolean;
  }): Promise<SubscriptionListItem[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}subscriptions`, { params });
    return response.data;
  }


  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.post(`${this.baseURL}subscriptions`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async changePlan(id: number, data: ChangePlanRequest): Promise<Subscription> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}subscriptions/${id}/change_plan`, data);
    return response.data;
  }

  async updateQuantity(id: number, data: UpdateQuantityRequest): Promise<{ message: string; quantity: number }> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}subscriptions/${id}/update_quantity`, data);
    return response.data;
  }

  async cancelSubscription(id: number, data: CancelSubscriptionRequest): Promise<{ message: string; subscription: Subscription }> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.post(`${this.baseURL}subscriptions/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(id: number): Promise<{ message: string; subscription: Subscription }> {
    this.ensureAuthToken();
    try {
      const response = await apiClient.post(`${this.baseURL}subscriptions/${id}/reactivate`);
      return response.data;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  async getUpcomingInvoice(id: number, params?: { price_id?: string; quantity?: number }): Promise<UpcomingInvoiceResponse> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}subscriptions/${id}/upcoming_invoice`, { params });
    return response.data;
  }

async getAllSubscriptions(params?: {
  status?: string;
}): Promise<SubscriptionListItem[]> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}subscriptions`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    throw error;
  }
}

async getActiveSubscriptions(): Promise<SubscriptionListItem[]> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}subscriptions`, { 
      params: { active_only: true }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching active subscriptions:', error);
    throw error;
  }
}

async getSubscription(id: number): Promise<Subscription> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}subscriptions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

async getSubscriptionUsage(id: number): Promise<UsageResponse> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}subscriptions/${id}/usage`);
    return response.data;
  } catch (error) {
    console.error('Error fetching usage:', error);
    throw error;
  }
}

async getPaymentMethods(): Promise<PaymentMethod[]> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}payment-methods`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

async getInvoices(): Promise<Invoice[]> {
  this.ensureAuthToken();
  try {
    const response = await apiClient.get(`${this.baseURL}invoices`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

  async getPayments(): Promise<Payment[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}payments`);
    return response.data;
  }

  async getPayment(id: number): Promise<Payment> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}payments/${id}`);
    return response.data;
  }

  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    this.ensureAuthToken();
    const response = await apiClient.post(`${this.baseURL}payments/create_payment_intent`, data);
    return response.data;
  }


  async getInvoice(id: number): Promise<Invoice> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}invoices/${id}`);
    return response.data;
  }

  async getSubscriptionInvoices(): Promise<Invoice[]> {
    this.ensureAuthToken();
    const response = await apiClient.get(`${this.baseURL}subscriptions/invoices`);
    return response.data;
  }

  formatPrice(amount: number, currency: string = 'eur'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getIntervalText(interval: string, intervalCount: number = 1): string {
    if (intervalCount === 1) {
      return interval.toLowerCase();
    }
    return `every ${intervalCount} ${interval.toLowerCase()}s`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
      case 'TRIALING':
      case 'PAID':
      case 'SUCCEEDED':
        return 'green';
      case 'PAST_DUE':
      case 'UNPAID':
      case 'FAILED':
        return 'red';
      case 'CANCELED':
      case 'VOID':
        return 'gray';
      case 'INCOMPLETE':
      case 'PENDING':
      case 'DRAFT':
      case 'OPEN':
        return 'yellow';
      default:
        return 'blue';
    }
  }

async checkSubscriptions(): Promise<any> {
  this.ensureAuthToken();
  const response = await apiClient.get(`${this.baseURL}check-subscriptions`);
  return response.data;
}

async syncSubscription(subscriptionId: number): Promise<any> {
  this.ensureAuthToken();
  const response = await apiClient.post(`${this.baseURL}sync-subscription`, {
    subscription_id: subscriptionId
  });
  return response.data;
}

async syncAllSubscriptions(): Promise<any> {
  this.ensureAuthToken();
  const response = await apiClient.post(`${this.baseURL}sync-all`);
  return response.data;
}

}

export default new PaymentService();