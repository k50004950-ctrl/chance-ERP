const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'erp.db');
const db = new Database(dbPath);

console.log('=== 2026년 1월 계약 완료 데이터 확인 ===\n');

const data = db.prepare(`
  SELECT 
    id, 
    company_name, 
    contract_client, 
    actual_sales, 
    contract_status,
    contract_date,
    salesperson_id
  FROM sales_db 
  WHERE contract_status = 'Y' 
    AND contract_date LIKE '2026-01%' 
  LIMIT 20
`).all();

console.log(`총 ${data.length}건 발견\n`);

data.forEach((row, index) => {
  console.log(`${index + 1}. ${row.company_name}`);
  console.log(`   - ID: ${row.id}`);
  console.log(`   - contract_client: ${row.contract_client}`);
  console.log(`   - actual_sales: ${row.actual_sales}`);
  console.log(`   - contract_date: ${row.contract_date}`);
  console.log(`   - salesperson_id: ${row.salesperson_id}`);
  console.log('');
});

// 총합 계산
const totalContractClient = data.reduce((sum, row) => sum + (Number(row.contract_client) || 0), 0);
const totalActualSales = data.reduce((sum, row) => sum + (Number(row.actual_sales) || 0), 0);

console.log('=== 합계 ===');
console.log(`contract_client 합계: ${totalContractClient.toLocaleString()}원`);
console.log(`actual_sales 합계: ${totalActualSales.toLocaleString()}원`);

// 전체 데이터 개수 확인
const totalCount = db.prepare(`
  SELECT COUNT(*) as count
  FROM sales_db 
  WHERE contract_status = 'Y' 
    AND contract_date LIKE '2026-01%'
`).get();

console.log(`\n전체 계약 완료 건수 (2026년 1월): ${totalCount.count}건`);

db.close();
