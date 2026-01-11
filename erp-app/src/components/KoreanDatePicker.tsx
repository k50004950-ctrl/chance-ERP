import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

// 한국어 로케일 등록
registerLocale('ko', ko);

interface KoreanDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholderText?: string;
  dateFormat?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const KoreanDatePicker: React.FC<KoreanDatePickerProps> = ({
  selected,
  onChange,
  className = '',
  placeholderText = '날짜 선택',
  dateFormat = 'yyyy년 MM월 dd일',
  disabled = false,
  minDate,
  maxDate,
}) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      locale="ko"
      dateFormat={dateFormat}
      placeholderText={placeholderText}
      className={`w-full ${className}`}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      todayButton="오늘"
    />
  );
};

export default KoreanDatePicker;
