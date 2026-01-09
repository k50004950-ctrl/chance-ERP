import React, { useState, useEffect, useRef } from 'react';
import { Building, Plus, Edit, Trash2, Save, X, Search, Upload, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { storageUtils } from '../../lib/storage';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface Client {
  id: number;
  businessName: string;
  businessNumber: string;
  type: '매입처' | '매출처' | '매입/매출';
  productName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  memo?: string;
}

const ClientRegister: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    businessName: '',
    businessNumber: '',
    type: '매입처',
    productName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    memo: ''
  });

  // LocalStorage에서 거래처 목록 불러오기
  useEffect(() => {
    console.log('[ClientRegister] 거래처 목록 로드 중...');
    const savedClients = storageUtils.get<Client[]>('erp_clients');
    
    if (savedClients && Array.isArray(savedClients)) {
      console.log('[ClientRegister] 기존 거래처 로드 완료:', savedClients.length, '개');
      setClients(savedClients);
    } else {
      console.log('[ClientRegister] 거래처 목록 없음');
      setClients([]);
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      businessName: '',
      businessNumber: '',
      type: '매입처',
      productName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      memo: ''
    });
    setShowModal(true);
  };

  const handleEdit = (client: Client) => {
    setIsEditing(true);
    setEditingId(client.id);
    setFormData({
      businessName: client.businessName,
      businessNumber: client.businessNumber,
      type: client.type,
      productName: client.productName,
      contactPerson: client.contactPerson || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      memo: client.memo || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || formData.businessName.trim() === '') {
      alert('사업자명을 입력해주세요.');
      return;
    }
    if (!formData.businessNumber || formData.businessNumber.trim() === '') {
      alert('사업자등록번호를 입력해주세요.');
      return;
    }
    if (!formData.productName || formData.productName.trim() === '') {
      alert('제품명을 입력해주세요.');
      return;
    }

    let updatedClients: Client[];

    if (isEditing && editingId) {
      // 수정
      updatedClients = clients.map(client =>
        client.id === editingId ? { ...formData, id: editingId } : client
      );
      console.log('[ClientRegister] 거래처 수정:', formData.businessName);
    } else {
      // 추가
      const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
      const newClient: Client = {
        ...formData,
        id: newId
      };
      updatedClients = [...clients, newClient];
      console.log('[ClientRegister] 새 거래처 추가:', formData.businessName);
    }

    setClients(updatedClients);
    storageUtils.set('erp_clients', updatedClients);

    alert(isEditing ? '거래처 정보가 수정되었습니다!' : '거래처가 추가되었습니다!');
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 거래처를 삭제하시겠습니까?')) {
      const updatedClients = clients.filter(client => client.id !== id);
      setClients(updatedClients);
      storageUtils.set('erp_clients', updatedClients);
      console.log('[ClientRegister] 거래처 삭제 완료, 남은 거래처:', updatedClients.length, '개');
      alert('거래처가 삭제되었습니다.');
    }
  };

  // CSV 샘플 파일 다운로드
  const downloadSampleCSV = () => {
    try {
      console.log('CSV 샘플 파일 다운로드 시작...');
      
      const csvContent = [
        ['사업자명', '사업자등록번호', '매입처/매출처', '제품명', '담당자', '연락처', '이메일', '주소', '메모'],
        ['(주)ABC무역', '123-45-67890', '매입처', '화장품', '홍길동', '010-1234-5678', 'abc@example.com', '서울특별시 강남구', '주요 거래처'],
        ['(주)XYZ유통', '987-65-43210', '매출처', '전자제품', '김철수', '010-9876-5432', 'xyz@example.com', '서울특별시 서초구', ''],
        ['DEF상사', '456-78-91230', '매입/매출', '식품', '이영희', '010-5555-6666', 'def@example.com', '경기도 성남시', '양방향 거래'],
      ]
        .map(row => row.join(','))
        .join('\n');
      
      const BOM = '\uFEFF';
      const csvData = BOM + csvContent;
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `client_sample_${dateStr}.csv`;
      
      try {
        saveAs(blob, fileName);
        console.log('FileSaver.js 다운로드 성공');
      } catch (fsError) {
        console.error('FileSaver.js 실패, fallback 시도:', fsError);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      
      alert(`${fileName} 파일이 다운로드되었습니다.\n브라우저 다운로드 폴더(Downloads)를 확인해주세요.`);
    } catch (error) {
      console.error('CSV 샘플 파일 다운로드 실패:', error);
      alert(`샘플 파일 다운로드에 실패했습니다.\n오류: ${error}`);
    }
  };

  // Excel 샘플 파일 다운로드
  const downloadSampleExcel = () => {
    try {
      console.log('Excel 샘플 파일 다운로드 시작...');
      
      const sampleData = [
        ['사업자명', '사업자등록번호', '매입처/매출처', '제품명', '담당자', '연락처', '이메일', '주소', '메모'],
        ['(주)ABC무역', '123-45-67890', '매입처', '화장품', '홍길동', '010-1234-5678', 'abc@example.com', '서울특별시 강남구', '주요 거래처'],
        ['(주)XYZ유통', '987-65-43210', '매출처', '전자제품', '김철수', '010-9876-5432', 'xyz@example.com', '서울특별시 서초구', ''],
        ['DEF상사', '456-78-91230', '매입/매출', '식품', '이영희', '010-5555-6666', 'def@example.com', '경기도 성남시', '양방향 거래'],
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
      
      worksheet['!cols'] = [
        { wch: 20 }, // 사업자명
        { wch: 18 }, // 사업자등록번호
        { wch: 15 }, // 매입처/매출처
        { wch: 20 }, // 제품명
        { wch: 12 }, // 담당자
        { wch: 15 }, // 연락처
        { wch: 25 }, // 이메일
        { wch: 30 }, // 주소
        { wch: 20 }, // 메모
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      const fileName = `client_sample_${dateStr}.xlsx`;
      
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      try {
        saveAs(blob, fileName);
        console.log('FileSaver.js 다운로드 성공');
      } catch (fsError) {
        console.error('FileSaver.js 실패, fallback 시도:', fsError);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
      
      alert(`${fileName} 파일이 다운로드되었습니다.\n브라우저 다운로드 폴더(Downloads)를 확인해주세요.`);
    } catch (error) {
      console.error('Excel 샘플 파일 다운로드 실패:', error);
      alert(`샘플 파일 다운로드에 실패했습니다.\n오류: ${error}`);
    }
  };

  // Excel 파일 업로드
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          alert('파일에 데이터가 없습니다.');
          return;
        }

        const newClients: Client[] = [];
        let maxId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) : 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[0] || !row[1] || !row[3]) continue; // 필수 필드 체크

          const newClient: Client = {
            id: ++maxId,
            businessName: String(row[0] || ''),
            businessNumber: String(row[1] || ''),
            type: (row[2] as '매입처' | '매출처' | '매입/매출') || '매입처',
            productName: String(row[3] || ''),
            contactPerson: row[4] ? String(row[4]) : undefined,
            phone: row[5] ? String(row[5]) : undefined,
            email: row[6] ? String(row[6]) : undefined,
            address: row[7] ? String(row[7]) : undefined,
            memo: row[8] ? String(row[8]) : undefined,
          };

          newClients.push(newClient);
        }

        if (newClients.length > 0) {
          const updatedClients = [...clients, ...newClients];
          setClients(updatedClients);
          storageUtils.set('erp_clients', updatedClients);
          console.log('[ClientRegister] Excel 업로드 완료:', newClients.length, '개 거래처 추가');
          alert(`${newClients.length}개의 거래처가 추가되었습니다.`);
        } else {
          alert('유효한 거래처 데이터가 없습니다.');
        }
      } catch (error) {
        console.error('Excel 파일 처리 실패:', error);
        alert('파일 처리 중 오류가 발생했습니다.');
      }
    };

    reader.readAsBinaryString(file);
    
    if (event.target) {
      event.target.value = '';
    }
  };

  // 검색 필터링
  const filteredClients = clients.filter(client => 
    client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.businessNumber.includes(searchTerm) ||
    client.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.type.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">거래처 등록</h1>
        <p className="text-gray-600">매입처 및 매출처 정보를 관리하세요</p>
      </div>

      {/* 검색 및 추가 버튼 */}
      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="사업자명, 사업자번호, 제품명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {/* 샘플 파일 다운로드 드롭다운 */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>샘플 파일</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
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

          {/* 엑셀 업로드 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Excel 업로드</span>
          </button>

          {/* 거래처 추가 */}
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>거래처 추가</span>
          </button>
        </div>
      </div>

      {/* 파일 업로드 안내 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">파일 업로드 안내</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Excel 및 CSV 파일 형식을 지원합니다 (.xlsx, .xls, .csv)</li>
              <li>첫 번째 행은 헤더(사업자명, 사업자등록번호, 매입처/매출처, 제품명, 담당자, 연락처, 이메일, 주소, 메모)여야 합니다</li>
              <li>샘플 파일을 다운로드하여 형식을 확인하세요</li>
              <li>필수 입력: 사업자명, 사업자등록번호, 제품명</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 거래처 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사업자명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사업자등록번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매입처/매출처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">등록된 거래처가 없습니다</p>
                    <p className="text-sm text-gray-400">거래처를 추가해주세요</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{client.businessName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.businessNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        client.type === '매입처' ? 'bg-blue-100 text-blue-800' :
                        client.type === '매출처' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {client.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.contactPerson || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {client.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 총 거래처 수 */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{filteredClients.length}</span>개의 거래처
            {searchTerm && ` (전체 ${clients.length}개 중 검색됨)`}
          </p>
        </div>
      </div>

      {/* 거래처 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditing ? '거래처 정보 수정' : '새 거래처 추가'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 사업자명 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) (주)ABC무역"
                    required
                  />
                </div>

                {/* 사업자등록번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessNumber"
                    value={formData.businessNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 123-45-67890"
                    required
                  />
                </div>

                {/* 매입처/매출처 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    구분 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="매입처">매입처</option>
                    <option value="매출처">매출처</option>
                    <option value="매입/매출">매입/매출</option>
                  </select>
                </div>

                {/* 제품명 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    취급 제품명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 화장품, 전자제품, 식품 등"
                    required
                  />
                </div>

                {/* 담당자 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 홍길동"
                  />
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 010-1234-5678"
                  />
                </div>

                {/* 이메일 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) abc@example.com"
                  />
                </div>

                {/* 주소 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 서울특별시 강남구..."
                  />
                </div>

                {/* 메모 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="추가 정보나 특이사항을 입력하세요"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? '수정하기' : '등록하기'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRegister;

