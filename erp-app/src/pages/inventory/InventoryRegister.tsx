import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Plus, Trash2, Save, FileSpreadsheet, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getAPI } from '../../lib/storage';
import type { Product } from '../../types/electron';

interface InventoryItem {
  id?: number;
  barcode: string;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
  month?: string;
}

const InventoryRegister: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExistingProducts();
  }, []);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadExistingProducts = async () => {
    try {
      const api = getAPI();
      const response = await api.products.getAll();
      const productList = Array.isArray(response.data) ? response.data : [];
      
      console.log('불러온 제품 목록:', productList); // 디버깅용
      
      if (productList.length > 0) {
        const mappedItems = productList.map(p => ({
          id: p.id,
          barcode: p.barcode || '',
          name: p.name || '',
          quantity: p.quantity || 0,
          price: p.price || 0,
          costPrice: p.costPrice || 0,
          month: p.month || '',
        }));
        setItems(mappedItems);
      } else {
        // 빈 행 추가
        addNewRow();
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      addNewRow();
    }
  };

  const addNewRow = () => {
    setItems([...items, {
      barcode: '',
      name: '',
      quantity: 0,
      price: 0,
      costPrice: 0,
      month: '',
    }]);
  };

  const deleteRow = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof InventoryItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const api = getAPI();
      let savedCount = 0;
      
      for (const item of items) {
        if (item.barcode && item.name) {
          const productData: Product = {
            barcode: item.barcode,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice,
            month: item.month,
          };

          if (item.id) {
            const result = await api.products.update(item.id, productData);
            console.log('제품 업데이트 결과:', result);
            if (result.success) savedCount++;
          } else {
            const result = await api.products.create(productData);
            console.log('제품 생성 결과:', result);
            if (result.success) savedCount++;
          }
        }
      }
      
      console.log(`총 ${savedCount}개 제품 저장 완료`);
      console.log('LocalStorage 확인:', localStorage.getItem('erp_products'));
      
      alert(`재고가 성공적으로 저장되었습니다. (${savedCount}개)`);
      await loadExistingProducts();
      
      // 다른 컴포넌트에게 데이터가 변경되었음을 알림
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert('재고 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 첫 번째 시트 가져오기
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const newItems: InventoryItem[] = [];
        
        // 첫 줄은 헤더이므로 건너뜀
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          newItems.push({
            month: String(row[0] || ''),
            barcode: String(row[1] || ''),
            name: String(row[2] || ''),
            quantity: parseInt(String(row[3] || '0')) || 0,
            price: parseInt(String(row[4] || '0')) || 0,
            costPrice: parseInt(String(row[5] || '0')) || 0,
          });
        }

        if (newItems.length > 0) {
          setItems(newItems);
          alert(`${newItems.length}개의 항목이 업로드되었습니다.`);
        } else {
          alert('파일에서 데이터를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('Failed to parse Excel:', error);
        alert('파일 파싱 중 오류가 발생했습니다.');
      }
    };

    reader.readAsBinaryString(file);
    
    // input 초기화
    event.target.value = '';
  };

  const downloadSampleCSV = () => {
    try {
      console.log('CSV 샘플 파일 다운로드 시작...');
      
      // CSV 형식으로 샘플 데이터 생성
      const csvContent = [
        ['월', '바코드', '제품명', '수량', '소비자가격', '매입단가'],
        ['7', '8809664987939', '3CE 멀티 아이 컬러 팔레트', '10', '32000', '28000'],
        ['8', '8809664980947', '라네즈 워터 슬리핑 마스크', '15', '28000', '25000'],
        ['9', '8809664981234', '이니스프리 그린티 세럼', '20', '35000', '30000'],
      ]
        .map(row => row.join(','))
        .join('\n');
      
      // UTF-8 BOM 추가 (Excel에서 한글이 깨지지 않도록)
      const BOM = '\uFEFF';
      const csvData = BOM + csvContent;
      
      // Blob 생성
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      // 현재 날짜를 파일명에 포함 (영문으로 변경)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `inventory_sample_${dateStr}.csv`;
      
      console.log('파일명:', fileName);
      console.log('브라우저:', navigator.userAgent);
      
      // FileSaver.js를 사용한 다운로드 (Chrome 호환성 강화)
      try {
        saveAs(blob, fileName);
        console.log('FileSaver.js 다운로드 성공');
      } catch (fsError) {
        console.error('FileSaver.js 실패, fallback 시도:', fsError);
        
        // Fallback: 직접 다운로드 링크 생성 (Chrome용)
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName); // Chrome 호환성
        
        // Chrome에서 확실히 작동하도록 설정
        document.body.appendChild(link);
        link.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Fallback 다운로드 완료');
      }
      
      console.log('CSV 샘플 파일 다운로드 완료!');
      alert(`${fileName} 파일이 다운로드되었습니다.\n브라우저 다운로드 폴더(Downloads)를 확인해주세요.`);
    } catch (error) {
      console.error('CSV 샘플 파일 다운로드 실패:', error);
      alert(`샘플 파일 다운로드에 실패했습니다.\n오류: ${error}`);
    }
  };

  const downloadSampleExcel = () => {
    try {
      console.log('Excel 샘플 파일 다운로드 시작...');
      
      // 샘플 데이터 생성
      const sampleData = [
        ['월', '바코드', '제품명', '수량', '소비자가격', '매입단가'],
        ['7', '8809664987939', '3CE 멀티 아이 컬러 팔레트', 10, 32000, 28000],
        ['8', '8809664980947', '라네즈 워터 슬리핑 마스크', 15, 28000, 25000],
        ['9', '8809664981234', '이니스프리 그린티 세럼', 20, 35000, 30000],
      ];

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
      
      // 열 너비 설정
      worksheet['!cols'] = [
        { wch: 8 },  // 월
        { wch: 15 }, // 바코드
        { wch: 30 }, // 제품명
        { wch: 10 }, // 수량
        { wch: 15 }, // 소비자가격
        { wch: 15 }, // 매입단가
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
      
      // 현재 날짜를 파일명에 포함 (영문으로 변경)
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `inventory_sample_${dateStr}.xlsx`;
      
      console.log('Excel 파일 생성 중:', fileName);
      console.log('브라우저:', navigator.userAgent);
      
      // Excel 파일을 Blob으로 변환
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // FileSaver.js를 사용한 다운로드 (Chrome 호환성 강화)
      try {
        saveAs(blob, fileName);
        console.log('FileSaver.js 다운로드 성공');
      } catch (fsError) {
        console.error('FileSaver.js 실패, fallback 시도:', fsError);
        
        // Fallback: 직접 다운로드 링크 생성 (Chrome용)
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName); // Chrome 호환성
        
        // Chrome에서 확실히 작동하도록 설정
        document.body.appendChild(link);
        link.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Fallback 다운로드 완료');
      }
      
      console.log('Excel 샘플 파일 다운로드 완료!');
      alert(`${fileName} 파일이 다운로드되었습니다.\n브라우저 다운로드 폴더(Downloads)를 확인해주세요.`);
    } catch (error) {
      console.error('Excel 샘플 파일 다운로드 실패:', error);
      alert(`샘플 파일 다운로드에 실패했습니다.\n오류: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">재고 등록</h1>
        <p className="text-gray-600">엑셀 파일을 업로드하거나 직접 입력하여 재고를 등록하세요</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {/* 샘플 파일 다운로드 드롭다운 */}
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>샘플 파일 다운로드</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* 드롭다운 메뉴 */}
          {showDownloadMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <button
                onClick={() => {
                  downloadSampleCSV();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 first:rounded-t-lg transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-800">CSV 파일</div>
                  <div className="text-xs text-gray-500">Excel에서 바로 열기</div>
                </div>
              </button>
              <button
                onClick={() => {
                  downloadSampleExcel();
                  setShowDownloadMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 last:rounded-b-lg border-t border-gray-100 transition-colors"
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-800">Excel 파일 (.xlsx)</div>
                  <div className="text-xs text-gray-500">Excel 전용 형식</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>엑셀 업로드</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={addNewRow}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>행 추가</span>
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? '저장 중...' : '저장'}</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">파일 업로드 안내</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Excel 및 CSV 파일 형식을 지원합니다 (.xlsx, .xls, .csv)</li>
              <li>첫 번째 행은 헤더(월, 바코드, 제품명, 수량, 소비자가격, 매입단가)여야 합니다</li>
              <li>샘플 CSV 파일을 다운로드하여 형식을 확인하세요</li>
              <li>샘플 파일을 엑셀에서 수정한 후 업로드할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                  번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  바코드
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  제품명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  수량
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  소비자가격
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  매입단가
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    등록된 재고가 없습니다. 행을 추가하거나 엑셀 파일을 업로드하세요.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.month || ''}
                        onChange={(e) => updateItem(index, 'month', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 7"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.barcode}
                        onChange={(e) => updateItem(index, 'barcode', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="바코드"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="제품명"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => updateItem(index, 'costPrice', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRow(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">총 항목 수:</span>
          <span className="font-semibold text-gray-900">{items.length}개</span>
        </div>
      </div>
    </div>
  );
};

export default InventoryRegister;

