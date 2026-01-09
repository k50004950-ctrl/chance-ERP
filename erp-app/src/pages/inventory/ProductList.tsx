import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Upload, FileSpreadsheet } from 'lucide-react';
import type { Product } from '../../types/electron';
import { getAPI } from '../../lib/storage';
import { getElectronAPI } from '../../utils/mockElectronAPI';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const api = getElectronAPI();
      const result = await api.products.getAll();
      if (result.success && result.data) {
        setProducts(result.data);
        setFilteredProducts(result.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const api = getElectronAPI();
      const result = await api.products.delete(id);
      if (result.success) {
        setMessage({ type: 'success', text: '제품이 삭제되었습니다.' });
        loadProducts();
      } else {
        setMessage({ type: 'error', text: result.message || '삭제에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
    }
  };

  const handleImportExcel = async () => {
    if (!confirm('CSV 파일에서 데이터를 가져오시겠습니까? 기존 제품은 업데이트됩니다.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const api = getElectronAPI();
      const result = await api.products.importCSV();
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${result.count}개의 제품을 성공적으로 임포트했습니다!` 
        });
        loadProducts();
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || '임포트에 실패했습니다.' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: '임포트 중 오류가 발생했습니다.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">제품 목록</h1>
        <p className="text-gray-600 mt-2">등록된 제품을 조회하고 관리하세요</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제품명 또는 바코드로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Import Button */}
          <button
            onClick={handleImportExcel}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>엑셀 임포트</span>
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 flex space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">총 제품:</span>
            <span className="font-semibold text-gray-800">{products.length}개</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">총 재고:</span>
            <span className="font-semibold text-gray-800">
              {formatNumber(products.reduce((sum, p) => sum + p.quantity, 0))}개
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-400'
              : 'bg-red-100 text-red-800 border border-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 제품이 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    바코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제품명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소비자가격
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매입단가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    월
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.quantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{formatNumber(product.consumer_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₩{formatNumber(product.purchase_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.month || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;

