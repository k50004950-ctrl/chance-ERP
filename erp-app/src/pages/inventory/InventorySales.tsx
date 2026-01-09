import React, { useState } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Package, Calendar } from 'lucide-react';

interface SaleRecord {
  id: number;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customer: string;
}

const InventorySales: React.FC = () => {
  // 샘플 데이터
  const [sales] = useState<SaleRecord[]>([
    {
      id: 1,
      date: '2024-08-15',
      productName: '3CE MULTI EYE COLOR PALETTE',
      quantity: 5,
      unitPrice: 32000,
      totalPrice: 160000,
      customer: '고객A',
    },
    {
      id: 2,
      date: '2024-08-14',
      productName: 'LANEIGE 水庫面膜',
      quantity: 10,
      unitPrice: 28000,
      totalPrice: 280000,
      customer: '고객B',
    },
    {
      id: 3,
      date: '2024-08-13',
      productName: 'INNISFREE 绿茶籽精华',
      quantity: 8,
      unitPrice: 35000,
      totalPrice: 280000,
      customer: '고객C',
    },
  ]);

  // 통계 계산
  const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">판매수</h1>
        <p className="text-gray-600">제품 판매 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">총 판매액</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totalSales.toLocaleString()}</p>
          <p className="text-xs opacity-75 mt-1">원</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">총 판매량</span>
            <Package className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totalQuantity}</p>
          <p className="text-xs opacity-75 mt-1">개</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">총 주문 수</span>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totalOrders}</p>
          <p className="text-xs opacity-75 mt-1">건</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">평균 주문액</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">
            {Math.round(avgOrderValue).toLocaleString()}
          </p>
          <p className="text-xs opacity-75 mt-1">원</p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">판매 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  수량
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  단가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  합계
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  고객
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    판매 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{sale.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {sale.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sale.quantity}개
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.unitPrice.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {sale.totalPrice.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.customer}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State Notice */}
      {sales.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <ShoppingCart className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            아직 판매 내역이 없습니다
          </h3>
          <p className="text-gray-600">
            첫 판매를 기록하고 성과를 확인해보세요!
          </p>
        </div>
      )}
    </div>
  );
};

export default InventorySales;

