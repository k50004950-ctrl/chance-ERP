import React, { useEffect, useState } from 'react';
import { Package, TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';
import { getAPI } from '../../lib/storage';
import type { Product } from '../../types/electron';

const InventoryStatus: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    
    // 재고 업데이트 이벤트 감지
    const handleInventoryUpdate = () => {
      console.log('재고 업데이트 이벤트 감지, 재로드 중...');
      loadProducts();
    };
    
    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const api = getAPI();
      const response = await api.products.getAll();
      const productList = Array.isArray(response.data) ? response.data : [];
      
      console.log('재고현황 페이지에서 불러온 제품:', productList); // 디버깅용
      
      setProducts(productList);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산
  const productList = Array.isArray(products) ? products : [];
  const totalProducts = productList.length;
  const totalQuantity = productList.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const lowStockProducts = productList.filter(p => (p.quantity || 0) < 10).length;
  const totalValue = productList.reduce((sum, p) => sum + (p.quantity || 0) * (p.price || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">재고현황</h1>
        <p className="text-gray-600">전체 재고 상태를 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">총 제품 수</span>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalProducts}</p>
          <p className="text-xs text-gray-500 mt-1">개</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">총 재고량</span>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalQuantity}</p>
          <p className="text-xs text-gray-500 mt-1">개</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">재고 부족</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{lowStockProducts}</p>
          <p className="text-xs text-gray-500 mt-1">개 제품</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">재고 가치</span>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {totalValue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">원</p>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">제품별 재고 현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  바코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  재고수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  재고가치
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : productList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    등록된 제품이 없습니다.
                  </td>
                </tr>
              ) : (
                productList.map((product) => {
                  const quantity = product.quantity || 0;
                  const stockValue = quantity * (product.price || 0);
                  const isLowStock = quantity < 10;
                  const isOutOfStock = quantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.barcode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? 'text-red-600'
                              : isLowStock
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}
                        >
                          {quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(product.price || 0).toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {stockValue.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            품절
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            부족
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            정상
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatus;

