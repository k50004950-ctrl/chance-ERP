// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB default
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/server' : __dirname;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads/');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 대량 JSON 데이터 지원
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../dist')));

// Multer configuration for file uploads (대량 업로드 지원)
const upload = multer({ 
  dest: UPLOAD_DIR,
  limits: { 
    fileSize: MAX_FILE_SIZE, // 100MB
    fieldSize: 50 * 1024 * 1024 // 50MB for form fields
  }
});

// Database initialization
let db;

function initDatabase() {
  // Use /data directory for Railway Volume (persistent storage)
  // Falls back to __dirname for local development
  const dataDir = process.env.DATA_DIR || '/data';
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory: ${dataDir}`);
    } catch (err) {
      console.warn(`Could not create ${dataDir}, falling back to __dirname`);
      // Fallback to current directory if /data is not writable
      const fallbackDir = __dirname;
      const fallbackPath = path.join(fallbackDir, 'erp.db');
      console.log(`Using fallback database path: ${fallbackPath}`);
      db = new Database(fallbackPath);
      return;
    }
  }
  
  const dbPath = path.join(dataDir, 'erp.db');
  console.log(`Database path: ${dbPath}`);
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    -- Users table (관리자 및 직원)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson', 'recruiter', 'happycall')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      employee_code TEXT,
      department TEXT,
      position TEXT,
      commission_rate INTEGER DEFAULT 0,
      bank_name TEXT,
      account_number TEXT,
      social_security_number TEXT,
      hire_date DATE,
      address TEXT,
      emergency_contact TEXT
    );

    -- Products table (제품)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      consumer_price INTEGER DEFAULT 0,
      purchase_price INTEGER DEFAULT 0,
      month TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employees table (직원 정보)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      employee_code TEXT UNIQUE NOT NULL,
      department TEXT,
      position TEXT,
      hire_date DATE,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Attendance table (근태)
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in TIME,
      check_out TIME,
      status TEXT CHECK(status IN ('present', 'absent', 'late', 'early_leave')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Leave table (휴가)
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- 영업자 테이블 (더 이상 사용하지 않음 - users 테이블 사용)
    -- CREATE TABLE IF NOT EXISTS salespersons (
    --   id INTEGER PRIMARY KEY AUTOINCREMENT,
    --   name TEXT NOT NULL,
    --   employee_code TEXT UNIQUE,
    --   phone TEXT,
    --   email TEXT,
    --   commission_rate REAL DEFAULT 0.0,
    --   status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    --   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- );

    -- DB 관리 테이블 (고객/영업 DB)
    CREATE TABLE IF NOT EXISTS sales_db (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_date DATE,
      proposer TEXT,
      salesperson_id INTEGER,
      meeting_status TEXT,
      company_name TEXT NOT NULL,
      representative TEXT,
      address TEXT,
      contact TEXT,
      industry TEXT,
      sales_amount INTEGER,
      existing_client TEXT,
      contract_status TEXT,
      termination_month TEXT,
      actual_sales INTEGER,
      contract_client TEXT,
      contract_month TEXT,
      client_name TEXT,
      feedback TEXT,
      april_type1_date TEXT,
      commission_rate REAL DEFAULT 500,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    );

    -- 계약 관리 테이블
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_type TEXT NOT NULL CHECK(contract_type IN ('sales', 'recruitment')),
      client_name TEXT NOT NULL,
      client_company TEXT,
      salesperson_id INTEGER,
      contract_amount INTEGER DEFAULT 0,
      commission_rate REAL DEFAULT 0.0,
      commission_amount INTEGER DEFAULT 0,
      contract_date DATE,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    );

    -- 수수료 명세서 테이블
    CREATE TABLE IF NOT EXISTS commission_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salesperson_id INTEGER NOT NULL,
      year TEXT NOT NULL,
      month TEXT NOT NULL,
      details_snapshot TEXT,
      total_commission INTEGER DEFAULT 0,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    );

    -- 기타수수료 테이블 (관리자가 추가하는 기타 수수료)
    CREATE TABLE IF NOT EXISTS misc_commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salesperson_id INTEGER NOT NULL,
      year TEXT NOT NULL,
      month TEXT NOT NULL,
      description TEXT,
      amount INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    );

    -- 일정 관리 테이블 (영업자/관리자)
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      schedule_date DATE NOT NULL,
      schedule_time TIME,
      client_name TEXT,
      location TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 메모 테이블 (영업자/관리자)
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 매출거래처 테이블 (관리자가 관리)
    CREATE TABLE IF NOT EXISTS sales_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT UNIQUE NOT NULL,
      commission_rate REAL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 계정 변경 요청 테이블 (사용자가 본인 계정 수정 요청)
    CREATE TABLE IF NOT EXISTS account_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      requested_changes TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_note TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    -- 공지사항 테이블
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      is_important BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- 공지사항 읽음 여부 테이블
    CREATE TABLE IF NOT EXISTS notice_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notice_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (notice_id) REFERENCES notices(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(notice_id, user_id)
    );

    -- 해피콜 테이블
    CREATE TABLE IF NOT EXISTS happycalls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      happycall_staff_id INTEGER NOT NULL,
      happycall_staff_name TEXT NOT NULL,
      salesperson_id INTEGER,
      salesperson_name TEXT,
      client_name TEXT NOT NULL,
      client_contact TEXT,
      call_date DATE NOT NULL,
      call_content TEXT NOT NULL,
      score TEXT NOT NULL CHECK(score IN ('상', '중', '하')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (happycall_staff_id) REFERENCES users(id),
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
    );
  `);

  // Add new columns to users table if they don't exist (for existing databases)
  const addColumnIfNotExists = (tableName, columnName, columnType) => {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnExists = tableInfo.some(col => col.name === columnName);
      if (!columnExists) {
        db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
        console.log(`Added column ${columnName} to ${tableName}`);
      }
    } catch (error) {
      console.error(`Error adding column ${columnName} to ${tableName}:`, error.message);
    }
  };

  // Add new columns to users table
  addColumnIfNotExists('users', 'employee_code', 'TEXT');
  addColumnIfNotExists('users', 'department', 'TEXT');
  addColumnIfNotExists('users', 'position', 'TEXT');
  addColumnIfNotExists('users', 'commission_rate', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'bank_name', 'TEXT');
  addColumnIfNotExists('users', 'account_number', 'TEXT');
  addColumnIfNotExists('users', 'social_security_number', 'TEXT');
  addColumnIfNotExists('users', 'hire_date', 'DATE');
  addColumnIfNotExists('users', 'address', 'TEXT');
  addColumnIfNotExists('users', 'emergency_contact', 'TEXT');

  // Migrate users table to include 'happycall' role in CHECK constraint
  console.log('Checking if users table migration is needed...');
  try {
    // Check if the constraint includes 'happycall'
    const tableInfo = db.prepare('SELECT sql FROM sqlite_master WHERE type="table" AND name="users"').get();
    
    if (tableInfo && tableInfo.sql) {
      console.log('Current users table schema:', tableInfo.sql.substring(0, 200));
      
      if (!tableInfo.sql.includes("'happycall'")) {
        console.log('⚠️  Migration needed: adding happycall role support...');
        
        // Disable foreign key constraints
        db.exec('PRAGMA foreign_keys = OFF;');
        console.log('✓ Foreign key constraints disabled');
        
        // Start transaction
        db.exec('BEGIN TRANSACTION;');
        console.log('✓ Transaction started');
        
        // Drop users_new if exists (cleanup from previous failed attempts)
        try {
          db.exec(`DROP TABLE IF EXISTS users_new;`);
        } catch (e) {
          // Ignore error if table doesn't exist
        }
        
        // Create temporary table with new constraint
        db.exec(`
          CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson', 'recruiter', 'happycall')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            employee_code TEXT,
            department TEXT,
            position TEXT,
            commission_rate INTEGER DEFAULT 0,
            bank_name TEXT,
            account_number TEXT,
            social_security_number TEXT,
            hire_date DATE,
            address TEXT,
            emergency_contact TEXT
          );
        `);
        console.log('✓ Created new users table with happycall support');
        
        // Copy data from old table to new table
        db.exec(`INSERT INTO users_new SELECT * FROM users;`);
        console.log('✓ Copied existing user data');
        
        // Drop old table
        db.exec(`DROP TABLE users;`);
        console.log('✓ Dropped old users table');
        
        // Rename new table
        db.exec(`ALTER TABLE users_new RENAME TO users;`);
        console.log('✓ Renamed new table to users');
        
        // Commit transaction
        db.exec('COMMIT;');
        console.log('✓ Transaction committed');
        
        // Re-enable foreign key constraints
        db.exec('PRAGMA foreign_keys = ON;');
        console.log('✅ Users table migration completed successfully!');
      } else {
        console.log('✓ Users table already supports happycall role - no migration needed');
      }
    }
  } catch (error) {
    console.error('❌ Error during users table migration:', error.message);
    console.error('Stack:', error.stack);
    // Try to rollback and cleanup
    try {
      db.exec('ROLLBACK;');
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec(`DROP TABLE IF EXISTS users_new;`);
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  }

  // Insert default admin user if not exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    db.prepare(`
      INSERT INTO users (username, password, name, role, employee_code, department, position, commission_rate,
                        bank_name, account_number, social_security_number, hire_date, address, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin',
      '1234',
      '관리자',
      'admin',
      'EMP000',
      '관리팀',
      '대표',
      0,
      '국민은행',
      '123456-78-901234',
      '800101-1234567',
      '2024-01-01',
      '서울특별시 강남구 테헤란로 123',
      '010-1234-5678'
    );
    console.log('Default admin account created (username: admin, password: 1234)');
  } else {
    // Update admin account to ensure it has all required fields (but keep existing password)
    db.prepare(`
      UPDATE users SET 
        bank_name = COALESCE(bank_name, '국민은행'),
        account_number = COALESCE(account_number, '123456-78-901234'),
        social_security_number = COALESCE(social_security_number, '800101-1234567'),
        hire_date = COALESCE(hire_date, '2024-01-01'),
        address = COALESCE(address, '서울특별시 강남구 테헤란로 123'),
        emergency_contact = COALESCE(emergency_contact, '010-1234-5678'),
        employee_code = COALESCE(employee_code, 'EMP000'),
        department = COALESCE(department, '관리팀'),
        position = COALESCE(position, '대표')
      WHERE username = 'admin'
    `).run();
    console.log('Admin account updated with required fields (password kept as is)');
  }

  // Note: Test accounts are no longer auto-created on server start
  // Use POST /api/create-test-accounts endpoint to manually create test accounts if needed
  console.log('Database initialized. Use /api/create-test-accounts to create test accounts if needed.');

  // 기존 sales_db 테이블에 commission_rate 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE sales_db ADD COLUMN commission_rate REAL DEFAULT 500');
    console.log('commission_rate 필드가 sales_db 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 에러 발생, 무시
    if (!e.message.includes('duplicate column')) {
      console.error('commission_rate 필드 추가 중 오류:', e.message);
    }
  }

  // 기존 sales_db 테이블에 contract_date 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE sales_db ADD COLUMN contract_date DATE');
    console.log('contract_date 필드가 sales_db 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 에러 발생, 무시
  }

  // 기존 attendance 테이블에 위치 정보 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_in_location TEXT');
    console.log('check_in_location 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_out_location TEXT');
    console.log('check_out_location 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_in_coordinates TEXT');
    console.log('check_in_coordinates 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_out_coordinates TEXT');
    console.log('check_out_coordinates 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
    if (!e.message.includes('duplicate column')) {
      console.error('contract_date 필드 추가 중 오류:', e.message);
    }
  }

  // commission_statements 테이블에 확정 기능 관련 필드 추가
  try {
    db.exec('ALTER TABLE commission_statements ADD COLUMN year TEXT');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE commission_statements ADD COLUMN month TEXT');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE commission_statements ADD COLUMN details_snapshot TEXT');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE commission_statements ADD COLUMN confirmed_at DATETIME');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  console.log('Database initialized at:', dbPath);
}

