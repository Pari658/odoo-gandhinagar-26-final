import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { createSalesOrder, updateSalesOrder } from '../api/salesOrders.js';

export default function SalesOrderForm({ onCancel, onSuccess, initialData }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Master Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxRates, setTaxRates] = useState([]);

  // Form State
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [orderDate, setOrderDate] = useState(
    initialData?.orderDate 
      ? new Date(initialData.orderDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  
  // Lines State: { id (temp), productId, quantity, unitPrice, taxRateId, taxRatePercent }
  const [lines, setLines] = useState(
    initialData?.lines?.map(l => ({
      id: l.id || Date.now().toString() + Math.random(),
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRateId: l.taxRateId || '',
      taxRatePercent: l.taxRatePercent || 0
    })) || [
      { id: Date.now().toString(), productId: '', quantity: 1, unitPrice: 0, taxRateId: '', taxRatePercent: 0 }
    ]
  );

  // Derived Totals
  const [totals, setTotals] = useState({ untaxed: 0, tax: 0, total: 0 });

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [lines]);

  const fetchMasterData = async () => {
    try {
      // Fetch customers (we only want 'customer' or 'both' types)
      const contactRes = await apiRequest('GET', '/contacts?pageSize=100');
      const filteredCustomers = (contactRes?.items || []).filter(c => c.type === 'customer' || c.type === 'both');
      setCustomers(filteredCustomers);

      // Fetch products
      const productRes = await apiRequest('GET', '/products?pageSize=100');
      setProducts(productRes?.items || []);

      // Fetch tax rates (Dev 1 API returns array directly in data)
      const taxRes = await apiRequest('GET', '/tax-rates?pageSize=100');
      setTaxRates(Array.isArray(taxRes) ? taxRes : []);
    } catch (err) {
      console.error('Failed to load master data', err);
      setErrorMsg('Failed to load customers or products.');
    }
  };

  // --- Simplified Frontend Math (Matches backend salesHelpers.js) ---
  const safeMoney = (value) => Math.round(Number(value) * 100) / 100;

  const calculateTotals = () => {
    let untaxed = 0;
    let tax = 0;

    lines.forEach(line => {
      const subtotal = safeMoney(line.quantity * line.unitPrice);
      const taxAmount = safeMoney(subtotal * (line.taxRatePercent / 100));
      
      untaxed = safeMoney(untaxed + subtotal);
      tax = safeMoney(tax + taxAmount);
    });

    setTotals({
      untaxed,
      tax,
      total: safeMoney(untaxed + tax)
    });
  };

  // --- Handlers ---
  const handleAddLine = () => {
    setLines([...lines, { id: Date.now().toString(), productId: '', quantity: 1, unitPrice: 0, taxRateId: '', taxRatePercent: 0 }]);
  };

  const handleRemoveLine = (id) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleLineChange = (id, field, value) => {
    setLines(lines.map(line => {
      if (line.id !== id) return line;

      const updatedLine = { ...line, [field]: value };

      // Auto-fill price when product changes
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updatedLine.unitPrice = parseFloat(prod.salesPrice) || 0;
        }
      }

      // Auto-fill tax percent when tax rate changes
      if (field === 'taxRateId') {
        const tr = taxRates.find(t => t.id === value);
        updatedLine.taxRatePercent = tr ? parseFloat(tr.ratePercent) : 0;
      }

      return updatedLine;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Validate lines
      const validLines = lines.filter(l => l.productId);
      if (validLines.length === 0) {
        throw new Error('Please add at least one product.');
      }

      for (const [index, line] of validLines.entries()) {
        if (parseFloat(line.quantity) <= 0) {
          throw new Error(`Line ${index + 1}: Quantity must be greater than 0`);
        }
        if (parseFloat(line.unitPrice) < 0) {
          throw new Error(`Line ${index + 1}: Unit price cannot be negative`);
        }
      }

      const payload = {
        customerId,
        orderDate,
        lines: validLines.map(l => ({
          productId: l.productId,
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice),
          taxRateId: l.taxRateId || null
        }))
      };

      if (initialData?.id) {
        await updateSalesOrder(initialData.id, payload);
      } else {
        await createSalesOrder(payload);
      }
      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create sales order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-[#E6DFD5] dark:border-[#382D27] gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-2 -ml-2 rounded-lg hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] text-[#6B5E55] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
              {initialData?.id ? `Edit Sales Order: ${initialData.number}` : 'New Sales Order'}
            </h2>
            <p className="text-sm text-[#6B5E55] dark:text-[#A89B91]">Draft</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E] dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || !customerId || lines.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-[#B45309] hover:bg-[#92400e] text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="m-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="p-6">
        <form className="space-y-8" id="so-form">
          
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customerId" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer *
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] focus:ring-2 focus:ring-[#B45309] outline-none text-sm"
              >
                <option value="">Select a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="orderDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Order Date
              </label>
              <input
                id="orderDate"
                name="orderDate"
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] focus:ring-2 focus:ring-[#B45309] outline-none text-sm"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-[#2C221E] dark:text-[#F5EFE6] border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              Order Lines
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-[#6B5E55] dark:text-[#A89B91] border-b border-[#E6DFD5] dark:border-[#382D27]">
                  <tr>
                    <th className="pb-3 font-semibold min-w-[200px]">Product *</th>
                    <th className="pb-3 font-semibold w-24">Quantity *</th>
                    <th className="pb-3 font-semibold w-32">Unit Price *</th>
                    <th className="pb-3 font-semibold w-32">Taxes</th>
                    <th className="pb-3 font-semibold text-right w-32">Subtotal</th>
                    <th className="pb-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                  {lines.map((line, index) => {
                    const subtotal = safeMoney(line.quantity * line.unitPrice);
                    
                    return (
                      <tr key={line.id}>
                        <td className="py-3 pr-2">
                          <select
                            id={`product-${line.id}`}
                            name={`product-${line.id}`}
                            value={line.productId}
                            onChange={(e) => handleLineChange(line.id, 'productId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-transparent border border-transparent hover:border-[#E6DFD5] focus:border-[#B45309] outline-none transition-colors"
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            id={`qty-${line.id}`}
                            name={`qty-${line.id}`}
                            type="number"
                            min="0.1"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-transparent border border-transparent hover:border-[#E6DFD5] focus:border-[#B45309] outline-none transition-colors"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input
                            id={`price-${line.id}`}
                            name={`price-${line.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) => handleLineChange(line.id, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-transparent border border-transparent hover:border-[#E6DFD5] focus:border-[#B45309] outline-none transition-colors"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <select
                            id={`tax-${line.id}`}
                            name={`tax-${line.id}`}
                            value={line.taxRateId}
                            onChange={(e) => handleLineChange(line.id, 'taxRateId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-transparent border border-transparent hover:border-[#E6DFD5] focus:border-[#B45309] outline-none transition-colors text-xs"
                          >
                            <option value="">No Tax</option>
                            {taxRates.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.ratePercent}%)</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 text-right font-medium">
                          ₹{subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="mt-2 text-sm font-semibold text-[#B45309] hover:text-[#92400e] flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add a line
            </button>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-6 border-t border-[#E6DFD5] dark:border-[#382D27]">
            <div className="w-full sm:w-64 space-y-3 text-sm">
              <div className="flex justify-between text-[#6B5E55] dark:text-[#A89B91]">
                <span>Untaxed Amount:</span>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  ₹{totals.untaxed.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#6B5E55] dark:text-[#A89B91]">
                <span>Taxes:</span>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  ₹{totals.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#B45309] dark:text-[#F3A358] pt-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
                <span>Total:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
