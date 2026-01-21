const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'erp.db'));

// 섭외자가 "에드모아"인 1월 21일 DB 찾기
const item = db.prepare(`
  SELECT * FROM sales_db 
  WHERE proposer = '에드모아' 
  AND proposal_date LIKE '2026-01-21%'
  ORDER BY id DESC
  LIMIT 1
`).get();

if (!item) {
  console.log('해당 DB를 찾을 수 없습니다.');
  process.exit(1);
}

console.log('찾은 DB:', {
  id: item.id,
  company_name: item.company_name,
  proposer: item.proposer,
  proposal_date: item.proposal_date,
  current_feedback: item.feedback
});

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

// 현재 피드백 파싱
let currentFeedbacks = [];
if (item.feedback) {
  try {
    const parsed = JSON.parse(item.feedback);
    if (Array.isArray(parsed)) {
      currentFeedbacks = parsed;
    }
  } catch (e) {
    console.log('현재 피드백 파싱 실패:', e.message);
  }
}

console.log('\n현재 저장된 피드백:', currentFeedbacks);

// 기존 피드백과 새 피드백 합치기 (중복 제거)
const allFeedbacks = [...restoredFeedbacks, ...currentFeedbacks];

console.log('\n복구될 전체 피드백:', allFeedbacks);

// 데이터베이스 업데이트
const stmt = db.prepare(`
  UPDATE sales_db 
  SET feedback = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

try {
  stmt.run(JSON.stringify(allFeedbacks), item.id);
  console.log('\n✅ 피드백 복구 완료!');
  console.log('총', allFeedbacks.length, '개의 피드백이 저장되었습니다.');
} catch (error) {
  console.error('❌ 복구 실패:', error.message);
  process.exit(1);
}

db.close();
