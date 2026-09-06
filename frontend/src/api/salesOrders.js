import { apiRequest } from './client.js';

/**
 * Fetch a paginated list of Sales Orders
 */
export async function fetchSalesOrders(page = 1, pageSize = 10, search = '') {
  let url = `/sales-orders?page=${page}&pageSize=${pageSize}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return apiRequest('GET', url);
}

/**
 * Fetch a single Sales Order by ID (includes lines)
 */
export async function fetchSalesOrderById(id) {
  return apiRequest('GET', `/sales-orders/${id}`);
}

/**
 * Create a new Sales Order
 * @param {Object} data - { customerId, orderDate, lines: [...] }
 */
export async function createSalesOrder(data) {
  return apiRequest('POST', '/sales-orders', data);
}

/**
 * Update a draft Sales Order
 */
export async function updateSalesOrder(id, data) {
  return apiRequest('PUT', `/sales-orders/${id}`, data);
}

/**
 * Confirm a draft Sales Order
 */
export async function confirmSalesOrder(id) {
  return apiRequest('POST', `/sales-orders/${id}/confirm`);
}

/**
 * Invoice a confirmed Sales Order
 */
export async function invoiceSalesOrder(id) {
  return apiRequest('POST', `/sales-orders/${id}/invoice`);
}

