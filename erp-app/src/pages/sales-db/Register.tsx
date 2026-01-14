import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Plus, Trash2, Download, FileAudio, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';

interface Salesperson {
  id: number;
  name: string;
}

interface SalesDBRow {
  id?: number;
  proposal_date: string;
  proposer: string;
  meeting_request_datetime: string;
  salesperson_id: string;
  meeting_status: string;
  company_name: string;
  representative: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: string;
  existing_client: string;
  contract_status: string;
  termination_month: string;
  actual_sales: string;
  contract_date: string;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
  recordings?: File[]; // 녹취 파일들
}

const emptyRow: SalesDBRow = {
  proposal_date: '',
  proposer: '',
  meeting_request_datetime: '',
  salesperson_id: '',
  meeting_status: '',
  company_name: '',
  representative: '',
  address: '',
  contact: '',
  industry: '',
  sales_amount: '',
  existing_client: '',
  contract_status: '',
  termination_month: '',
  actual_sales: '',
  contract_date: '',
  contract_client: '',
  contract_month: '',
  client_name: '',
  feedback: '',
  april_type1_date: '',
};

const SalesDBRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [rows, setRows] = useState<SalesDBRow[]>([{ ...emptyRow }]);
  const [allRows, setAllRows] = useState<SalesDBRow[]>([]); // 전체 데이터 저장
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filterType, setFilterType] = useState<'single' | 'range' | 'all'>('single'); // 필터 타입
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // 기본값: 오늘
  const [startDate, setStartDate] = useState<string>(''); // 시작일
  const [endDate, setEndDate] = useState<string>(''); // 종료일
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle'); // 자동 저장 상태
  const tableContainerRef = useRef<HTMLDivElement>(null); // 테이블 컨테이너 ref
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null); // 하이라이트할 행 ID

  // 천 단위 쉼표 포맷팅 함수
  const formatNumberWithCommas = (value: string): string => {
    // 숫자만 추출
    const numbersOnly = value.replace(/[^0-9]/g, '');
    if (!numbersOnly) return '';
    // 천 단위 쉼표 추가
    return Number(numbersOnly).toLocaleString('ko-KR');
  };

  // 쉼표가 포함된 값을 숫자로 변환
  const parseNumberWithCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  useEffect(() => {
    // 현재 로그인한 사용자 정보 가져오기
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    fetchSalespersons();
    
    // 로컬 스토리지에서 임시 저장된 데이터 확인
    const savedDraft = localStorage.getItem(`db_register_draft_${user.id}`);
    
    if (savedDraft) {
      const shouldRestore = window.confirm('저장하지 않은 작업 중인 데이터가 있습니다. 복원하시겠습니까?');
      if (shouldRestore) {
        try {
          const draftData = JSON.parse(savedDraft);
          
          // 섭외자인 경우 본인의 데이터만 필터링
          if (user.role === 'recruiter') {
            const filteredData = draftData.filter((row: SalesDBRow) => 
              !row.proposer || row.proposer === user.name
            );
            setRows(filteredData);
            alert('작업 중이던 데이터를 복원했습니다.');
          } else {
            setRows(draftData);
            alert('작업 중이던 데이터를 복원했습니다.');
          }
          return; // 복원했으면 서버에서 다시 로드하지 않음
        } catch (error) {
          console.error('임시 데이터 복원 실패:', error);
          localStorage.removeItem(`db_register_draft_${user.id}`);
        }
      } else {
        localStorage.removeItem(`db_register_draft_${user.id}`);
      }
    }
    
    // 섭외자인 경우 본인이 등록한 것만 가져옴
    if (user.role === 'recruiter') {
      fetchExistingDataForRecruiter(user.name);
    } else {
      fetchExistingData();
    }
  }, []);

  // 필터 변경 시 필터링
  useEffect(() => {
    if (allRows.length > 0) {
      applyFilter();
    }
  }, [filterType, selectedDate, startDate, endDate, allRows]);

  // 작업 중인 데이터 자동 저장 (로컬 스토리지)
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // 빈 행만 있는 경우는 저장하지 않음
    const hasData = rows.some(row => row.company_name || row.contact || row.representative);
    
    if (hasData) {
      setAutoSaveStatus('saving');
      
      // 디바운스: 1초 후에 저장
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(`db_register_draft_${currentUser.id}`, JSON.stringify(rows));
          console.log('작업 내용이 자동 저장되었습니다.');
          setAutoSaveStatus('saved');
          
          // 2초 후에 상태 초기화
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
          console.error('자동 저장 실패:', error);
          setAutoSaveStatus('idle');
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rows, currentUser]);

  // URL 파라미터에서 editId를 읽어서 해당 항목 하이라이트 및 스크롤
  useEffect(() => {
    const editId = searchParams.get('editId');
    if (editId && rows.length > 0) {
      const targetId = parseInt(editId);
      const targetIndex = rows.findIndex(row => row.id === targetId);
      
      if (targetIndex !== -1) {
        // 하이라이트 설정
        setHighlightedRowId(targetId);
        
        // 해당 행으로 스크롤
        setTimeout(() => {
          const rowElement = document.querySelector(`[data-row-id="${targetId}"]`);
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
        
        // 3초 후 하이라이트 제거
        setTimeout(() => {
          setHighlightedRowId(null);
        }, 3000);
      }
    }
  }, [searchParams, rows]);

  // 키보드 방향키로 테이블 가로 스크롤
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // input, textarea, select에 포커스가 있으면 방향키 동작 안 함
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT')
      ) {
        return;
      }

      const container = tableContainerRef.current;
      if (!container) return;

      const scrollAmount = 100; // 한 번에 스크롤할 픽셀

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          container.scrollLeft -= scrollAmount;
          break;
        case 'ArrowRight':
          e.preventDefault();
          container.scrollLeft += scrollAmount;
          break;
        case 'ArrowUp':
          e.preventDefault();
          container.scrollTop -= scrollAmount;
          break;
        case 'ArrowDown':
          e.preventDefault();
          container.scrollTop += scrollAmount;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchExistingData = async () => {
    try {
      const response = await fetch('/api/sales-db/all');
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        // 기존 데이터를 행으로 변환
        const existingRows = result.data.map((item: any) => ({
          id: item.id,
          proposal_date: item.proposal_date || '',
          proposer: item.proposer || '',
          meeting_request_datetime: item.meeting_request_datetime || '',
          salesperson_id: item.salesperson_id ? String(item.salesperson_id) : '',
          meeting_status: item.meeting_status || '',
          company_name: item.company_name || '',
          representative: item.representative || '',
          address: item.address || '',
          contact: item.contact || '',
          industry: item.industry || '',
          sales_amount: item.sales_amount ? String(item.sales_amount) : '',
          existing_client: item.existing_client || '',
          contract_status: item.contract_status || '',
          termination_month: item.termination_month || '',
          actual_sales: item.actual_sales ? String(item.actual_sales) : '',
          contract_date: item.contract_date || '',
          contract_client: item.contract_client ? formatNumberWithCommas(item.contract_client) : '',
          contract_month: item.contract_month || '',
          client_name: item.client_name || '',
          feedback: item.feedback || '',
          april_type1_date: item.april_type1_date || '',
        }));
        setAllRows(existingRows);
      }
    } catch (error) {
      console.error('기존 데이터 조회 실패:', error);
    }
  };

  // 필터 적용 함수
  const applyFilter = () => {
    let filtered = allRows;
    
    if (filterType === 'single' && selectedDate) {
      // 특정 날짜 필터
      filtered = allRows.filter(row => {
        if (!row.proposal_date) return false;
        const rowDate = row.proposal_date.split('T')[0];
        return rowDate === selectedDate;
      });
    } else if (filterType === 'range' && startDate && endDate) {
      // 날짜 범위 필터
      filtered = allRows.filter(row => {
        if (!row.proposal_date) return false;
        const rowDate = row.proposal_date.split('T')[0];
        return rowDate >= startDate && rowDate <= endDate;
      });
    }
    // filterType === 'all'이면 filtered = allRows 그대로
    
    // 필터링된 데이터 + 빈 행 하나 추가
    if (currentUser?.role === 'recruiter') {
      setRows([...filtered, { ...emptyRow, proposer: currentUser.name }]);
    } else {
      setRows([...filtered, { ...emptyRow }]);
    }
  };

  const fetchExistingDataForRecruiter = async (proposerName: string) => {
    try {
      const response = await fetch(`/api/sales-db/my-data-recruiter?proposer=${encodeURIComponent(proposerName)}`);
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        // 기존 데이터를 행으로 변환
        const existingRows = result.data.map((item: any) => ({
          id: item.id,
          proposal_date: item.proposal_date || '',
          proposer: item.proposer || '',
          meeting_request_datetime: item.meeting_request_datetime || '',
          salesperson_id: item.salesperson_id ? String(item.salesperson_id) : '',
          meeting_status: item.meeting_status || '',
          company_name: item.company_name || '',
          representative: item.representative || '',
          address: item.address || '',
          contact: item.contact || '',
          industry: item.industry || '',
          sales_amount: item.sales_amount ? String(item.sales_amount) : '',
          existing_client: item.existing_client || '',
          contract_status: item.contract_status || '',
          termination_month: item.termination_month || '',
          actual_sales: item.actual_sales ? String(item.actual_sales) : '',
          contract_date: item.contract_date || '',
          contract_client: item.contract_client ? formatNumberWithCommas(item.contract_client) : '',
          contract_month: item.contract_month || '',
          client_name: item.client_name || '',
          feedback: item.feedback || '',
          april_type1_date: item.april_type1_date || '',
        }));
        setAllRows(existingRows);
      } else {
        // 데이터가 없으면 섭외자 이름이 자동 입력된 빈 행 추가
        setRows([{ ...emptyRow, proposer: proposerName }]);
      }
    } catch (error) {
      console.error('기존 데이터 조회 실패:', error);
    }
  };

  const handleAddRow = () => {
    // 섭외자인 경우 proposer를 자동으로 설정
    if (currentUser?.role === 'recruiter') {
      setRows([...rows, { ...emptyRow, proposer: currentUser.name }]);
    } else {
      setRows([...rows, { ...emptyRow }]);
    }
  };

  const handleRemoveRow = async (index: number) => {
    if (rows.length > 1) {
      const row = rows[index];
      
      // DB에 이미 저장된 데이터(id가 있는 경우)는 API를 호출하여 삭제
      if (row.id) {
        if (!confirm('이 행을 삭제하시겠습니까? DB에서 영구적으로 삭제됩니다.')) {
          return;
        }
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/sales-db/${row.id}`, {
            method: 'DELETE',
          });
          
          const result = await response.json();
          
          if (result.success) {
            alert('삭제되었습니다.');
          } else {
            alert('삭제 실패: ' + result.message);
            return;
          }
        } catch (error) {
          console.error('삭제 중 오류 발생:', error);
          alert('삭제 중 오류가 발생했습니다.');
          return;
        }
      }
      
      // UI에서 행 제거
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const handleCellChange = (index: number, field: keyof SalesDBRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  // 계약기장료 입력 핸들러
  const handleContractClientChange = (index: number, value: string) => {
    const formatted = formatNumberWithCommas(value);
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], contract_client: formatted };
    setRows(newRows);
  };

  // 중복 데이터 삭제 함수
  const handleRemoveDuplicates = async () => {
    if (!confirm('중복된 데이터를 삭제하시겠습니까? (같은 업체명, 섭외일, 섭외자의 중복 데이터 중 가장 오래된 것만 남기고 삭제됩니다)')) {
      return;
    }

    try {
      setIsUploading(true);
      const response = await fetch(`${API_BASE_URL}/api/sales-db/remove-duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        // 삭제 후 데이터 다시 로드
        if (currentUser?.role === 'recruiter') {
          await fetchExistingDataForRecruiter(currentUser.name);
        } else {
          await fetchExistingData();
        }
      } else {
        alert('중복 데이터 삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('중복 데이터 삭제 오류:', error);
      alert('중복 데이터 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAll = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (isUploading) {
      console.log('이미 저장 중입니다.');
      return;
    }

    try {
      setIsUploading(true);
      
      // 중복 체크
      const duplicates: string[] = [];
      for (const row of rows) {
        if (!row.company_name) {
          continue; // 업체명이 없는 행은 건너뛰기
        }

        // 중복 체크 API 호출
        const checkResponse = await fetch(`${API_BASE_URL}/api/sales-db/check-duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: row.company_name,
            contact: row.contact,
            exclude_id: row.id || null
          })
        });

        const checkResult = await checkResponse.json();
        
        if (checkResult.success && checkResult.isDuplicate) {
          const duplicateInfo = checkResult.duplicates[0];
          const duplicateMessage = `업체명: ${duplicateInfo.company_name}${duplicateInfo.contact ? `, 연락처: ${duplicateInfo.contact}` : ''}`;
          duplicates.push(duplicateMessage);
        }
      }

      // 중복이 발견되면 경고 표시
      if (duplicates.length > 0) {
        setIsUploading(false);
        alert('중복입니다!\n\n다음 항목이 이미 존재합니다:\n\n' + duplicates.join('\n'));
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        if (!row.company_name) {
          console.log('업체명이 없는 행은 건너뜁니다:', row);
          continue; // 필수 필드 체크
        }
        
        const payload = {
          ...row,
          // proposer 필드가 비어있으면 현재 로그인한 사용자의 이름으로 설정
          proposer: row.proposer || (currentUser?.name || ''),
          salesperson_id: row.salesperson_id ? parseInt(row.salesperson_id) : null,
          sales_amount: row.sales_amount ? parseInt(row.sales_amount) : null,
          actual_sales: row.actual_sales ? parseInt(row.actual_sales) : null,
          contract_client: row.contract_client ? parseNumberWithCommas(row.contract_client) : '',
        };

        // 기존 데이터(id가 있는 경우) - UPDATE, 새 데이터 - INSERT
        const url = row.id ? `${API_BASE_URL}/api/sales-db/${row.id}` : `${API_BASE_URL}/api/sales-db`;
        const method = row.id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log('저장 결과:', result);

        if (result.success) {
          successCount++;
          
          // 녹취 파일이 있으면 업로드
          if (row.recordings && row.recordings.length > 0) {
            const dbId = result.data?.id || row.id;
            if (dbId) {
              await uploadRecordings(dbId, row.recordings);
            }
          }
        } else {
          errorCount++;
          console.error('저장 실패:', result.message);
        }
      }

      if (successCount > 0) {
        // 저장 성공 시 로컬 스토리지의 임시 데이터 삭제
        if (currentUser?.id) {
          localStorage.removeItem(`db_register_draft_${currentUser.id}`);
          console.log('임시 저장 데이터가 삭제되었습니다.');
        }
        
        alert(`${successCount}건이 저장되었습니다.${errorCount > 0 ? ` (${errorCount}건 실패)` : ''}`);
        // 저장 후 데이터 다시 로드
        if (currentUser?.role === 'recruiter') {
          await fetchExistingDataForRecruiter(currentUser.name);
        } else {
          await fetchExistingData();
        }
      } else {
        alert('저장할 데이터가 없습니다. 업체명은 필수 입력 항목입니다.');
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 녹취 파일 업로드 함수
  const uploadRecordings = async (dbId: number, files: File[]) => {
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('recording', file);
        formData.append('uploaded_by', currentUser.id.toString());
        formData.append('uploader_name', currentUser.name);
        formData.append('uploader_role', currentUser.role);
        formData.append('recording_type', '섭외녹취');
        formData.append('notes', '');

        const response = await fetch(`${API_BASE_URL}/api/sales-db/${dbId}/recordings`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!result.success) {
          console.error(`녹취 파일 업로드 실패: ${file.name} - ${result.message}`);
        }
      }
    } catch (error) {
      console.error('녹취 파일 업로드 오류:', error);
    }
  };

  // 녹취 파일 선택 핸들러
  const handleRecordingSelect = (index: number, files: FileList | null) => {
    console.log('파일 선택 핸들러 실행:', index, files);
    if (!files || files.length === 0) {
      console.log('파일이 선택되지 않음');
      return;
    }
    
    const selectedFiles = Array.from(files);
    console.log('선택된 파일:', selectedFiles.map(f => f.name));
    
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = {
        ...newRows[index],
        recordings: [...(newRows[index].recordings || []), ...selectedFiles]
      };
      console.log('업데이트된 행:', newRows[index]);
      return newRows;
    });
  };

  // 녹취 파일 제거 핸들러
  const handleRemoveRecording = (rowIndex: number, fileIndex: number) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      const recordings = newRows[rowIndex].recordings || [];
      recordings.splice(fileIndex, 1);
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        recordings
      };
      return newRows;
    });
  };

  const downloadSampleFile = () => {
    // 샘플 데이터 생성
    const sampleData = [
      {
        '섭외날짜': '2026-01-01',
        '섭외자': '홍길동',
        '미팅희망날짜시간': '2026-01-05 14:00',
        '영업자ID': '1',
        '미팅여부': '완료',
        '업체명': '샘플회사',
        '대표자': '김대표',
        '주소': '서울시 강남구',
        '연락처': '010-1234-5678',
        '업종': '제조업',
        '연매출액': '1000000000',
        '기존거래처': '㈜거래처',
        '계약상태': '진행중',
        '해지월': '',
        '실매출액': '900000000',
        '계약날짜': '2026-01-10',
        '계약기장료': '500000',
        '계약월': '1월',
        '거래처': 'ABC주식회사',
        '기타(피드백)': '계약 진행 중',
        '해피콜내용': '고객 만족'
      }
    ];

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // 컬럼 너비 설정
    const colWidths = [
      { wch: 12 }, // 섭외날짜
      { wch: 10 }, // 섭외자
      { wch: 18 }, // 미팅희망날짜시간
      { wch: 10 }, // 영업자ID
      { wch: 10 }, // 미팅여부
      { wch: 15 }, // 업체명
      { wch: 10 }, // 대표자
      { wch: 25 }, // 주소
      { wch: 15 }, // 연락처
      { wch: 10 }, // 업종
      { wch: 15 }, // 연매출액
      { wch: 15 }, // 기존거래처
      { wch: 10 }, // 계약상태
      { wch: 10 }, // 해지월
      { wch: 15 }, // 실매출액
      { wch: 12 }, // 계약날짜
      { wch: 12 }, // 계약기장료
      { wch: 10 }, // 계약월
      { wch: 15 }, // 거래처
      { wch: 20 }, // 기타(피드백)
      { wch: 15 }  // 해피콜내용
    ];
    ws['!cols'] = colWidths;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DB등록샘플');

    // 파일 다운로드
    XLSX.writeFile(wb, 'DB등록_샘플파일.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // 섭외자인 경우 본인 정보 전달
    if (currentUser) {
      formData.append('uploader_role', currentUser.role);
      formData.append('uploader_name', currentUser.name);
      formData.append('uploader_id', String(currentUser.id));
    }

    try {
      const response = await fetch('/api/sales-db/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`업로드 완료: ${result.successCount}개 데이터`);
        if (result.errors.length > 0) {
          console.error('업로드 오류:', result.errors);
        }
        
        // 업로드 후 데이터 다시 로드
        if (currentUser?.role === 'recruiter') {
          await fetchExistingDataForRecruiter(currentUser.name);
        } else {
          await fetchExistingData();
        }
      } else {
        alert('업로드 실패: ' + result.message);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Save className="w-6 h-6 mr-2" />
                DB 등록
              </h1>
              {autoSaveStatus === 'saved' && (
                <span className="text-sm text-green-600 flex items-center animate-fade-in">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  자동 저장됨
                </span>
              )}
              {autoSaveStatus === 'saving' && (
                <span className="text-sm text-blue-600 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
                  저장 중...
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">고객 정보를 테이블 형태로 입력하세요 (작업 내용은 자동으로 저장됩니다)</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadSampleFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              샘플파일 다운로드
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? '업로드 중...' : 'CSV 업로드'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              행 추가
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isUploading}
              className={`px-4 py-2 text-white rounded-lg flex items-center ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {isUploading ? '저장 중...' : '전체 저장'}
            </button>
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleRemoveDuplicates}
                disabled={isUploading}
                className={`px-4 py-2 text-white rounded-lg flex items-center ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title="같은 업체명, 섭외일, 섭외자의 중복 데이터를 삭제합니다"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                중복 삭제
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('작업 중인 임시 저장 데이터를 삭제하고 새로 시작하시겠습니까?')) {
                  if (currentUser?.id) {
                    localStorage.removeItem(`db_register_draft_${currentUser.id}`);
                    setRows([{ ...emptyRow }]);
                    setAutoSaveStatus('idle');
                    alert('임시 저장 데이터가 삭제되었습니다.');
                  }
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center text-sm"
              title="임시 저장된 작업 내용을 삭제하고 새로 시작합니다"
            >
              <X className="w-4 h-4 mr-1" />
              새로 시작
            </button>
          </div>
        </div>

        {/* 날짜 필터 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {/* 필터 타입 선택 */}
          <div className="flex items-center space-x-2 mb-3">
            <label className="text-sm font-medium text-gray-700">필터:</label>
            <button
              onClick={() => {
                setFilterType('single');
                setSelectedDate(new Date().toISOString().split('T')[0]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              특정일
            </button>
            <button
              onClick={() => {
                setFilterType('range');
                setStartDate('');
                setEndDate('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === 'range'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              기간
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              전체
            </button>
          </div>

          {/* 필터 입력 필드 */}
          <div className="flex items-center space-x-4">
            {filterType === 'single' && (
              <>
                <label className="text-sm font-medium text-gray-700">섭외 날짜:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  오늘
                </button>
              </>
            )}

            {filterType === 'range' && (
              <>
                <label className="text-sm font-medium text-gray-700">기간:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="시작일"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-gray-600">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="종료일"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </>
            )}

            {filterType === 'all' && (
              <p className="text-sm text-gray-600">모든 날짜의 데이터를 표시합니다.</p>
            )}

            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                총 <span className="font-semibold text-blue-600">{rows.length - 1}</span>개 (빈 행 제외)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={tableContainerRef}
        className="bg-white rounded-lg shadow overflow-x-auto max-h-[70vh]"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">작업</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외날짜</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 bg-yellow-50">미팅희망날짜시간</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">영업자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">미팅여부</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">업체명<span className="text-red-500">*</span></th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">대표자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">주소</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">연락처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">업종</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">매출</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">기존거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약여부</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">해임월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">실제매출</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약날짜</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약기장료</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">기타(피드백)</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">해피콜내용</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 bg-green-50">섭외녹취</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr 
                key={index} 
                data-row-id={row.id}
                className={`hover:bg-gray-50 transition-colors ${
                  highlightedRowId === row.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''
                }`}
              >
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                    title="행 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="date"
                    value={row.proposal_date}
                    onChange={(e) => handleCellChange(index, 'proposal_date', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.proposer}
                    onChange={(e) => handleCellChange(index, 'proposer', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                    readOnly={currentUser?.role === 'recruiter'}
                    style={{ backgroundColor: currentUser?.role === 'recruiter' ? '#f3f4f6' : 'transparent' }}
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1 bg-yellow-50">
                  <input
                    type="datetime-local"
                    value={row.meeting_request_datetime}
                    onChange={(e) => handleCellChange(index, 'meeting_request_datetime', e.target.value)}
                    className="w-44 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <select
                    value={row.salesperson_id}
                    onChange={(e) => handleCellChange(index, 'salesperson_id', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <select
                    value={row.meeting_status}
                    onChange={(e) => handleCellChange(index, 'meeting_status', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="미팅완료">미팅완료</option>
                    <option value="일정재확인요청">일정재확인요청</option>
                    <option value="미팅거절">미팅거절</option>
                  </select>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.company_name}
                    onChange={(e) => handleCellChange(index, 'company_name', e.target.value)}
                    required
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.representative}
                    onChange={(e) => handleCellChange(index, 'representative', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.address}
                    onChange={(e) => handleCellChange(index, 'address', e.target.value)}
                    className="w-48 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contact}
                    onChange={(e) => handleCellChange(index, 'contact', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.industry}
                    onChange={(e) => handleCellChange(index, 'industry', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    value={row.sales_amount}
                    onChange={(e) => handleCellChange(index, 'sales_amount', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.existing_client}
                    onChange={(e) => handleCellChange(index, 'existing_client', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <select
                    value={row.contract_status}
                    onChange={(e) => handleCellChange(index, 'contract_status', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.termination_month}
                    onChange={(e) => handleCellChange(index, 'termination_month', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    value={row.actual_sales}
                    onChange={(e) => handleCellChange(index, 'actual_sales', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="date"
                    value={row.contract_date}
                    onChange={(e) => handleCellChange(index, 'contract_date', e.target.value)}
                    className="w-36 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_client}
                    onChange={(e) => handleContractClientChange(index, e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500 text-right"
                    placeholder="0"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_month}
                    onChange={(e) => handleCellChange(index, 'contract_month', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.client_name}
                    onChange={(e) => handleCellChange(index, 'client_name', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.feedback}
                    onChange={(e) => handleCellChange(index, 'feedback', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.april_type1_date}
                    onChange={(e) => handleCellChange(index, 'april_type1_date', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                    placeholder="한글 입력 가능"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1 bg-green-50">
                  <div className="flex flex-col gap-1 w-32">
                    <input
                      type="file"
                      id={`recording-file-${index}`}
                      multiple
                      accept="audio/*,video/*"
                      onChange={(e) => handleRecordingSelect(index, e.target.files)}
                      className="absolute w-0 h-0 opacity-0 pointer-events-none"
                    />
                    <label
                      htmlFor={`recording-file-${index}`}
                      className="flex items-center justify-center gap-1 cursor-pointer px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                    >
                      <FileAudio className="w-3 h-3" />
                      <span>파일 선택</span>
                    </label>
                    {row.recordings && row.recordings.length > 0 && (
                      <div className="text-xs space-y-1">
                        {row.recordings.map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center justify-between bg-white px-1 py-0.5 rounded border">
                            <span className="truncate flex-1 text-xs" title={file.name}>{file.name.substring(0, 10)}...</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecording(index, fileIndex)}
                              className="text-red-600 hover:text-red-800 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• 업체명은 필수 입력 항목입니다.</p>
        <p>• CSV 파일 업로드 시 헤더는 한글 또는 영문을 사용할 수 있습니다.</p>
        <p>• 행을 추가하여 여러 건을 한 번에 입력할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default SalesDBRegister;
