import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Save, Trash2, Edit, Plus, X, Globe } from 'lucide-react';
import { storageUtils, type CompanyLocation } from '../../lib/storage';

const CompanySettings: React.FC = () => {
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<CompanyLocation, 'id'>>({
    name: '',
    address: '',
    lat: 37.5666805,
    lng: 126.9784147,
    radius: 100
  });

  // LocalStorage에서 회사 목록 불러오기
  useEffect(() => {
    console.log('[CompanySettings] 회사 위치 목록 로드 중...');
    const savedLocations = storageUtils.get<CompanyLocation[]>(storageUtils.keys.COMPANY_LOCATIONS);
    
    if (savedLocations && Array.isArray(savedLocations)) {
      console.log('[CompanySettings] 기존 회사 위치 로드 완료:', savedLocations.length, '개');
      setLocations(savedLocations);
    } else {
      console.log('[CompanySettings] 기본 회사 위치 사용');
      // 기본 회사 위치 설정
      const defaultLocations: CompanyLocation[] = [
        {
          id: 1,
          name: '회사 본사',
          address: '서울특별시 중구 세종대로 110',
          lat: 37.5666805,
          lng: 126.9784147,
          radius: 100
        }
      ];
      setLocations(defaultLocations);
      storageUtils.set(storageUtils.keys.COMPANY_LOCATIONS, defaultLocations);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' || name === 'radius' ? parseFloat(value) || 0 : value
    }));
  };

  const handleGeocodeAddress = async () => {
    if (!formData.address || formData.address.trim() === '') {
      alert('주소를 입력해주세요.');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'HEUN-EUI-ERP/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('주소 검색에 실패했습니다.');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        }));
        alert(`좌표를 찾았습니다!\n위도: ${location.lat}\n경도: ${location.lon}`);
      } else {
        setGeocodeError('해당 주소의 좌표를 찾을 수 없습니다.');
        alert('해당 주소의 좌표를 찾을 수 없습니다.\n더 구체적인 주소를 입력하거나, 직접 좌표를 입력해주세요.');
      }
    } catch (error) {
      console.error('Geocoding 오류:', error);
      setGeocodeError('좌표 검색 중 오류가 발생했습니다.');
      alert('좌표 검색 중 오류가 발생했습니다.\n직접 좌표를 입력해주세요.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      address: '',
      lat: 37.5666805,
      lng: 126.9784147,
      radius: 100
    });
    setGeocodeError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (location: CompanyLocation) => {
    setIsEditing(true);
    setEditingId(location.id);
    setFormData({
      name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      radius: location.radius
    });
    setGeocodeError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setGeocodeError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim() === '') {
      alert('회사 이름을 입력해주세요.');
      return;
    }
    if (formData.radius < 10 || formData.radius > 1000) {
      alert('출근 가능 반경은 10m ~ 1000m 사이로 설정해주세요.');
      return;
    }
    if (formData.lat < -90 || formData.lat > 90) {
      alert('위도는 -90 ~ 90 사이의 값으로 설정해주세요.');
      return;
    }
    if (formData.lng < -180 || formData.lng > 180) {
      alert('경도는 -180 ~ 180 사이의 값으로 설정해주세요.');
      return;
    }

    let updatedLocations: CompanyLocation[];

    if (isEditing && editingId) {
      // 수정
      updatedLocations = locations.map(loc =>
        loc.id === editingId ? { ...formData, id: editingId } : loc
      );
    } else {
      // 추가
      const newId = locations.length > 0 ? Math.max(...locations.map(l => l.id)) + 1 : 1;
      const newLocation: CompanyLocation = {
        ...formData,
        id: newId
      };
      updatedLocations = [...locations, newLocation];
    }

    setLocations(updatedLocations);
    storageUtils.set(storageUtils.keys.COMPANY_LOCATIONS, updatedLocations);
    
    console.log('[CompanySettings] 회사 위치 저장 완료:', updatedLocations);
    
    // 메인 회사 위치도 업데이트 (첫 번째 또는 편집된 위치)
    if (updatedLocations.length > 0) {
      const mainLocation = isEditing && editingId 
        ? updatedLocations.find(l => l.id === editingId)
        : updatedLocations[0];
      if (mainLocation) {
        storageUtils.set('erp_company_location', mainLocation);
        console.log('[CompanySettings] 메인 회사 위치 업데이트:', mainLocation.name);
      }
    }

    alert(isEditing ? '회사 정보가 수정되었습니다!' : '회사가 추가되었습니다!');
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (locations.length === 1) {
      alert('최소 하나의 회사는 남아 있어야 합니다.');
      return;
    }

    if (window.confirm('정말로 이 회사를 삭제하시겠습니까?')) {
      const updatedLocations = locations.filter(loc => loc.id !== id);
      setLocations(updatedLocations);
      storageUtils.set(storageUtils.keys.COMPANY_LOCATIONS, updatedLocations);
      console.log('[CompanySettings] 회사 삭제 완료, 남은 회사:', updatedLocations.length, '개');
      
      // 메인 회사 위치 업데이트
      if (updatedLocations.length > 0) {
        storageUtils.set('erp_company_location', updatedLocations[0]);
      }
      
      alert('회사가 삭제되었습니다.');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Building2 className="w-7 h-7 mr-2 text-blue-600" /> 회사 설정
            </h1>
            <p className="text-gray-600 mt-2">회사 위치 및 출근 제한 반경을 관리합니다.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>회사 추가</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-800 mb-1">📍 회사 위치 관리</p>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>본사, 지점, 공장 등 여러 회사 위치를 등록할 수 있습니다</li>
              <li>직원 등록 시 근무 장소를 여기서 선택할 수 있습니다</li>
              <li>각 위치마다 출근 가능 반경을 설정할 수 있습니다</li>
              <li>외근직 직원은 위치와 관계없이 출근 체크가 가능합니다</li>
            </ul>
          </div>
        </div>

        {/* Company List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  좌표
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  출근 반경
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{location.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{location.address || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {location.radius}m
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEditModal(location)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={locations.length === 1}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 예시 좌표 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">💡 예시 좌표</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>서울시청: 37.5666805, 126.9784147</li>
            <li>광화문광장: 37.5720164, 126.9769814</li>
            <li>강남역: 37.4979462, 127.0276368</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '회사 정보 수정' : '회사 추가'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 회사 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-gray-600" /> 회사 기본 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 회사 본사, 서울 지점, 부산 공장"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출근 가능 반경 (미터) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="radius"
                      value={formData.radius}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="100"
                      min="10"
                      max="1000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사 주소
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울특별시 중구 세종대로 110"
                    />
                    <button
                      type="button"
                      onClick={handleGeocodeAddress}
                      disabled={isGeocoding}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 whitespace-nowrap"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{isGeocoding ? '검색 중...' : '좌표 찾기'}</span>
                    </button>
                  </div>
                  {geocodeError && (
                    <p className="text-xs text-red-600 mt-1">{geocodeError}</p>
                  )}
                </div>
              </div>

              {/* GPS 좌표 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-gray-600" /> GPS 좌표
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      위도 (Latitude) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="lat"
                      value={formData.lat}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="37.5666805"
                      step="any"
                      min="-90"
                      max="90"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      경도 (Longitude) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="lng"
                      value={formData.lng}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="126.9784147"
                      step="any"
                      min="-180"
                      max="180"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? '수정' : '추가'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettings;
