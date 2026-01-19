const Database = require('better-sqlite3');
const db = new Database('./erp.db');

console.log('=== 매출거래처의 수수료율 확인 ===\n');

const clients = db.prepare('SELECT client_name, commission_rate FROM sales_clients ORDER BY commission_rate DESC').all();

clients.forEach(client => {
  const rate = client.commission_rate || 0;
  const status = rate >= 100 ? '❌ 잘못됨' : '✅ 정상';
  console.log(`${status} ${client.client_name}: ${rate}%`);
});

console.log(`\n총 ${clients.length}개 거래처`);
console.log(`잘못된 거래처: ${clients.filter(c => (c.commission_rate || 0) >= 100).length}개`);

db.close();
