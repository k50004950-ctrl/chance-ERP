import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

interface UserInfo {
  id: number;
  name: string;
  social_security_number?: string;
  address?: string;
  phone?: string;
}

const CommissionContract: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [contractDate, setContractDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const handlePrint = () => {
    if (contractRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>업무위촉계약서 - ${user?.name}</title>
              <style>
                @media print {
                  @page { margin: 2cm; }
                }
                body {
                  font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
                  line-height: 1.8;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .contract-header {
                  text-align: center;
                  margin-bottom: 40px;
                }
                .contract-title {
                  font-size: 28px;
                  font-weight: bold;
                  margin-bottom: 20px;
                }
                .contract-content {
                  font-size: 14px;
                  text-align: justify;
                }
                .article {
                  margin: 20px 0;
                }
                .article-title {
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .signature-section {
                  margin-top: 60px;
                  display: flex;
                  justify-content: space-between;
                }
                .signature-box {
                  text-align: center;
                  min-width: 200px;
                }
                .signature-line {
                  border-bottom: 1px solid #000;
                  margin: 10px 0;
                  padding: 20px 0;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                table td {
                  padding: 10px;
                  border: 1px solid #666;
                }
                table td:first-child {
                  width: 120px;
                  background-color: #f5f5f5;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              ${contractRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">업무위촉계약서 발급</h1>
              <p className="text-gray-600">계약 날짜를 선택하고 계약서를 발급받으세요.</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            <span>인쇄/다운로드</span>
          </button>
        </div>
      </div>

      {/* 날짜 선택 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약 날짜 선택
            </label>
            <input
              type="date"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 계약서 미리보기 */}
      <div className="bg-white rounded-lg shadow-lg p-8 md:p-12" ref={contractRef}>
        {/* 계약서 헤더 */}
        <div className="contract-header text-center mb-10">
          <h1 className="contract-title text-3xl font-bold mb-4">업무위촉계약서</h1>
          <p className="text-gray-600">(주)찬스컴퍼니 (이하 "갑"이라 한다)와 {user?.name} (이하 "을"이라 한다)는<br />
          다음과 같이 업무위촉계약을 체결한다.</p>
        </div>

        {/* 계약 내용 */}
        <div className="contract-content space-y-6">
          {/* 제1조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제1조 (목적)</div>
            <p className="leading-relaxed">
              본 계약은 "갑"이 "을"에게 세무, 회계 관련 업무 및 영업 업무를 위촉하고, 
              "을"이 이를 수행함에 있어 필요한 사항을 정함을 목적으로 한다.
            </p>
          </div>

          {/* 제2조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제2조 (계약기간)</div>
            <p className="leading-relaxed">
              본 계약의 기간은 {formatDate(contractDate)}부터 1년간으로 하며, 
              계약 만료 1개월 전까지 어느 일방의 이의가 없을 경우 동일한 조건으로 1년씩 자동 연장된다.
            </p>
          </div>

          {/* 제3조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제3조 (업무내용)</div>
            <p className="leading-relaxed mb-2">"을"이 수행할 업무는 다음과 같다:</p>
            <ul className="list-decimal list-inside space-y-2 ml-4">
              <li>세무, 회계 고객 발굴 및 계약 체결 지원</li>
              <li>거래처 관리 및 유지</li>
              <li>세무, 회계 관련 기타 영업 활동</li>
              <li>"갑"이 지정하는 기타 업무</li>
            </ul>
          </div>

          {/* 제4조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제4조 (수수료)</div>
            <p className="leading-relaxed">
              "갑"은 "을"이 체결한 계약에 대하여 별도 합의된 수수료율에 따라 
              매월 수수료를 지급한다. 구체적인 수수료율 및 지급 방법은 별도 약정에 따른다.
            </p>
          </div>

          {/* 제5조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제5조 (비밀유지)</div>
            <p className="leading-relaxed">
              "을"은 업무 수행 과정에서 알게 된 "갑"의 영업 비밀 및 고객 정보를 
              제3자에게 누설하거나 본 업무 이외의 목적으로 사용하여서는 아니 된다. 
              이는 계약 종료 후에도 유효하다.
            </p>
          </div>

          {/* 제6조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제6조 (계약의 해지)</div>
            <p className="leading-relaxed mb-2">
              다음 각 호의 경우 상대방에 대한 서면 통지로 본 계약을 해지할 수 있다:
            </p>
            <ul className="list-decimal list-inside space-y-2 ml-4">
              <li>상대방이 본 계약상의 의무를 중대하게 위반한 경우</li>
              <li>상대방의 파산, 회생절차 개시 등의 사유가 발생한 경우</li>
              <li>1개월 전 서면 통지로 계약 해지 의사를 표시한 경우</li>
            </ul>
          </div>

          {/* 제7조 */}
          <div className="article">
            <div className="article-title font-bold text-lg mb-3">제7조 (분쟁해결)</div>
            <p className="leading-relaxed">
              본 계약과 관련하여 발생하는 분쟁은 상호 협의하여 해결함을 원칙으로 하며, 
              협의가 이루어지지 않을 경우 서울중앙지방법원을 전속 관할법원으로 한다.
            </p>
          </div>

          {/* 당사자 정보 */}
          <div className="mt-10 mb-8">
            <p className="font-bold text-lg mb-4">본 계약의 성립을 증명하기 위하여 계약서 2통을 작성하고 "갑", "을"이 각각 서명 날인 후 1통씩 보관한다.</p>
            
            <div className="text-center my-8">
              <p className="text-xl font-bold">{formatDate(contractDate)}</p>
            </div>

            <table className="w-full border-collapse border border-gray-300 my-8">
              <tbody>
                <tr>
                  <td className="p-4 bg-gray-50 font-bold border border-gray-300">갑 (회사)</td>
                  <td className="p-4 border border-gray-300">
                    <div className="space-y-2">
                      <p><strong>상호:</strong> 주식회사 찬스컴퍼니</p>
                      <p><strong>대표자:</strong> 김우연</p>
                      <p><strong>주소:</strong> 서울특별시 강남구 테헤란로 123</p>
                      <p><strong>사업자등록번호:</strong> 123-45-67890</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 bg-gray-50 font-bold border border-gray-300">을 (수탁자)</td>
                  <td className="p-4 border border-gray-300">
                    <div className="space-y-2">
                      <p><strong>성명:</strong> {user?.name || '_______________'}</p>
                      <p><strong>주민등록번호:</strong> {user?.social_security_number || '_______________'}</p>
                      <p><strong>주소:</strong> {user?.address || '_______________'}</p>
                      <p><strong>연락처:</strong> {user?.phone || '_______________'}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 서명란 */}
          <div className="signature-section grid grid-cols-2 gap-8 mt-16 pt-8 border-t-2 border-gray-300">
            <div className="signature-box text-center">
              <p className="font-bold mb-2">갑 (회사)</p>
              <p className="mb-4">주식회사 찬스컴퍼니</p>
              <p>대표이사: 김우연</p>
              <div className="signature-line mt-8"></div>
              <p className="text-sm text-gray-600">(서명 또는 인)</p>
            </div>
            <div className="signature-box text-center">
              <p className="font-bold mb-2">을 (수탁자)</p>
              <p className="mb-4">{user?.name || '_______________'}</p>
              <p>&nbsp;</p>
              <div className="signature-line mt-8"></div>
              <p className="text-sm text-gray-600">(서명 또는 인)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>인쇄 방법:</strong> "인쇄/다운로드" 버튼을 클릭하면 인쇄 화면이 열립니다. 
          인쇄 대화상자에서 "PDF로 저장"을 선택하시면 PDF 파일로 다운로드할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default CommissionContract;
