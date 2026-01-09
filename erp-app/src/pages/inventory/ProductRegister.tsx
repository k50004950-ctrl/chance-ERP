import React, { useState } from 'react';
import { Plus, Barcode, Package, DollarSign } from 'lucide-react';
import type { Product } from '../../types/electron';
import { getAPI } from '../../lib/storage';
import { getElectronAPI } from '../../utils/mockElectronAPI';

const ProductRegister: React.FC = () => {
  const [formData, setFormData] = useState<Product>({
    barcode: '',
    product_name: '',
    quantity: 0,
    consumer_price: 0,
    purchase_price: 0,
    month: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' || name === 'consumer_price' || name === 'purchase_price' 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const api = getElectronAPI();
      const result = await api.products.create(formData);
      if (result.success) {
        setMessage({ type: 'success', text: '제품이 성공적으로 등록되었습니다!' });
        setFormData({
          barcode: '',
          product_name: '',
          quantity: 0,
          consumer_price: 0,
          purchase_price: 0,
          month: '',
        });
      } else {
        setMessage({ type: 'error', text: result.message || '제품 등록에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '제품 등록 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">제품 등록</h1>
        <p className="text-gray-600 mt-2">새로운 제품 정보를 등록하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 바코드 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Barcode className="w-4 h-4" />
                  <span>바코드</span>
                </div>
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="예: 8809664987939"
                required
              />
            </div>

            {/* 제품명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>제품명</span>
                </div>
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="예: 3CE MULTI EYE COLOR PALETTE"
                required
              />
            </div>

            {/* 수량 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                수량
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* 소비자가격 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>소비자가격 (원)</span>
                </div>
              </label>
              <input
                type="number"
                name="consumer_price"
                value={formData.consumer_price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* 매입단가 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>매입단가 (원)</span>
                </div>
              </label>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* 월 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                월 (선택)
              </label>
              <input
                type="text"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="예: 7"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-400'
                  : 'bg-red-100 text-red-800 border border-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>{loading ? '등록 중...' : '제품 등록'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRegister;

