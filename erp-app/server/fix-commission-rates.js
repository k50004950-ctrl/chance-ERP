const Database = require('better-sqlite3');
const db = new Database('./erp.db');

console.log('=== 수수료율 수정 중 ===\n');

// 100 이상인 수수료율을 10으로 나누기 (500 → 50, 700 → 70)
const stmt = db.prepare('UPDATE sales_clients SET commission_rate = commission_rate / 10 WHERE commission_rate >= 100');
const result = stmt.run();

console.log(`✅ ${result.changes}개 거래처의 수수료율을 수정했습니다.\n`);

console.log('=== 수정 후 수수료율 ===\n');
const clients = db.prepare('SELECT client_name, commission_rate FROM sales_clients ORDER BY commission_rate DESC').all();

clients.forEach(client => {
  console.log(`${client.client_name}: ${client.commission_rate}%`);
});

db.close();