initDatabase();

// API Routes

// Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Password reset endpoint (for debugging/maintenance)
app.post('/api/auth/reset-all-passwords', (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple security check - require a secret key
    if (secret !== 'reset123') {
      res.json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    // Reset all passwords to '1234'
    const result = db.prepare('UPDATE users SET password = ?').run('1234');
    console.log(`Password reset completed. ${result.changes} users updated.`);
    
    res.json({ 
      success: true, 
      message: `모든 비밀번호가 '1234'로 초기화되었습니다.`,
      usersUpdated: result.changes 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Create test accounts endpoint (for debugging/maintenance)
app.post('/api/auth/create-test-accounts', (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple security check - require a secret key
    if (secret !== 'reset123') {
      res.json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    const testAccounts = [
      { username: 'test_sales', password: '1234', name: '영업사원1', role: 'salesperson', employee_code: 'EMP001', department: '영업팀', position: '대리', commission_rate: 30 },
      { username: 'test_sales2', password: '1234', name: '영업사원2', role: 'salesperson', employee_code: 'EMP002', department: '영업팀', position: '사원', commission_rate: 25 },
      { username: 'test_recruiter', password: '1234', name: '채용담당자1', role: 'recruiter', employee_code: 'EMP003', department: '인사팀', position: '과장', commission_rate: 20 },
      { username: 'test_employee', password: '1234', name: '일반직원1', role: 'employee', employee_code: 'EMP004', department: '관리팀', position: '주임', commission_rate: 0 }
    ];

    let created = 0;
    let skipped = 0;
    
    testAccounts.forEach(account => {
      const exists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get(account.username);
      if (exists.count === 0) {
        db.prepare(`
          INSERT INTO users (username, password, name, role, employee_code, department, position, commission_rate,
                            bank_name, account_number, social_security_number, hire_date, address, emergency_contact)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          account.username,
          account.password,
          account.name,
          account.role,
          account.employee_code,
          account.department,
          account.position,
          account.commission_rate,
          '국민은행',
          '123456-78-901234',
          '900101-1234567',
          '2024-01-01',
          '서울특별시 강남구 테헤란로 123',
          '010-1234-5678'
        );
        created++;
      } else {
        skipped++;
      }
    });
    
    res.json({ 
      success: true, 
      message: `테스트 계정 생성 완료`,
      created,
      skipped
    });
  } catch (error) {
    console.error('Test accounts creation error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Get all usernames (for debugging)
app.get('/api/auth/debug-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role FROM users').all();
    res.json({ success: true, users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Migrate users table to support happycall role (for manual execution)
app.post('/api/auth/migrate-happycall', (req, res) => {
  try {
    const { secret } = req.body;
    
    // Simple security check - require a secret key
    if (secret !== 'migrate123') {
      res.json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    console.log('Starting manual migration for happycall role support...');
    
    // Create temporary table with new constraint
    db.exec(`
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson', 'recruiter', 'happycall')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        employee_code TEXT,
        department TEXT,
        position TEXT,
        commission_rate INTEGER DEFAULT 0,
        bank_name TEXT,
        account_number TEXT,
        social_security_number TEXT,
        hire_date DATE,
        address TEXT,
        emergency_contact TEXT
      );
    `);
    
    // Copy data from old table to new table
    db.exec(`
      INSERT INTO users_new SELECT * FROM users;
    `);
    
    // Drop old table
    db.exec(`DROP TABLE users;`);
    
    // Rename new table
    db.exec(`ALTER TABLE users_new RENAME TO users;`);
    
    console.log('Manual migration completed successfully!');
    
    res.json({ 
      success: true, 
      message: 'Users 테이블이 성공적으로 마이그레이션되었습니다. 이제 해피콜직원 계정을 추가할 수 있습니다.'
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Users API
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, name, role, created_at,
             employee_code, department, position, commission_rate,
             bank_name, account_number, social_security_number,
             hire_date, address, emergency_contact
      FROM users 
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, data: users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 특정 사용자 조회
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT id, username, name, role, created_at,
             employee_code, department, position, commission_rate,
             bank_name, account_number, social_security_number,
             hire_date, address, emergency_contact
      FROM users 
      WHERE id = ?
    `).get(id);
    
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Users API (계속)
app.post('/api/users', (req, res) => {
  try {
    const { 
      username, password, name, role, 
      department, position, commission_rate,
      bank_name, account_number, social_security_number,
      hire_date, address, emergency_contact
    } = req.body;
    
    // 사원번호 자동 생성 (최대 ID + 1로 생성)
    const maxIdResult = db.prepare('SELECT COALESCE(MAX(id), 0) as maxId FROM users').get();
    const nextId = maxIdResult.maxId + 1;
    const auto_employee_code = `EMP${String(nextId).padStart(3, '0')}`;
    
    // 사용자 계정 생성 (모든 필드 포함)
    const userStmt = db.prepare(`
      INSERT INTO users (
        username, password, name, role, employee_code,
        department, position, commission_rate,
        bank_name, account_number, social_security_number,
        hire_date, address, emergency_contact
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const userInfo = userStmt.run(
      username, password, name, role, auto_employee_code,
      department || '', position || '', commission_rate || 0,
      bank_name || '', account_number || '', social_security_number || '',
      hire_date || null, address || '', emergency_contact || ''
    );
    
    // 직원 정보도 함께 생성 (employees 테이블과의 호환성 유지)
    const employeeStmt = db.prepare(`
      INSERT INTO employees (user_id, employee_code, department, position, hire_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    employeeStmt.run(
      userInfo.lastInsertRowid,
      auto_employee_code, 
      department || '부서 미정', 
      position || '직급 미정',
      hire_date || null
    );
    
    res.json({ success: true, id: userInfo.lastInsertRowid, employee_code: auto_employee_code });
  } catch (error) {
    // 중복 사용자명 에러 처리
    if (error.message && error.message.includes('UNIQUE constraint failed: users.username')) {
      res.json({ success: false, message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.' });
    } else {
      res.json({ success: false, message: error.message });
    }
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 업데이트할 필드만 동적으로 구성
    const updateFields = [];
    const updateValues = [];
    
    // 각 필드를 체크하여 제공된 경우에만 업데이트 목록에 추가
    if (updateData.username !== undefined) {
      updateFields.push('username = ?');
      updateValues.push(updateData.username);
    }
    if (updateData.password !== undefined) {
      updateFields.push('password = ?');
      updateValues.push(updateData.password);
    }
    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }
    if (updateData.role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(updateData.role);
    }
    if (updateData.department !== undefined) {
      updateFields.push('department = ?');
      updateValues.push(updateData.department || '');
    }
    if (updateData.position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(updateData.position || '');
    }
    if (updateData.commission_rate !== undefined) {
      updateFields.push('commission_rate = ?');
      updateValues.push(updateData.commission_rate || 0);
    }
    if (updateData.bank_name !== undefined) {
      updateFields.push('bank_name = ?');
      updateValues.push(updateData.bank_name || '');
    }
    if (updateData.account_number !== undefined) {
      updateFields.push('account_number = ?');
      updateValues.push(updateData.account_number || '');
    }
    if (updateData.social_security_number !== undefined) {
      updateFields.push('social_security_number = ?');
      updateValues.push(updateData.social_security_number || '');
    }
    if (updateData.hire_date !== undefined) {
      updateFields.push('hire_date = ?');
      updateValues.push(updateData.hire_date || null);
    }
    if (updateData.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(updateData.address || '');
    }
    if (updateData.emergency_contact !== undefined) {
      updateFields.push('emergency_contact = ?');
      updateValues.push(updateData.emergency_contact || '');
    }
    
    if (updateFields.length === 0) {
      return res.json({ success: false, message: '업데이트할 필드가 없습니다.' });
    }
    
    // WHERE 절을 위해 id 추가
    updateValues.push(id);
    
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...updateValues);
    
    res.json({ success: true });
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 트랜잭션 시작 - 모든 작업이 성공하거나 모두 롤백
    const deleteUser = db.transaction(() => {
      // 1. 해당 사용자의 employee 레코드 찾기
      const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(id);
      
      if (employee) {
        // 근태 기록 삭제
        db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(employee.id);
        
        // 휴가 기록 삭제
        db.prepare('DELETE FROM leaves WHERE employee_id = ?').run(employee.id);
        
        // employee 레코드 삭제
        db.prepare('DELETE FROM employees WHERE id = ?').run(employee.id);
      }
      
      // 영업자 관련 데이터 삭제 (CASCADE로 자동 삭제됨)
      // db.prepare('DELETE FROM salespersons WHERE salesperson_id = ?').run(id);
      // db.prepare('DELETE FROM sales_db WHERE salesperson_id = ?').run(id);
      // db.prepare('DELETE FROM sales_contracts WHERE salesperson_id = ?').run(id);
      // db.prepare('DELETE FROM commission_statements WHERE salesperson_id = ?').run(id);
      db.prepare('DELETE FROM misc_commissions WHERE salesperson_id = ?').run(id);
      
      // 일정 및 메모 삭제
      db.prepare('DELETE FROM schedules WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM memos WHERE user_id = ?').run(id);
      
      // 계정 변경 요청 삭제
      db.prepare('DELETE FROM account_change_requests WHERE user_id = ? OR reviewed_by = ?').run(id, id);
      
      // 공지사항 읽음 기록 삭제
      db.prepare('DELETE FROM notice_reads WHERE user_id = ?').run(id);
      
      // 작성한 공지사항의 author_id를 NULL로 설정
      db.prepare('UPDATE notices SET author_id = NULL WHERE author_id = ?').run(id);
      
      // 마지막으로 사용자 삭제
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });
    
    deleteUser();
    res.json({ success: true, message: '계정이 삭제되었습니다.' });
  } catch (error) {
    console.error('계정 삭제 오류:', error);
    res.json({ success: false, message: '계정 삭제 중 오류가 발생했습니다: ' + error.message });
  }
});

// Products
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json({ success: true, data: products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    const stmt = db.prepare(`
      INSERT INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      product.barcode,
      product.product_name,
      product.quantity,
      product.consumer_price,
      product.purchase_price,
      product.month
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    const stmt = db.prepare(`
      UPDATE products 
      SET barcode = ?, product_name = ?, quantity = ?, consumer_price = ?, purchase_price = ?, month = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      product.barcode,
      product.product_name,
      product.quantity,
      product.consumer_price,
      product.purchase_price,
      product.month,
      id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products/import', (req, res) => {
  try {
    const products = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((products) => {
      for (const product of products) {
        stmt.run(
          product.barcode,
          product.product_name,
          product.quantity,
          product.consumer_price,
          product.purchase_price,
          product.month
        );
      }
    });

    insertMany(products);
    res.json({ success: true, count: products.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products/import-csv', (req, res) => {
  try {
    // Look for products_import.csv in the parent directory
    const csvPath = path.join(__dirname, '../../products_import.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.json({ success: false, message: 'CSV 파일을 찾을 수 없습니다.' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const insertMany = db.transaction(() => {
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse CSV line (handle commas in quotes)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        if (values.length >= 6) {
          const [month, barcode, product_name, quantity, consumer_price, purchase_price] = values;
          stmt.run(
            barcode,
            product_name,
            parseInt(quantity) || 0,
            parseInt(consumer_price) || 0,
            parseInt(purchase_price) || 0,
            month
          );
          count++;
        }
      }
    });

    insertMany();
    res.json({ success: true, count });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Attendance
app.get('/api/attendance', (req, res) => {
  try {
    const attendance = db.prepare(`
      SELECT a.*, e.employee_code, u.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY a.date DESC, a.created_at DESC
    `).all();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 출근 기록 (위치 정보 포함)
app.post('/api/attendance/clock-in', (req, res) => {
  try {
    let { employee_id, date, check_in, check_in_location, check_in_coordinates } = req.body;
    
    // employee_id가 실제로 user_id인 경우 employees 테이블에서 employee_id를 찾음
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(employee_id);
    if (employee) {
      employee_id = employee.id;
    }
    
    // 기존 기록이 있는지 확인
    const existing = db.prepare('SELECT id FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employee_id, date);
    
    if (existing) {
      // 업데이트
      db.prepare(`
        UPDATE attendance 
        SET check_in = ?, check_in_location = ?, check_in_coordinates = ?, status = 'present'
        WHERE id = ?
      `).run(check_in, check_in_location, check_in_coordinates, existing.id);
      
      res.json({ success: true, id: existing.id, updated: true });
    } else {
      // 삽입
      const result = db.prepare(`
        INSERT INTO attendance (employee_id, date, check_in, check_in_location, check_in_coordinates, status)
        VALUES (?, ?, ?, ?, ?, 'present')
      `).run(employee_id, date, check_in, check_in_location, check_in_coordinates);
      
      res.json({ success: true, id: result.lastInsertRowid, updated: false });
    }
  } catch (error) {
    console.error('출근 기록 저장 실패:', error);
    res.json({ success: false, message: error.message });
  }
});

// 퇴근 기록 (위치 정보 포함)
app.post('/api/attendance/clock-out', (req, res) => {
  try {
    let { employee_id, date, check_out, check_out_location, check_out_coordinates } = req.body;
    
    // employee_id가 실제로 user_id인 경우 employees 테이블에서 employee_id를 찾음
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(employee_id);
    if (employee) {
      employee_id = employee.id;
    }
    
    // 기존 출근 기록 업데이트
    const result = db.prepare(`
      UPDATE attendance 
      SET check_out = ?, check_out_location = ?, check_out_coordinates = ?
      WHERE employee_id = ? AND date = ?
    `).run(check_out, check_out_location, check_out_coordinates, employee_id, date);
    
    if (result.changes > 0) {
      res.json({ success: true, updated: true });
    } else {
      // 출근 기록이 없으면 새로 생성
      const insertResult = db.prepare(`
        INSERT INTO attendance (employee_id, date, check_out, check_out_location, check_out_coordinates, status)
        VALUES (?, ?, ?, ?, ?, 'present')
      `).run(employee_id, date, check_out, check_out_location, check_out_coordinates);
      
      res.json({ success: true, id: insertResult.lastInsertRowid, updated: false });
    }
  } catch (error) {
    console.error('퇴근 기록 저장 실패:', error);
    res.json({ success: false, message: error.message });
  }
});

// Leaves
// 승인된 휴가만 조회 (캘린더용)
app.get('/api/leaves', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.employee_code, e.user_id, u.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE l.status = 'approved'
      ORDER BY l.created_at DESC
    `).all();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 모든 휴가 조회 (관리 페이지용)
app.get('/api/leaves/all', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.employee_code, e.user_id, u.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY l.created_at DESC
    `).all();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 휴가 상태 업데이트
app.put('/api/leaves/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    db.prepare(`
      UPDATE leaves 
      SET status = ?
      WHERE id = ?
    `).run(status, id);
    
    res.json({ success: true, message: '휴가 상태가 업데이트되었습니다.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== DB 관리 API ==========
app.get('/api/sales-db', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT sd.*, u.name as salesperson_name 
      FROM sales_db sd
      LEFT JOIN users u ON sd.salesperson_id = u.id
      ORDER BY sd.proposal_date DESC, sd.created_at DESC
    `;
    
    let salesDB;
    if (search) {
      query = `
        SELECT sd.*, u.name as salesperson_name 
        FROM sales_db sd
        LEFT JOIN users u ON sd.salesperson_id = u.id
        WHERE sd.company_name LIKE ? OR sd.representative LIKE ? OR sd.contact LIKE ? OR sd.client_name LIKE ?
        ORDER BY sd.proposal_date DESC, sd.created_at DESC
      `;
      const searchParam = `%${search}%`;
      salesDB = db.prepare(query).all(searchParam, searchParam, searchParam, searchParam);
    } else {
      salesDB = db.prepare(query).all();
    }
    
    res.json({ success: true, data: salesDB });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 모든 sales_db 데이터 조회 (DB등록 페이지용)
app.get('/api/sales-db/all', (req, res) => {
  try {
    const allData = db.prepare(`
      SELECT * FROM sales_db 
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, data: allData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/sales-db', (req, res) => {
  try {
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO sales_db (
        proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
        address, contact, industry, sales_amount, existing_client, contract_status,
        termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/sales-db/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    // commission_rate만 업데이트하는 경우 (수수료 명세서에서 호출)
    if (Object.keys(body).length === 1 && body.commission_rate !== undefined) {
      const stmt = db.prepare(`
        UPDATE sales_db 
        SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(body.commission_rate, id);
      res.json({ success: true });
      return;
    }
    
    // 전체 업데이트 (DB등록에서 호출)
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date, commission_rate
    } = body;
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET proposal_date = ?, proposer = ?, salesperson_id = ?, meeting_status = ?, 
          company_name = ?, representative = ?, address = ?, contact = ?, industry = ?,
          sales_amount = ?, existing_client = ?, contract_status = ?, termination_month = ?,
          actual_sales = ?, contract_date = ?, contract_client = ?, contract_month = ?, client_name = ?,
          feedback = ?, april_type1_date = ?, commission_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date, commission_rate || 500, id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/sales-db/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM sales_db WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// CSV 업로드
app.post('/api/sales-db/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '파일이 없습니다.' });
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const stmt = db.prepare(`
        INSERT INTO sales_db (
          proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
          address, contact, industry, sales_amount, existing_client, contract_status,
          termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let successCount = 0;
      results.forEach((row, index) => {
        try {
          stmt.run(
            row.proposal_date || row['설의날짜'] || null,
            row.proposer || row['설의자'] || null,
            row.salesperson_id || row['영업자'] || null,
            row.meeting_status || row['미팅여부'] || null,
            row.company_name || row['연차명'] || null,
            row.representative || row['대표자'] || null,
            row.address || row['주소'] || null,
            row.contact || row['연락처'] || null,
            row.industry || row['업종'] || null,
            row.sales_amount || row['매출'] || null,
            row.existing_client || row['기존거래처'] || null,
            row.contract_status || row['계약여부'] || null,
            row.termination_month || row['해임월'] || null,
            row.actual_sales || row['실제매출'] || null,
            row.contract_client || row['계약거래처'] || null,
            row.contract_month || row['계약월'] || null,
            row.client_name || row['거래처'] || null,
            row.feedback || row['기타(피드백)'] || null,
            row.april_type1_date || row['4월1종날짜'] || null
          );
          successCount++;
        } catch (error) {
          errors.push({ row: index + 1, error: error.message });
        }
      });

      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);

      res.json({ 
        success: true, 
        message: `${successCount}개 데이터 업로드 완료`,
        total: results.length,
        successCount,
        errors 
      });
    })
    .on('error', (error) => {
      fs.unlinkSync(req.file.path);
      res.json({ success: false, message: error.message });
    });
});

// 대량 CSV 업로드 (스트리밍 처리 - 수만 개 이상의 행에 최적화)
app.post('/api/sales-db/upload-csv-stream', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '파일이 없습니다.' });
  }

  const errors = [];
  let processedCount = 0;
  const BATCH_SIZE = 500; // 500개씩 배치 처리
  let batch = [];
  let isPaused = false;

  const processBatch = (rows) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO sales_db (
            proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
            address, contact, industry, sales_amount, existing_client, contract_status,
            termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = db.transaction((rows) => {
          for (const row of rows) {
            try {
              stmt.run(
                row.proposal_date || row['설의날짜'] || null,
                row.proposer || row['설의자'] || null,
                row.salesperson_id || row['영업자'] || null,
                row.meeting_status || row['미팅여부'] || null,
                row.company_name || row['연차명'] || null,
                row.representative || row['대표자'] || null,
                row.address || row['주소'] || null,
                row.contact || row['연락처'] || null,
                row.industry || row['업종'] || null,
                row.sales_amount || row['매출'] || null,
                row.existing_client || row['기존거래처'] || null,
                row.contract_status || row['계약여부'] || null,
                row.termination_month || row['해임월'] || null,
                row.actual_sales || row['실제매출'] || null,
                row.contract_client || row['계약거래처'] || null,
                row.contract_month || row['계약월'] || null,
                row.client_name || row['거래처'] || null,
                row.feedback || row['기타(피드백)'] || null,
                row.april_type1_date || row['4월1종날짜'] || null
              );
            } catch (err) {
              errors.push({ row: processedCount + rows.indexOf(row) + 1, error: err.message });
            }
          }
        });

        insertMany(rows);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  const stream = fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', async (row) => {
      batch.push(row);
      
      if (batch.length >= BATCH_SIZE && !isPaused) {
        isPaused = true;
        stream.pause();
        
        const currentBatch = batch.splice(0, BATCH_SIZE);
        
        try {
          await processBatch(currentBatch);
          processedCount += currentBatch.length;
          console.log(`Processed ${processedCount} rows...`);
        } catch (err) {
          errors.push({ batch: Math.floor(processedCount / BATCH_SIZE), error: err.message });
        }
        
        isPaused = false;
        stream.resume();
      }
    })
    .on('end', async () => {
      // 남은 데이터 처리
      if (batch.length > 0) {
        try {
          await processBatch(batch);
          processedCount += batch.length;
        } catch (err) {
          errors.push({ batch: 'final', error: err.message });
        }
      }
      
      // 임시 파일 삭제
      fs.unlinkSync(req.file.path);
      
      res.json({ 
        success: true, 
        message: `${processedCount}개 항목 처리 완료`,
        processedCount,
        errors: errors.length > 0 ? errors : undefined,
        errorCount: errors.length
      });
    })
    .on('error', (err) => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.json({ success: false, message: err.message });
    });
});

// ========== 직원 관리 API ==========
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT 
        e.*, 
        u.username, 
        u.role, 
        u.name as user_name,
        u.employee_code,
        u.department,
        u.position,
        u.commission_rate,
        u.bank_name,
        u.account_number,
        u.social_security_number,
        u.hire_date,
        u.address,
        u.emergency_contact
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const { name, username, password, role, employee_code, department, position, hire_date, phone, email } = req.body;
    
    // 먼저 사용자 계정 생성
    const userStmt = db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `);
    const userInfo = userStmt.run(username, password, name, role || 'employee');
    
    // 직원 정보 생성
    const empStmt = db.prepare(`
      INSERT INTO employees (user_id, employee_code, department, position, hire_date, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const empInfo = empStmt.run(userInfo.lastInsertRowid, employee_code, department, position, hire_date, phone, email);
    
    res.json({ success: true, id: empInfo.lastInsertRowid, user_id: userInfo.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, role, employee_code, department, position, hire_date, phone, email } = req.body;
    
    // 직원의 user_id 가져오기
    const employee = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(id);
    
    if (employee && employee.user_id) {
      // 사용자 정보 업데이트
      const userStmt = db.prepare(`
        UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?
      `);
      userStmt.run(username, name, role, employee.user_id);
    }
    
    // 직원 정보 업데이트
    const empStmt = db.prepare(`
      UPDATE employees 
      SET employee_code = ?, department = ?, position = ?, hire_date = ?, phone = ?, email = ?
      WHERE id = ?
    `);
    empStmt.run(employee_code, department, position, hire_date, phone, email, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 직원의 user_id 가져오기
    const employee = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(id);
    
    if (!employee) {
      return res.json({ success: false, message: '직원을 찾을 수 없습니다.' });
    }
    
    // 트랜잭션으로 모든 관련 데이터 삭제
    const deleteEmployee = db.transaction(() => {
      // 1. 근태 기록 삭제
      db.prepare('DELETE FROM attendance WHERE employee_id = ?').run(id);
      
      // 2. 휴가 기록 삭제
      db.prepare('DELETE FROM leaves WHERE employee_id = ?').run(id);
      
      // 3. 직원 레코드 삭제
      db.prepare('DELETE FROM employees WHERE id = ?').run(id);
      
      // 4. 연결된 사용자가 있으면 사용자 삭제 (모든 관련 데이터 포함)
      if (employee.user_id) {
        const userId = employee.user_id;
        
        // 영업자 관련 데이터 삭제 (CASCADE로 자동 삭제됨)
        // db.prepare('DELETE FROM salespersons WHERE salesperson_id = ?').run(userId);
        // db.prepare('DELETE FROM sales_db WHERE salesperson_id = ?').run(userId);
        // db.prepare('DELETE FROM sales_contracts WHERE salesperson_id = ?').run(userId);
        // db.prepare('DELETE FROM commission_statements WHERE salesperson_id = ?').run(userId);
        db.prepare('DELETE FROM misc_commissions WHERE salesperson_id = ?').run(userId);
        
        // 일정 및 메모 삭제
        db.prepare('DELETE FROM schedules WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM memos WHERE user_id = ?').run(userId);
        
        // 계정 변경 요청 삭제
        db.prepare('DELETE FROM account_change_requests WHERE user_id = ? OR reviewed_by = ?').run(userId, userId);
        
        // 공지사항 읽음 기록 삭제
        db.prepare('DELETE FROM notice_reads WHERE user_id = ?').run(userId);
        
        // 작성한 공지사항의 author_id를 NULL로 설정
        db.prepare('UPDATE notices SET author_id = NULL WHERE author_id = ?').run(userId);
        
        // 사용자 삭제
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      }
    });
    
    deleteEmployee();
    res.json({ success: true, message: '직원이 삭제되었습니다.' });
  } catch (error) {
    console.error('직원 삭제 오류:', error);
    res.json({ success: false, message: '직원 삭제 중 오류가 발생했습니다: ' + error.message });
  }
});

// ========== 영업자 관리 API ==========
app.get('/api/salespersons', (req, res) => {
  try {
    const salespersons = db.prepare(`
      SELECT id, name 
      FROM users 
      WHERE role = 'salesperson' 
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, data: salespersons });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/salespersons', (req, res) => {
  try {
    const { name, employee_code, phone, email, commission_rate } = req.body;
    const stmt = db.prepare(`
      INSERT INTO salespersons (name, employee_code, phone, email, commission_rate)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, employee_code, phone, email, commission_rate);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/salespersons/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, employee_code, phone, email, commission_rate, status } = req.body;
    const stmt = db.prepare(`
      UPDATE salespersons 
      SET name = ?, employee_code = ?, phone = ?, email = ?, commission_rate = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(name, employee_code, phone, email, commission_rate, status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 삭제된 API - salespersons 테이블은 더 이상 사용하지 않음
// app.delete('/api/salespersons/:id', (req, res) => {
//   try {
//     const { id } = req.params;
//     const stmt = db.prepare('DELETE FROM salespersons WHERE id = ?');
//     stmt.run(id);
//     res.json({ success: true });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// });

// 영업자별 수수료 상세 조회 (계약여부='Y'인 데이터만, 월별 필터링)
app.get('/api/salesperson/:id/commission-details', (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;
    
    // 확정 여부 확인
    const confirmed = db.prepare(`
      SELECT * FROM commission_statements 
      WHERE salesperson_id = ? AND year = ? AND month = ?
    `).get(id, year, month);
    
    if (confirmed) {
      // 확정된 경우: 저장된 스냅샷 데이터 반환
      const details = JSON.parse(confirmed.details_snapshot || '[]');
      res.json({ 
        success: true, 
        data: details,
        isConfirmed: true,
        confirmedAt: confirmed.confirmed_at
      });
    } else {
      // 미확정인 경우: 실시간 데이터 반환 (월별 필터링)
      const yearMonth = `${year}-${month.padStart(2, '0')}`;
      
      const details = db.prepare(`
        SELECT 
          s.id,
          s.company_name,
          s.contract_client,
          s.contract_date,
          s.client_name,
          COALESCE(c.commission_rate, 500) as commission_rate,
          CAST(REPLACE(s.contract_client, ',', '') AS INTEGER) as commission_base,
          CAST((CAST(REPLACE(s.contract_client, ',', '') AS INTEGER) * COALESCE(c.commission_rate, 500) / 100) AS INTEGER) as commission_amount,
          s.contract_status
        FROM sales_db s
        LEFT JOIN sales_clients c ON s.client_name = c.client_name
        WHERE s.salesperson_id = ? 
          AND s.contract_status = 'Y'
          AND substr(s.contract_date, 1, 7) = ?
        ORDER BY s.contract_date DESC, s.created_at DESC
      `).all(id, yearMonth);
      
      res.json({ 
        success: true, 
        data: details,
        isConfirmed: false
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 영업자 본인 데이터만 조회
app.get('/api/sales-db/my-data', (req, res) => {
  try {
    const { salesperson_id } = req.query;
    
    if (!salesperson_id) {
      return res.json({ success: false, message: '영업자 ID가 필요합니다.' });
    }
    
    const myData = db.prepare(`
      SELECT * FROM sales_db 
      WHERE salesperson_id = ? 
      ORDER BY created_at DESC
    `).all(salesperson_id);
    
    res.json({ success: true, data: myData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 섭외자 본인 데이터만 조회
app.get('/api/sales-db/my-data-recruiter', (req, res) => {
  try {
    const { proposer } = req.query;
    
    if (!proposer) {
      return res.json({ success: false, message: '섭외자 이름이 필요합니다.' });
    }
    
    const myData = db.prepare(`
      SELECT * FROM sales_db 
      WHERE proposer = ? 
      ORDER BY created_at DESC
    `).all(proposer);
    
    res.json({ success: true, data: myData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 섭외자가 특정 필드만 수정
app.put('/api/sales-db/:id/recruiter-update', (req, res) => {
  try {
    const { id } = req.params;
    const { proposal_date, proposer, meeting_status, salesperson_id } = req.body;
    
    // 본인 데이터인지 확인
    const record = db.prepare('SELECT proposer FROM sales_db WHERE id = ?').get(id);
    if (!record || record.proposer !== proposer) {
      return res.json({ success: false, message: '권한이 없습니다.' });
    }
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET proposal_date = ?, meeting_status = ?, salesperson_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(proposal_date, meeting_status, salesperson_id, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 영업자가 특정 필드만 수정
app.put('/api/sales-db/:id/salesperson-update', (req, res) => {
  try {
    const { id } = req.params;
    const { contract_date, meeting_status, contract_client, client_name, contract_status, feedback, actual_sales, salesperson_id } = req.body;
    
    // 본인 데이터인지 확인
    const record = db.prepare('SELECT salesperson_id FROM sales_db WHERE id = ?').get(id);
    if (!record || record.salesperson_id != salesperson_id) {
      return res.json({ success: false, message: '권한이 없습니다.' });
    }
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET contract_date = ?, meeting_status = ?, contract_client = ?, client_name = ?, contract_status = ?, feedback = ?, actual_sales = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(contract_date, meeting_status, contract_client, client_name, contract_status, feedback, actual_sales, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 피드백 추가 API (이력 관리)
app.post('/api/sales-db/:id/add-feedback', (req, res) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body;
    
    if (!author || !content) {
      return res.json({ success: false, message: '작성자와 내용은 필수입니다.' });
    }
    
    // 현재 데이터 조회
    const currentData = db.prepare('SELECT feedback FROM sales_db WHERE id = ?').get(id);
    
    // 기존 피드백 파싱 (JSON 배열 또는 빈 배열)
    let feedbackHistory = [];
    if (currentData && currentData.feedback) {
      try {
        feedbackHistory = JSON.parse(currentData.feedback);
        if (!Array.isArray(feedbackHistory)) {
          // 기존 텍스트 형태라면 첫 번째 항목으로 변환
          feedbackHistory = [{
            author: '이전 기록',
            content: currentData.feedback,
            timestamp: new Date().toISOString()
          }];
        }
      } catch (e) {
        // JSON 파싱 실패 시 기존 텍스트를 첫 항목으로
        feedbackHistory = [{
          author: '이전 기록',
          content: currentData.feedback,
          timestamp: new Date().toISOString()
        }];
      }
    }
    
    // 새 피드백 추가
    feedbackHistory.push({
      author: author,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    // 업데이트
    const stmt = db.prepare('UPDATE sales_db SET feedback = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(JSON.stringify(feedbackHistory), id);
    
    res.json({ success: true, data: feedbackHistory });
  } catch (error) {
    console.error('피드백 추가 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 피드백 이력 조회 API
app.get('/api/sales-db/:id/feedback-history', (req, res) => {
  try {
    const { id } = req.params;
    
    const data = db.prepare('SELECT feedback FROM sales_db WHERE id = ?').get(id);
    
    if (!data) {
      return res.json({ success: false, message: '데이터를 찾을 수 없습니다.' });
    }
    
    let feedbackHistory = [];
    if (data.feedback) {
      try {
        feedbackHistory = JSON.parse(data.feedback);
        if (!Array.isArray(feedbackHistory)) {
          feedbackHistory = [{
            author: '이전 기록',
            content: data.feedback,
            timestamp: new Date().toISOString()
          }];
        }
      } catch (e) {
        feedbackHistory = [{
          author: '이전 기록',
          content: data.feedback,
          timestamp: new Date().toISOString()
        }];
      }
    }
    
    res.json({ success: true, data: feedbackHistory });
  } catch (error) {
    console.error('피드백 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 계약 관리 API ==========
app.get('/api/contracts', (req, res) => {
  try {
    const { type, salesperson_id } = req.query;
    let query = `
      SELECT c.*, u.name as salesperson_name 
      FROM contracts c
      LEFT JOIN users u ON c.salesperson_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    // 계약 유형 필터링
    if (type) {
      conditions.push('c.contract_type = ?');
      params.push(type);
    }
    
    // 영업자 필터링 (영업자가 본인 계약만 보기)
    if (salesperson_id) {
      conditions.push('c.salesperson_id = ?');
      params.push(salesperson_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const contracts = db.prepare(query + ' ORDER BY c.created_at DESC').all(...params);
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    const { 
      contract_type, client_name, client_company, salesperson_id, 
      contract_amount, commission_rate, commission_amount, contract_date, notes 
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO contracts (
        contract_type, client_name, client_company, salesperson_id, 
        contract_amount, commission_rate, commission_amount, contract_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      contract_type, client_name, client_company, salesperson_id,
      contract_amount, commission_rate, commission_amount, contract_date, notes
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/contracts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contract_type, client_name, client_company, salesperson_id, 
      contract_amount, commission_rate, commission_amount, contract_date, payment_status, notes 
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE contracts 
      SET contract_type = ?, client_name = ?, client_company = ?, salesperson_id = ?, 
          contract_amount = ?, commission_rate = ?, commission_amount = ?, 
          contract_date = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      contract_type, client_name, client_company, salesperson_id,
      contract_amount, commission_rate, commission_amount, contract_date, payment_status, notes, id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/contracts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM contracts WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 수수료 명세서 API ==========
app.get('/api/commission-statements', (req, res) => {
  try {
    const { salesperson_id } = req.query;
    let query = `
      SELECT cs.*, u.name as salesperson_name 
      FROM commission_statements cs
      JOIN users u ON cs.salesperson_id = u.id
    `;
    
    if (salesperson_id) {
      query += ` WHERE cs.salesperson_id = ?`;
      const statements = db.prepare(query + ' ORDER BY cs.period_start DESC').all(salesperson_id);
      res.json({ success: true, data: statements });
    } else {
      const statements = db.prepare(query + ' ORDER BY cs.period_start DESC').all();
      res.json({ success: true, data: statements });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/commission-statements', (req, res) => {
  try {
    const { salesperson_id, period_start, period_end, total_sales, total_commission } = req.body;
    const stmt = db.prepare(`
      INSERT INTO commission_statements (salesperson_id, period_start, period_end, total_sales, total_commission)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(salesperson_id, period_start, period_end, total_sales, total_commission);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/commission-statements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { salesperson_id, period_start, period_end, total_sales, total_commission, payment_date, payment_status } = req.body;
    const stmt = db.prepare(`
      UPDATE commission_statements 
      SET salesperson_id = ?, period_start = ?, period_end = ?, 
          total_sales = ?, total_commission = ?, payment_date = ?, payment_status = ?
      WHERE id = ?
    `);
    stmt.run(salesperson_id, period_start, period_end, total_sales, total_commission, payment_date, payment_status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/commission-statements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM commission_statements WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 수수료명세서 확정 (스냅샷 저장)
app.post('/api/commission-statements/confirm', (req, res) => {
  try {
    const { salesperson_id, year, month, details, total_commission } = req.body;
    
    // 이미 확정된 명세서가 있는지 확인
    const existing = db.prepare(`
      SELECT id FROM commission_statements 
      WHERE salesperson_id = ? AND year = ? AND month = ?
    `).get(salesperson_id, year, month);
    
    if (existing) {
      return res.json({ success: false, message: '이미 확정된 명세서입니다.' });
    }
    
    // 새 명세서 생성 (스냅샷 저장)
    const stmt = db.prepare(`
      INSERT INTO commission_statements (
        salesperson_id, year, month, details_snapshot, 
        total_commission, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      salesperson_id, 
      year, 
      month, 
      JSON.stringify(details), 
      total_commission
    );
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 전체 영업자 수수료 요약 조회
app.get('/api/commission-statements/summary', (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.json({ success: false, message: '연도와 월을 입력하세요.' });
    }
    
    // 모든 영업자 조회
    const salespersons = db.prepare(`
      SELECT id, name, username FROM users WHERE role = 'salesperson'
    `).all();
    
    const yearMonth = `${year}-${month.padStart(2, '0')}`;
    
    const summary = salespersons.map(sp => {
      // 계약 수수료 계산
      const contractCommission = db.prepare(`
        SELECT 
          COALESCE(SUM(
            CAST((CAST(REPLACE(s.contract_client, ',', '') AS INTEGER) * COALESCE(c.commission_rate, 500) / 100) AS INTEGER)
          ), 0) as total
        FROM sales_db s
        LEFT JOIN sales_clients c ON s.client_name = c.client_name
        WHERE s.salesperson_id = ? 
          AND s.contract_status = 'Y'
          AND substr(s.contract_date, 1, 7) = ?
      `).get(sp.id, yearMonth);
      
      // 기타 수수료 계산
      const miscCommission = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM misc_commissions
        WHERE salesperson_id = ? AND year = ? AND month = ?
      `).get(sp.id, year, month);
      
      const totalCommission = (contractCommission?.total || 0) + (miscCommission?.total || 0);
      const withholdingTax = Math.round(totalCommission * 0.033);
      const netPay = totalCommission - withholdingTax;
      
      // 확정 여부 확인
      const confirmed = db.prepare(`
        SELECT confirmed_at FROM commission_statements
        WHERE salesperson_id = ? AND year = ? AND month = ?
      `).get(sp.id, year, month);
      
      return {
        salesperson_id: sp.id,
        salesperson_name: sp.name,
        username: sp.username,
        total_commission: totalCommission,
        withholding_tax: withholdingTax,
        net_pay: netPay,
        is_confirmed: !!confirmed,
        confirmed_at: confirmed?.confirmed_at || null
      };
    });
    
    res.json({ success: true, data: summary });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 기타수수료 API (Miscellaneous Commissions) ==========
// 기타수수료 조회 (특정 영업자의 특정 연월)
app.get('/api/misc-commissions', (req, res) => {
  try {
    const { salesperson_id, year, month } = req.query;
    
    if (!salesperson_id || !year || !month) {
      return res.json({ success: false, message: '필수 파라미터가 누락되었습니다.' });
    }
    
    const commissions = db.prepare(`
      SELECT * FROM misc_commissions 
      WHERE salesperson_id = ? AND year = ? AND month = ?
      ORDER BY created_at DESC
    `).all(salesperson_id, year, month);
    
    res.json({ success: true, data: commissions });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 기타수수료 추가
app.post('/api/misc-commissions', (req, res) => {
  try {
    const { salesperson_id, year, month, description, amount } = req.body;
    
    if (!salesperson_id || !year || !month || amount === undefined) {
      return res.json({ success: false, message: '필수 필드가 누락되었습니다.' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO misc_commissions (salesperson_id, year, month, description, amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(salesperson_id, year, month, description || '', amount);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 기타수수료 수정
app.put('/api/misc-commissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount } = req.body;
    
    const stmt = db.prepare(`
      UPDATE misc_commissions 
      SET description = ?, amount = ?
      WHERE id = ?
    `);
    
    stmt.run(description || '', amount, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 기타수수료 삭제
app.delete('/api/misc-commissions/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare('DELETE FROM misc_commissions WHERE id = ?');
    stmt.run(id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 일정 관리 API (Schedules) ==========
// 일정 조회 (본인 것만 조회, 관리자는 모든 일정 조회 가능)
app.get('/api/schedules', (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT s.*, u.name as user_name 
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ` WHERE s.user_id = ?`;
      params.push(user_id);
    }
    
    query += ` ORDER BY s.schedule_date DESC, s.schedule_time DESC`;
    
    const schedules = db.prepare(query).all(...params);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 추가
app.post('/api/schedules', (req, res) => {
  try {
    const { user_id, title, schedule_date, schedule_time, client_name, location, notes, status } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO schedules (user_id, title, schedule_date, schedule_time, client_name, location, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, title, schedule_date, schedule_time, client_name, location, notes, status || 'scheduled');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 수정
app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, schedule_date, schedule_time, client_name, location, notes, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE schedules 
      SET title = ?, schedule_date = ?, schedule_time = ?, 
          client_name = ?, location = ?, notes = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(title, schedule_date, schedule_time, client_name, location, notes, status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 삭제
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 메모 API (Memos) ==========
// 메모 조회 (본인 것만 조회, 관리자는 모든 메모 조회 가능)
app.get('/api/memos', (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT m.*, u.name as user_name 
      FROM memos m
      LEFT JOIN users u ON m.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ` WHERE m.user_id = ?`;
      params.push(user_id);
    }
    
    query += ` ORDER BY m.created_at DESC`;
    
    const memos = db.prepare(query).all(...params);
    res.json({ success: true, data: memos });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 추가
app.post('/api/memos', (req, res) => {
  try {
    const { user_id, title, content, category } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO memos (user_id, title, content, category)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, title, content, category);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 수정
app.put('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    
    const stmt = db.prepare(`
      UPDATE memos 
      SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(title, content, category, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 삭제
app.delete('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM memos WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 매출거래처 관리 API (Sales Clients) ==========
// 매출거래처 전체 조회
app.get('/api/sales-clients', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM sales_clients ORDER BY client_name').all();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 추가
app.post('/api/sales-clients', (req, res) => {
  try {
    const { client_name, commission_rate, description } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO sales_clients (client_name, commission_rate, description)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(client_name, commission_rate || 0, description || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 수정
app.put('/api/sales-clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, commission_rate, description } = req.body;
    
    const stmt = db.prepare(`
      UPDATE sales_clients 
      SET client_name = ?, commission_rate = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(client_name, commission_rate, description || '', id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 삭제
app.delete('/api/sales-clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM sales_clients WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 월별 실적 현황 API ==========
// 월별 실적 현황 조회
app.get('/api/admin/monthly-performance', (req, res) => {
  try {
    const { year, month, contract_status, client_name } = req.query;
    
    let query = `
      SELECT 
        sd.id,
        sd.proposal_date,
        sd.proposer,
        u.name as salesperson_name,
        sd.meeting_status,
        sd.contract_status,
        sd.company_name,
        sd.representative,
        sd.contact,
        sd.industry,
        sd.client_name,
        sd.contract_client,
        sd.contract_month,
        sd.actual_sales,
        sc.commission_rate
      FROM sales_db sd
      LEFT JOIN users u ON sd.salesperson_id = u.id
      LEFT JOIN sales_clients sc ON sd.client_name = sc.client_name
      WHERE 1=1
    `;
    
    const params = [];
    
    // 연도/월 필터
    if (year && month) {
      query += ` AND strftime('%Y', sd.proposal_date) = ? AND strftime('%m', sd.proposal_date) = ?`;
      params.push(year, String(month).padStart(2, '0'));
    } else if (year) {
      query += ` AND strftime('%Y', sd.proposal_date) = ?`;
      params.push(year);
    } else if (month) {
      query += ` AND strftime('%m', sd.proposal_date) = ?`;
      params.push(String(month).padStart(2, '0'));
    }
    
    // 계약 상태 필터
    if (contract_status && contract_status !== 'all') {
      query += ` AND sd.contract_status = ?`;
      params.push(contract_status);
    }
    
    // 매출거래처 필터
    if (client_name && client_name !== 'all') {
      query += ` AND sd.client_name = ?`;
      params.push(client_name);
    }
    
    query += ` ORDER BY sd.proposal_date DESC`;
    
    const data = db.prepare(query).all(...params);
    res.json({ success: true, data });
  } catch (error) {
    console.error('월별 실적 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 계정 변경 요청 API ==========
// 사용자가 본인 계정 변경 요청
app.post('/api/account-change-requests', (req, res) => {
  try {
    const { user_id, requested_changes } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO account_change_requests (user_id, requested_changes)
      VALUES (?, ?)
    `);
    const result = stmt.run(user_id, JSON.stringify(requested_changes));
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 모든 계정 변경 요청 조회 (관리자용)
app.get('/api/account-change-requests', (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        acr.*,
        u.username,
        u.name as user_name,
        u.employee_code,
        admin.name as reviewed_by_name
      FROM account_change_requests acr
      LEFT JOIN users u ON acr.user_id = u.id
      LEFT JOIN users admin ON acr.reviewed_by = admin.id
    `;
    
    const params = [];
    if (status && status !== 'all') {
      query += ` WHERE acr.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY acr.requested_at DESC`;
    
    const requests = db.prepare(query).all(...params);
    
    // requested_changes를 JSON으로 파싱
    const parsedRequests = requests.map(req => ({
      ...req,
      requested_changes: JSON.parse(req.requested_changes)
    }));
    
    res.json({ success: true, data: parsedRequests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 특정 사용자의 계정 변경 요청 조회
app.get('/api/account-change-requests/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = db.prepare(`
      SELECT 
        acr.*,
        admin.name as reviewed_by_name
      FROM account_change_requests acr
      LEFT JOIN users admin ON acr.reviewed_by = admin.id
      WHERE acr.user_id = ?
      ORDER BY acr.requested_at DESC
    `).all(userId);
    
    // requested_changes를 JSON으로 파싱
    const parsedRequests = requests.map(req => ({
      ...req,
      requested_changes: JSON.parse(req.requested_changes)
    }));
    
    res.json({ success: true, data: parsedRequests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 계정 변경 요청 승인/거절 (관리자용)
app.put('/api/account-change-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note, reviewed_by } = req.body;
    
    // 요청 정보 가져오기
    const request = db.prepare('SELECT * FROM account_change_requests WHERE id = ?').get(id);
    if (!request) {
      return res.json({ success: false, message: '요청을 찾을 수 없습니다.' });
    }
    
    // 승인인 경우 사용자 정보 업데이트
    if (status === 'approved') {
      const changes = JSON.parse(request.requested_changes);
      
      // 업데이트할 필드 구성
      const updateFields = [];
      const updateValues = [];
      
      if (changes.name) {
        updateFields.push('name = ?');
        updateValues.push(changes.name);
      }
      if (changes.department) {
        updateFields.push('department = ?');
        updateValues.push(changes.department);
      }
      if (changes.position) {
        updateFields.push('position = ?');
        updateValues.push(changes.position);
      }
      if (changes.bank_name !== undefined) {
        updateFields.push('bank_name = ?');
        updateValues.push(changes.bank_name);
      }
      if (changes.account_number !== undefined) {
        updateFields.push('account_number = ?');
        updateValues.push(changes.account_number);
      }
      if (changes.social_security_number !== undefined) {
        updateFields.push('social_security_number = ?');
        updateValues.push(changes.social_security_number);
      }
      if (changes.hire_date !== undefined) {
        updateFields.push('hire_date = ?');
        updateValues.push(changes.hire_date);
      }
      if (changes.address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(changes.address);
      }
      if (changes.emergency_contact !== undefined) {
        updateFields.push('emergency_contact = ?');
        updateValues.push(changes.emergency_contact);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(request.user_id);
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        db.prepare(updateQuery).run(...updateValues);
      }
    }
    
    // 요청 상태 업데이트
    const stmt = db.prepare(`
      UPDATE account_change_requests 
      SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, admin_note || '', reviewed_by, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 계정 변경 요청 삭제
app.delete('/api/account-change-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM account_change_requests WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 당월 실적 순위 API ==========
// 영업자 당월 실적 순위 조회
app.get('/api/rankings/monthly', (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    
    // 모든 영업자 조회
    const salespersons = db.prepare(`
      SELECT id, name, employee_code 
      FROM users 
      WHERE role = 'salesperson'
    `).all();
    
    const rankings = salespersons.map(person => {
      // 당월 실적 계산
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_db,
          COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_count,
          SUM(CASE WHEN contract_status = 'Y' THEN CAST(contract_client AS INTEGER) ELSE 0 END) as total_contract_fee
        FROM sales_db
        WHERE salesperson = ?
          AND strftime('%Y', proposal_date) = ?
          AND strftime('%m', proposal_date) = ?
      `).get(person.name, String(currentYear), currentMonth);
      
      const totalDB = stats.total_db || 0;
      const contractCount = stats.contract_count || 0;
      const totalContractFee = stats.total_contract_fee || 0;
      const contractRate = totalDB > 0 ? (contractCount / totalDB * 100) : 0;
      
      return {
        id: person.id,
        name: person.name,
        employee_code: person.employee_code,
        total_db: totalDB,
        contract_count: contractCount,
        total_contract_fee: totalContractFee,
        contract_rate: contractRate
      };
    });
    
    // 기장료 순위 (내림차순)
    const feeRankings = [...rankings].sort((a, b) => b.total_contract_fee - a.total_contract_fee);
    feeRankings.forEach((item, index) => {
      item.fee_rank = index + 1;
    });
    
    // 계약율 순위 (내림차순)
    const rateRankings = [...rankings].sort((a, b) => b.contract_rate - a.contract_rate);
    rateRankings.forEach((item, index) => {
      item.rate_rank = index + 1;
    });
    
    // 순위 정보 병합
    const result = rankings.map(person => {
      const feeRank = feeRankings.find(r => r.id === person.id)?.fee_rank || 0;
      const rateRank = rateRankings.find(r => r.id === person.id)?.rate_rank || 0;
      
      return {
        ...person,
        fee_rank: feeRank,
        rate_rank: rateRank
      };
    });
    
    // 기장료 순위로 정렬
    result.sort((a, b) => a.fee_rank - b.fee_rank);
    
    res.json({ 
      success: true, 
      data: result,
      period: `${currentYear}년 ${parseInt(currentMonth)}월`
    });
  } catch (error) {
    console.error('실적 순위 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 섭외자별 실적 통계 API ==========
// 섭외자별 월별 실적 조회
app.get('/api/recruiter-performance', (req, res) => {
  try {
    const { year, month, months } = req.query; // months: 평균 계산할 개월 수 (1, 3 등)
    
    // 모든 섭외자 목록 가져오기
    const recruiters = db.prepare(`
      SELECT id, name, employee_code 
      FROM users 
      WHERE role = 'recruiter'
      ORDER BY name
    `).all();
    
    const results = recruiters.map(recruiter => {
      // 월별 실적 계산
      if (year && month) {
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_db,
            COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
            COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed
          FROM sales_db
          WHERE proposer = ?
            AND strftime('%Y', proposal_date) = ?
            AND strftime('%m', proposal_date) = ?
        `).get(recruiter.name, year, String(month).padStart(2, '0'));
        
        return {
          ...recruiter,
          period: `${year}년 ${month}월`,
          ...stats
        };
      }
      
      // N개월 평균 실적 계산
      if (months) {
        const monthsNum = parseInt(months);
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);
        const startYear = startDate.getFullYear();
        const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_db,
            COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
            COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed
          FROM sales_db
          WHERE proposer = ?
            AND proposal_date >= date('${startYear}-${startMonth}-01')
        `).get(recruiter.name);
        
        return {
          ...recruiter,
          period: `최근 ${monthsNum}개월`,
          total_db: Math.round((stats.total_db || 0) / monthsNum * 10) / 10,
          meeting_completed: Math.round((stats.meeting_completed || 0) / monthsNum * 10) / 10,
          contract_completed: Math.round((stats.contract_completed || 0) / monthsNum * 10) / 10
        };
      }
      
      // 기본: 이번 달 실적
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_db,
          COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
          COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed
        FROM sales_db
        WHERE proposer = ?
          AND strftime('%Y', proposal_date) = ?
          AND strftime('%m', proposal_date) = ?
      `).get(recruiter.name, String(currentYear), currentMonth);
      
      return {
        ...recruiter,
        period: `${currentYear}년 ${parseInt(currentMonth)}월`,
        ...stats
      };
    });
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('섭외자 실적 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 영업자별 실적 통계 API ==========
// 영업자별 월별 실적 조회
app.get('/api/salesperson-performance', (req, res) => {
  try {
    const { year, month, months } = req.query; // months: 평균 계산할 개월 수 (1, 3 등)
    
    // 모든 영업자 목록 가져오기
    const salespersons = db.prepare(`
      SELECT id, name, employee_code 
      FROM users 
      WHERE role = 'salesperson'
      ORDER BY name
    `).all();
    
    const results = salespersons.map(salesperson => {
      // 월별 실적 계산
      if (year && month) {
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_db,
            COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
            COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed,
            COALESCE(SUM(CASE WHEN contract_status = 'Y' THEN CAST(contract_client AS INTEGER) ELSE 0 END), 0) as total_contract_amount
          FROM sales_db
          WHERE salesperson_id = ?
            AND strftime('%Y', proposal_date) = ?
            AND strftime('%m', proposal_date) = ?
        `).get(salesperson.id, year, String(month).padStart(2, '0'));
        
        return {
          ...salesperson,
          period: `${year}년 ${month}월`,
          ...stats
        };
      }
      
      // N개월 평균 실적 계산
      if (months) {
        const monthsNum = parseInt(months);
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);
        const startYear = startDate.getFullYear();
        const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        
        const stats = db.prepare(`
          SELECT 
            COUNT(*) as total_db,
            COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
            COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed,
            COALESCE(SUM(CASE WHEN contract_status = 'Y' THEN CAST(contract_client AS INTEGER) ELSE 0 END), 0) as total_contract_amount
          FROM sales_db
          WHERE salesperson_id = ?
            AND proposal_date >= date('${startYear}-${startMonth}-01')
        `).get(salesperson.id);
        
        return {
          ...salesperson,
          period: `최근 ${monthsNum}개월`,
          total_db: Math.round((stats.total_db || 0) / monthsNum * 10) / 10,
          meeting_completed: Math.round((stats.meeting_completed || 0) / monthsNum * 10) / 10,
          contract_completed: Math.round((stats.contract_completed || 0) / monthsNum * 10) / 10,
          total_contract_amount: Math.round((stats.total_contract_amount || 0) / monthsNum)
        };
      }
      
      // 기본: 이번 달 실적
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_db,
          COUNT(CASE WHEN meeting_status = '미팅완료' THEN 1 END) as meeting_completed,
          COUNT(CASE WHEN contract_status = 'Y' THEN 1 END) as contract_completed,
          COALESCE(SUM(CASE WHEN contract_status = 'Y' THEN CAST(contract_client AS INTEGER) ELSE 0 END), 0) as total_contract_amount
        FROM sales_db
        WHERE salesperson_id = ?
          AND strftime('%Y', proposal_date) = ?
          AND strftime('%m', proposal_date) = ?
      `).get(salesperson.id, String(currentYear), currentMonth);
      
      return {
        ...salesperson,
        period: `${currentYear}년 ${parseInt(currentMonth)}월`,
        ...stats
      };
    });
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('영업자 실적 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 공지사항 API ==========
// 모든 공지사항 조회
app.get('/api/notices', (req, res) => {
  try {
    const { user_id } = req.query;
    
    const notices = db.prepare(`
      SELECT 
        n.*,
        u.name as author_name,
        CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM notices n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN notice_reads nr ON n.id = nr.notice_id AND nr.user_id = ?
      WHERE n.is_active = 1
      ORDER BY n.is_important DESC, n.created_at DESC
    `).all(user_id || 0);
    
    res.json({ success: true, data: notices });
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 읽지 않은 공지사항 조회
app.get('/api/notices/unread', (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({ success: false, message: 'user_id is required' });
    }
    
    const notices = db.prepare(`
      SELECT 
        n.*,
        u.name as author_name
      FROM notices n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN notice_reads nr ON n.id = nr.notice_id AND nr.user_id = ?
      WHERE n.is_active = 1 AND nr.id IS NULL
      ORDER BY n.is_important DESC, n.created_at DESC
    `).all(user_id);
    
    res.json({ success: true, data: notices });
  } catch (error) {
    console.error('읽지 않은 공지사항 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 생성 (관리자용)
app.post('/api/notices', (req, res) => {
  try {
    const { title, content, author_id, is_important } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO notices (title, content, author_id, is_important)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(title, content, author_id, is_important ? 1 : 0);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('공지사항 생성 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 수정 (관리자용)
app.put('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_important, is_active } = req.body;
    
    const stmt = db.prepare(`
      UPDATE notices 
      SET title = ?, content = ?, is_important = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(title, content, is_important ? 1 : 0, is_active ? 1 : 0, id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('공지사항 수정 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 삭제 (관리자용)
app.delete('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 실제 삭제가 아닌 비활성화
    db.prepare('UPDATE notices SET is_active = 0 WHERE id = ?').run(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('공지사항 삭제 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 읽음 처리
app.post('/api/notices/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO notice_reads (notice_id, user_id)
      VALUES (?, ?)
    `);
    stmt.run(id, user_id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('공지사항 읽음 처리 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// ========== 해피콜 API ==========

// 해피콜 목록 조회
app.get('/api/happycalls', (req, res) => {
  try {
    const { staff_id, salesperson_id, score } = req.query;
    
    let query = 'SELECT * FROM happycalls WHERE 1=1';
    const params = [];
    
    if (staff_id) {
      query += ' AND happycall_staff_id = ?';
      params.push(staff_id);
    }
    
    if (salesperson_id) {
      query += ' AND salesperson_id = ?';
      params.push(salesperson_id);
    }
    
    if (score) {
      query += ' AND score = ?';
      params.push(score);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const happycalls = db.prepare(query).all(...params);
    res.json({ success: true, data: happycalls });
  } catch (error) {
    console.error('해피콜 목록 조회 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 등록
app.post('/api/happycalls', (req, res) => {
  try {
    const {
      happycall_staff_id,
      happycall_staff_name,
      salesperson_id,
      salesperson_name,
      client_name,
      client_contact,
      call_date,
      call_content,
      score,
      notes
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO happycalls (
        happycall_staff_id, happycall_staff_name, salesperson_id, salesperson_name,
        client_name, client_contact, call_date, call_content, score, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      happycall_staff_id,
      happycall_staff_name,
      salesperson_id,
      salesperson_name,
      client_name,
      client_contact,
      call_date,
      call_content,
      score,
      notes
    );
    
    // 점수가 '하'인 경우 알림 생성
    if (score === '하') {
      // 관리자들 조회
      const admins = db.prepare('SELECT id FROM users WHERE role = ?').all('admin');
      
      // 알림 제목과 내용
      const noticeTitle = `[해피콜 경고] ${client_name} 고객 불만`;
      const noticeContent = `해피콜 담당자 ${happycall_staff_name}님이 ${client_name} 고객의 해피콜 점수를 '하'로 평가했습니다.\n\n담당 영업자: ${salesperson_name || '미지정'}\n통화일: ${call_date}\n내용: ${call_content}`;
      
      // 관리자에게 공지사항 생성
      if (admins.length > 0) {
        const noticeStmt = db.prepare(`
          INSERT INTO notices (title, content, author_id, is_important, is_active)
          VALUES (?, ?, ?, 1, 1)
        `);
        noticeStmt.run(noticeTitle, noticeContent, happycall_staff_id);
      }
      
      // 영업자에게도 알림 (영업자 ID가 있는 경우)
      if (salesperson_id) {
        const salesNoticeStmt = db.prepare(`
          INSERT INTO notices (title, content, author_id, is_important, is_active)
          VALUES (?, ?, ?, 1, 1)
        `);
        salesNoticeStmt.run(
          `[해피콜] ${client_name} 고객 피드백`,
          `고객 ${client_name}님의 해피콜 결과가 '하'로 기록되었습니다.\n\n통화일: ${call_date}\n내용: ${call_content}`,
          happycall_staff_id
        );
      }
    }
    
    res.json({ 
      success: true, 
      data: { id: result.lastInsertRowid },
      message: '해피콜이 등록되었습니다.' + (score === '하' ? ' 관리자와 영업자에게 알림이 전송되었습니다.' : '')
    });
  } catch (error) {
    console.error('해피콜 등록 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 수정
app.put('/api/happycalls/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      salesperson_id,
      salesperson_name,
      client_name,
      client_contact,
      call_date,
      call_content,
      score,
      notes
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE happycalls SET
        salesperson_id = ?,
        salesperson_name = ?,
        client_name = ?,
        client_contact = ?,
        call_date = ?,
        call_content = ?,
        score = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      salesperson_id,
      salesperson_name,
      client_name,
      client_contact,
      call_date,
      call_content,
      score,
      notes,
      id
    );
    
    res.json({ success: true, message: '해피콜이 수정되었습니다.' });
  } catch (error) {
    console.error('해피콜 수정 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 삭제
app.delete('/api/happycalls/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM happycalls WHERE id = ?').run(id);
    res.json({ success: true, message: '해피콜이 삭제되었습니다.' });
  } catch (error) {
    console.error('해피콜 삭제 오류:', error);
    res.json({ success: false, message: error.message });
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ERP Server is running' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ 
      status: 'server_running', 
      message: 'ERP Backend is running. Frontend build not found. Please check build logs.' 
    });
  }
});

// ========== 생일 축하 자동 공지 ==========
// 오늘이 생일인 사용자 확인 및 공지 생성
function checkBirthdaysAndCreateNotices() {
  try {
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayMonth}${todayDay}`;
    
    console.log(`[생일 체크] ${today.toLocaleDateString('ko-KR')} - 오늘 생일인 직원 확인 중...`);
    
    // 모든 사용자 조회 (주민번호가 있는 경우만)
    const users = db.prepare(`
      SELECT id, name, social_security_number 
      FROM users 
      WHERE social_security_number IS NOT NULL 
        AND social_security_number != ''
    `).all();
    
    const birthdayUsers = [];
    
    users.forEach(user => {
      if (user.social_security_number && user.social_security_number.length >= 6) {
        // 주민번호 앞 6자리에서 MMDD 추출 (YYMMDD 형식)
        const birthMMDD = user.social_security_number.substring(2, 6);
        
        if (birthMMDD === todayStr) {
          birthdayUsers.push(user);
        }
      }
    });
    
    if (birthdayUsers.length > 0) {
      console.log(`[생일 체크] ${birthdayUsers.length}명의 생일 발견:`, birthdayUsers.map(u => u.name).join(', '));
      
      // 각 생일자에 대해 공지사항 생성
      birthdayUsers.forEach(user => {
        // 오늘 이미 해당 사용자의 생일 공지가 있는지 확인
        const existingNotice = db.prepare(`
          SELECT id FROM notices 
          WHERE title LIKE ? 
            AND DATE(created_at) = DATE('now')
            AND is_active = 1
        `).get(`🎉 ${user.name}님 생일 축하합니다! 🎂`);
        
        if (!existingNotice) {
          // 관리자 계정 찾기 (시스템 계정으로 사용)
          const admin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');
          const authorId = admin ? admin.id : 1;
          
          // 생일 축하 공지 생성
          const stmt = db.prepare(`
            INSERT INTO notices (title, content, author_id, is_important)
            VALUES (?, ?, ?, ?)
          `);
          
          const title = `🎉 ${user.name}님 생일 축하합니다! 🎂`;
          const content = `오늘은 ${user.name}님의 소중한 생일입니다! 🎉

${user.name}님께서 저희와 함께해주셔서 감사합니다.
앞으로도 건강하시고 행복한 일만 가득하시길 바랍니다.

다같이 축하해주세요! 🎂🎈🎁

생일 축하합니다! 🥳`;
          
          stmt.run(title, content, authorId, 1); // is_important = 1 (중요 공지)
          console.log(`[생일 공지 생성] ${user.name}님 생일 축하 공지가 생성되었습니다.`);
        } else {
          console.log(`[생일 공지 스킵] ${user.name}님 공지가 이미 존재합니다.`);
        }
      });
    } else {
      console.log('[생일 체크] 오늘 생일인 직원이 없습니다.');
    }
  } catch (error) {
    console.error('[생일 체크 오류]', error);
  }
}

// 매일 자정에 생일 체크 실행
function scheduleBirthdayCheck() {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // 다음 날
    0, 0, 0 // 자정
  );
  const msToMidnight = night.getTime() - now.getTime();
  
  setTimeout(() => {
    checkBirthdaysAndCreateNotices();
    // 자정에 실행 후 24시간마다 반복
    setInterval(checkBirthdaysAndCreateNotices, 24 * 60 * 60 * 1000);
  }, msToMidnight);
  
  console.log(`[생일 체크 스케줄러] 다음 실행 시간: ${night.toLocaleString('ko-KR')}`);
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ERP Server running on http://0.0.0.0:${PORT}`);
  console.log('Database initialized with happycall role support');
  
  // 서버 시작 시 즉시 한 번 실행
  checkBirthdaysAndCreateNotices();
  
  // 매일 자정 실행 스케줄 등록
  scheduleBirthdayCheck();
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) db.close();
  process.exit();
});

process.on('SIGTERM', () => {
  if (db) db.close();
  process.exit();
});

