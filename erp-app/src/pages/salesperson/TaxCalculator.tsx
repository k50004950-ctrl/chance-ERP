import React, { useState } from 'react';
import { Calculator } from 'lucide-react';

interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
  label: string;
}

const taxBrackets: TaxBracket[] = [
  { min: 0, max: 14000000, rate: 6, deduction: 0, label: '1,400만원 이하' },
  { min: 14000000, max: 50000000, rate: 15, deduction: 1260000, label: '1,400만원 초과 ~ 5,000만원 이하' },
  { min: 50000000, max: 88000000, rate: 24, deduction: 5760000, label: '5,000만원 초과 ~ 8,800만원 이하' },
  { min: 88000000, max: 150000000, rate: 35, deduction: 15440000, label: '8,800만원 초과 ~ 1억 5천만원 이하' },
  { min: 150000000, max: 300000000, rate: 38, deduction: 19940000, label: '1억 5천만원 초과 ~ 3억원 이하' },
  { min: 300000000, max: 500000000, rate: 40, deduction: 25940000, label: '3억원 초과 ~ 5억원 이하' },
  { min: 500000000, max: 1000000000, rate: 42, deduction: 35940000, label: '5억원 초과 ~ 10억원 이하' },
  { min: 1000000000, max: null, rate: 45, deduction: 65940000, label: '10억원 초과' },
];

const TaxCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
  const [applicableBracket, setApplicableBracket] = useState<TaxBracket | null>(null);
  const [netIncome, setNetIncome] = useState<number | null>(null);
  
  // 건강보험료 계산
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [healthInsurance, setHealthInsurance] = useState<number | null>(null);
  const [longTermCare, setLongTermCare] = useState<number | null>(null);
  const [totalInsurance, setTotalInsurance] = useState<number | null>(null);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  const calculateTax = () => {
    const incomeAmount = parseFloat(income.replace(/,/g, ''));
    
    if (isNaN(incomeAmount) || incomeAmount < 0) {
      alert('올바른 소득액을 입력해주세요.');
      return;
    }

    // 적용 가능한 세율 구간 찾기
    const bracket = taxBrackets.find(b => {
      if (b.max === null) {
        return incomeAmount > b.min;
      }
      return incomeAmount > b.min && incomeAmount <= b.max;
    });

    if (bracket) {
      // 종합소득세 계산: (소득액 × 세율) - 누진공제
      const tax = Math.floor((incomeAmount * bracket.rate / 100) - bracket.deduction);
      const net = incomeAmount - tax;

      setCalculatedTax(tax);
      setApplicableBracket(bracket);
      setNetIncome(net);
    }
  };

  const handleIncomeChange = (value: string) => {
    // 숫자만 입력 가능하도록
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // 천 단위 콤마 추가
    if (numericValue) {
      const formatted = parseInt(numericValue).toLocaleString('ko-KR');
      setIncome(formatted);
    } else {
      setIncome('');
    }
  };

  const resetCalculator = () => {
    setIncome('');
    setCalculatedTax(null);
    setApplicableBracket(null);
    setNetIncome(null);
  };

  const calculateHealthInsurance = () => {
    const monthlyIncomeAmount = parseFloat(monthlyIncome.replace(/,/g, ''));
    
    if (isNaN(monthlyIncomeAmount) || monthlyIncomeAmount < 0) {
      alert('올바른 월소득을 입력해주세요.');
      return;
    }

    // 건강보험료율: 7.09% (2024년 기준)
    const healthInsuranceRate = 7.09;
    // 장기요양보험료율: 건강보험료의 12.81% (2024년 기준)
    const longTermCareRate = 12.81;

    // 건강보험료 계산
    const health = Math.floor(monthlyIncomeAmount * (healthInsuranceRate / 100));
    // 장기요양보험료 계산
    const longTerm = Math.floor(health * (longTermCareRate / 100));
    // 총 보험료
    const total = health + longTerm;

    setHealthInsurance(health);
    setLongTermCare(longTerm);
    setTotalInsurance(total);
  };

  const handleMonthlyIncomeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue) {
      const formatted = parseInt(numericValue).toLocaleString('ko-KR');
      setMonthlyIncome(formatted);
    } else {
      setMonthlyIncome('');
    }
  };

  const resetHealthInsurance = () => {
    setMonthlyIncome('');
    setHealthInsurance(null);
    setLongTermCare(null);
    setTotalInsurance(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">종합소득세 & 건강보험료 계산기</h1>
        </div>
        <p className="text-gray-600">종합소득세와 사업주 건강보험료를 간편하게 계산해보세요.</p>
      </div>

      {/* 세율표 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">종합소득세율표 (2024년 기준)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과세표준
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  세율
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  누진공제
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxBrackets.map((bracket, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{bracket.label}</td>
                  <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">
                    {bracket.rate}%
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {formatNumber(bracket.deduction)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계산기 입력 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">세액 계산하기</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종합소득금액 (원)
            </label>
            <input
              type="text"
              value={income}
              onChange={(e) => handleIncomeChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  calculateTax();
                }
              }}
              placeholder="예: 50,000,000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <p className="mt-1 text-xs text-gray-500">숫자만 입력하세요. 자동으로 천 단위 콤마가 추가됩니다.</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={calculateTax}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              계산하기
            </button>
            <button
              onClick={resetCalculator}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 계산 결과 */}
      {calculatedTax !== null && applicableBracket && netIncome !== null && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계산 결과</h2>
          
          <div className="space-y-4">
            {/* 소득금액 */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">종합소득금액</span>
                <span className="text-lg font-semibold text-gray-900">
                  {income}원
                </span>
              </div>
            </div>

            {/* 적용 세율 */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">적용 세율 구간</span>
                <span className="text-sm font-medium text-blue-600">
                  {applicableBracket.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">세율</span>
                <span className="text-lg font-bold text-blue-600">
                  {applicableBracket.rate}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">누진공제</span>
                <span className="text-sm text-gray-900">
                  {formatNumber(applicableBracket.deduction)}원
                </span>
              </div>
            </div>

            {/* 계산된 세액 */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">종합소득세</span>
                <span className="text-2xl font-bold text-red-600">
                  {formatNumber(calculatedTax)}원
                </span>
              </div>
            </div>

            {/* 세후 소득 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">세후 소득</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(netIncome)}원
                </span>
              </div>
            </div>

            {/* 계산 공식 안내 */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">계산 공식:</p>
              <p className="text-sm font-mono text-gray-900">
                세액 = (소득금액 × {applicableBracket.rate}%) - {formatNumber(applicableBracket.deduction)}원
              </p>
              <p className="text-sm font-mono text-gray-900 mt-1">
                = ({income} × {applicableBracket.rate}%) - {formatNumber(applicableBracket.deduction)}
              </p>
              <p className="text-sm font-mono text-blue-600 mt-1">
                = {formatNumber(calculatedTax)}원
              </p>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ 본 계산기는 기본세율만 적용한 예상 세액이며, 실제 납부세액은 각종 공제, 감면, 지방소득세(10%) 등이 추가로 적용됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 구분선 */}
      <div className="my-8 border-t-2 border-gray-300"></div>

      {/* 건강보험료 계산기 */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Calculator className="w-7 h-7 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">사업주 건강보험료 계산기</h2>
        </div>
        <p className="text-gray-600">월 소득을 입력하시면 예상 건강보험료를 계산해드립니다.</p>
      </div>

      {/* 보험료율 안내 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">건강보험료율 (2024년 기준)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">건강보험료율</span>
              <span className="text-xl font-bold text-green-600">7.09%</span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">장기요양보험료율</span>
              <span className="text-xl font-bold text-blue-600">12.81%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">건강보험료의 12.81%</p>
          </div>
        </div>
      </div>

      {/* 건강보험료 계산 입력 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">보험료 계산하기</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월 소득금액 (원)
            </label>
            <input
              type="text"
              value={monthlyIncome}
              onChange={(e) => handleMonthlyIncomeChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  calculateHealthInsurance();
                }
              }}
              placeholder="예: 5,000,000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
            <p className="mt-1 text-xs text-gray-500">숫자만 입력하세요. 자동으로 천 단위 콤마가 추가됩니다.</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={calculateHealthInsurance}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              계산하기
            </button>
            <button
              onClick={resetHealthInsurance}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 건강보험료 계산 결과 */}
      {healthInsurance !== null && longTermCare !== null && totalInsurance !== null && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">보험료 계산 결과</h3>
          
          <div className="space-y-4">
            {/* 월 소득 */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">월 소득금액</span>
                <span className="text-lg font-semibold text-gray-900">
                  {monthlyIncome}원
                </span>
              </div>
            </div>

            {/* 건강보험료 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">건강보험료 (7.09%)</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(healthInsurance)}원
                </span>
              </div>
              <p className="text-xs text-gray-600">
                계산: {monthlyIncome} × 7.09% = {formatNumber(healthInsurance)}원
              </p>
            </div>

            {/* 장기요양보험료 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">장기요양보험료 (12.81%)</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatNumber(longTermCare)}원
                </span>
              </div>
              <p className="text-xs text-gray-600">
                계산: {formatNumber(healthInsurance)}원 × 12.81% = {formatNumber(longTermCare)}원
              </p>
            </div>

            {/* 총 보험료 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-purple-700">월 총 보험료</span>
                <span className="text-3xl font-bold text-purple-600">
                  {formatNumber(totalInsurance)}원
                </span>
              </div>
            </div>

            {/* 계산 공식 안내 */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-xs text-gray-600 mb-2">계산 공식:</p>
              <div className="space-y-1 text-sm font-mono text-gray-900">
                <p>① 건강보험료 = 월소득 × 7.09%</p>
                <p className="ml-4">= {monthlyIncome} × 7.09% = {formatNumber(healthInsurance)}원</p>
                <p className="mt-2">② 장기요양보험료 = 건강보험료 × 12.81%</p>
                <p className="ml-4">= {formatNumber(healthInsurance)} × 12.81% = {formatNumber(longTermCare)}원</p>
                <p className="mt-2 text-purple-600 font-bold">③ 총 보험료 = {formatNumber(healthInsurance)} + {formatNumber(longTermCare)} = {formatNumber(totalInsurance)}원</p>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ 본 계산기는 지역가입자(사업주) 기준이며, 실제 보험료는 소득 외 재산, 자동차 등이 추가 산정됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
