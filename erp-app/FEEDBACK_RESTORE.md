# 피드백 복구 가이드

## 문제
2026년 1월 21일 에드모아 DB의 피드백이 사라졌습니다.

## 복구 방법

### 방법 1: 브라우저 콘솔 사용 (권장)

1. 관리자 페이지 (전체 DB 관리) 열기
2. F12를 눌러 개발자 도구 열기
3. Console 탭 클릭
4. 아래 코드를 복사해서 붙여넣고 Enter:

```javascript
// 복구할 피드백 데이터
const restoredFeedbacks = [
  {
    author: "이진 기쁨",
    content: "이마저가 최사대표이며 이름과 성함은\n기는짝수 사우역 바꾸지 건축준 민족하면 쓰겠이 연결의사는 연간 방. 시전항 단업과생지만 기정로도 더 비내다고 본엌 기정로는 많 있댄중. 이마저와 성이는 해보겠다고 함. 계리와서는 발치지 않습\n메종 17만 브리말",
    timestamp: "2026-01-20T10:36:02.242Z"
  },
  {
    author: "강남철",
    content: "귀여 피드백이 미팅 후 작성할 피드백입",
    timestamp: "2026-01-20T10:36:02.242Z"
  }
];

// DB ID 찾기 - 에드모아, 2026-01-21
fetch('/api/sales-db')
  .then(res => res.json())
  .then(result => {
    const item = result.data.find(d => 
      d.proposer === '에드모아' && 
      d.proposal_date && 
      d.proposal_date.startsWith('2026-01-21')
    );
    
    if (!item) {
      console.error('❌ 해당 DB를 찾을 수 없습니다.');
      return;
    }
    
    console.log('찾은 DB:', item);
    
    // 복구 API 호출
    return fetch(`/api/restore-feedback/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoredFeedbacks })
    });
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      console.log('✅ 복구 완료!', result);
      alert('피드백 복구 완료! 페이지를 새로고침하세요.');
      location.reload();
    } else {
      console.error('❌ 복구 실패:', result.message);
      alert('복구 실패: ' + result.message);
    }
  })
  .catch(error => {
    console.error('❌ 오류:', error);
    alert('오류 발생: ' + error.message);
  });
```

5. 성공 메시지가 뜨면 페이지 새로고침
6. 해당 DB 클릭해서 피드백 확인

### 방법 2: 서버에서 스크립트 실행

```bash
cd erp-app/server
node restore-feedback.js
```

## 복구될 내용

- **이진 기쁨** (2026-01-20): 미팅 내용 피드백
- **강남철** (2026-01-20): 미팅 후 작성 예정 안내
- **관리자** (2026-01-21): "확인" (기존에 새로 작성한 내용, 유지됨)

총 3개의 피드백이 복구됩니다.
