// HRIS SQLite Database Configuration
// Local development uses SQLite for persistence at ./database/hris_dev.sqlite

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file path
const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'hris_dev.sqlite');

// Singleton database connection
let db: Database.Database | null = null;

// Ensure database directory exists
function ensureDatabaseDirectory(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('[HRIS-DB] Created database directory:', DB_DIR);
  }
}

// Get or create database connection
export function getConnection(): Database.Database {
  if (db) return db;

  ensureDatabaseDirectory();
  
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  console.log('[HRIS-DB] Connected to SQLite database:', DB_PATH);
  
  return db;
}

// Run database migrations
export function runMigrations(): void {
  const conn = getConnection();
  
  console.log('[HRIS-DB] Running database migrations...');

  // Create tables
  conn.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Salary Grades
    CREATE TABLE IF NOT EXISTS salary_grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT CHECK(frequency IN ('hourly', 'daily', 'weekly', 'monthly')) DEFAULT 'monthly',
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Positions
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      department_id INTEGER REFERENCES departments(id),
      salary_grade_id INTEGER REFERENCES salary_grades(id),
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Areas
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Shifts
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_minutes INTEGER DEFAULT 60,
      is_night_shift INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Employees
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT,
      phone TEXT,
      picture TEXT,
      department_id INTEGER REFERENCES departments(id),
      position_id INTEGER REFERENCES positions(id),
      area_id INTEGER REFERENCES areas(id),
      status TEXT CHECK(status IN ('Active', 'Resigned', 'AWOL')) DEFAULT 'Active',
      role TEXT CHECK(role IN ('Employee', 'Manager', 'Admin', 'CEO', 'DEV')) DEFAULT 'Employee',
      password_hash TEXT,
      basic_salary REAL DEFAULT 0,
      hire_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Attendance Logs (raw ZKTeco data)
    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      employee_idno TEXT,
      timestamp TEXT NOT NULL,
      state INTEGER NOT NULL,
      device_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Daily Attendance (processed records)
    CREATE TABLE IF NOT EXISTS daily_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      date TEXT NOT NULL,
      time_in TEXT,
      time_out TEXT,
      shift_id INTEGER REFERENCES shifts(id),
      scheduled_in TEXT,
      scheduled_out TEXT,
      late_minutes INTEGER DEFAULT 0,
      early_out_minutes INTEGER DEFAULT 0,
      overtime_minutes INTEGER DEFAULT 0,
      undertime_minutes INTEGER DEFAULT 0,
      total_hours REAL DEFAULT 0,
      status TEXT CHECK(status IN ('Present', 'Absent', 'Late', 'Half-day', 'On Leave', 'Holiday')) DEFAULT 'Present',
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(employee_id, date)
    );

    -- OT Requests
    CREATE TABLE IF NOT EXISTS ot_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      hours REAL NOT NULL,
      reason TEXT,
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TEXT,
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Leave Requests
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      leave_type TEXT CHECK(leave_type IN ('Regular', 'Paid', 'Sick')) DEFAULT 'Regular',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days INTEGER NOT NULL,
      reason TEXT,
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TEXT,
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Salary Advance Requests
    CREATE TABLE IF NOT EXISTS salary_advance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      amount REAL NOT NULL,
      reason TEXT,
      repayment_months INTEGER DEFAULT 1,
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TEXT,
      rejection_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Holidays
    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL UNIQUE,
      type TEXT CHECK(type IN ('Regular', 'Special')) DEFAULT 'Regular',
      pay_multiplier REAL DEFAULT 2.0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Formulas (payroll calculation variables)
    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category TEXT CHECK(category IN ('salary', 'overtime', 'holiday', 'deduction', 'other')) DEFAULT 'other',
      description TEXT,
      data_type TEXT CHECK(data_type IN ('number', 'percentage', 'text', 'boolean')) DEFAULT 'number',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Payroll
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      basic_salary REAL DEFAULT 0,
      days_worked INTEGER DEFAULT 0,
      regular_hours REAL DEFAULT 0,
      overtime_hours REAL DEFAULT 0,
      overtime_pay REAL DEFAULT 0,
      holiday_pay REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      gross_pay REAL DEFAULT 0,
      sss_deduction REAL DEFAULT 0,
      philhealth_deduction REAL DEFAULT 0,
      pagibig_deduction REAL DEFAULT 0,
      tax_deduction REAL DEFAULT 0,
      salary_advance_deduction REAL DEFAULT 0,
      late_deduction_minutes INTEGER DEFAULT 0,
      other_deductions REAL DEFAULT 0,
      total_deductions REAL DEFAULT 0,
      net_pay REAL DEFAULT 0,
      status TEXT CHECK(status IN ('Draft', 'Pending', 'Approved', 'Paid')) DEFAULT 'Draft',
      approved_by INTEGER REFERENCES employees(id),
      approved_at TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(employee_id, period_start, period_end)
    );

    -- Employee Shifts
    CREATE TABLE IF NOT EXISTS employee_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      shift_id INTEGER REFERENCES shifts(id),
      effective_date TEXT NOT NULL,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Unmapped Punches (for orphan attendance logs)
    CREATE TABLE IF NOT EXISTS unmapped_punches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_idno TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      state INTEGER NOT NULL,
      device_id TEXT,
      reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Import Logs (for tracking imports)
    CREATE TABLE IF NOT EXISTS import_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_type TEXT NOT NULL,
      file_name TEXT,
      records_processed INTEGER DEFAULT 0,
      records_imported INTEGER DEFAULT 0,
      records_updated INTEGER DEFAULT 0,
      records_failed INTEGER DEFAULT 0,
      error_details TEXT,
      imported_by INTEGER REFERENCES employees(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
    CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username);
    CREATE INDEX IF NOT EXISTS idx_attendance_logs_employee_id ON attendance_logs(employee_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_daily_attendance_employee_date ON daily_attendance(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll(employee_id, period_start, period_end);
  `);

  console.log('[HRIS-DB] Database migrations completed');
}

// Seed default formulas
export function seedFormulas(): void {
  const conn = getConnection();
  
  const formulas = [
    { key: 'working_days_per_month', value: '22', category: 'salary', description: 'Number of working days per month', data_type: 'number' },
    { key: 'working_hours_per_day', value: '8', category: 'salary', description: 'Number of working hours per day', data_type: 'number' },
    { key: 'ot_multiplier_regular', value: '1.25', category: 'overtime', description: 'OT multiplier for regular days', data_type: 'number' },
    { key: 'ot_multiplier_restday', value: '1.30', category: 'overtime', description: 'OT multiplier for rest days', data_type: 'number' },
    { key: 'ot_multiplier_holiday', value: '2.00', category: 'overtime', description: 'OT multiplier for holidays', data_type: 'number' },
    { key: 'holiday_pay_regular', value: '2.00', category: 'holiday', description: 'Pay multiplier for regular holidays', data_type: 'number' },
    { key: 'holiday_pay_special', value: '1.30', category: 'holiday', description: 'Pay multiplier for special holidays', data_type: 'number' },
    { key: 'sss_rate', value: '4.5', category: 'deduction', description: 'SSS contribution rate (%)', data_type: 'percentage' },
    { key: 'philhealth_rate', value: '2.0', category: 'deduction', description: 'PhilHealth contribution rate (%)', data_type: 'percentage' },
    { key: 'pagibig_rate', value: '2.0', category: 'deduction', description: 'Pag-IBIG contribution rate (%)', data_type: 'percentage' },
    { key: 'night_diff_multiplier', value: '1.10', category: 'overtime', description: 'Night differential multiplier', data_type: 'number' },
    { key: 'late_deduction_per_minute', value: '10', category: 'deduction', description: 'Deduction per minute late (PHP)', data_type: 'number' },
    { key: 'salary_divisor', value: '22', category: 'salary', description: 'Days to divide monthly salary (prevents division by zero)', data_type: 'number' },
  ];

  const stmt = conn.prepare(`
    INSERT OR IGNORE INTO formulas (key, value, category, description, data_type)
    VALUES (@key, @value, @category, @description, @data_type)
  `);

  for (const formula of formulas) {
    stmt.run(formula);
  }

  console.log('[HRIS-DB] Default formulas seeded');
}

// Seed failsafe account
export function seedFailsafeAccount(): void {
  const conn = getConnection();

  // Check if failsafe exists
  const existing = conn.prepare('SELECT id FROM employees WHERE username = ?').get('failsafe');
  
  if (!existing) {
    conn.prepare(`
      INSERT INTO employees (employee_id, name, username, status, role, password_hash, basic_salary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'FAILSAFE001',
      'System Failsafe',
      'failsafe',
      'Active',
      'DEV',
      // Hash for "Knightfall1939"
      '$2b$10$BgbBjZPc2g8Pu2tsrN7sPOjbLkVo.jReSoffidtc2EuMwPBjiFd5i',
      0
    );
    console.log('[HRIS-DB] Failsafe account created');
  } else {
    console.log('[HRIS-DB] Failsafe account already exists');
  }
}

// Nuclear reset - drops all data except failsafe
export function nuclearReset(): void {
  const conn = getConnection();
  
  console.log('[HRIS-DB] NUCLEAR RESET initiated...');

  // Delete all data from tables in correct order (respecting FK constraints)
  conn.exec(`
    DELETE FROM import_logs;
    DELETE FROM unmapped_punches;
    DELETE FROM employee_shifts;
    DELETE FROM payroll;
    DELETE FROM salary_advance_requests;
    DELETE FROM leave_requests;
    DELETE FROM ot_requests;
    DELETE FROM daily_attendance;
    DELETE FROM attendance_logs;
    DELETE FROM employees WHERE username != 'failsafe';
    DELETE FROM positions;
    DELETE FROM salary_grades;
    DELETE FROM areas;
    DELETE FROM shifts;
    DELETE FROM departments;
    DELETE FROM holidays;
  `);

  // Reset auto-increment counters
  conn.exec(`
    DELETE FROM sqlite_sequence WHERE name IN (
      'departments', 'positions', 'salary_grades', 'areas', 'shifts',
      'attendance_logs', 'daily_attendance', 'ot_requests', 'leave_requests',
      'salary_advance_requests', 'holidays', 'payroll', 'employee_shifts',
      'unmapped_punches', 'import_logs'
    );
  `);

  // Re-seed failsafe
  seedFailsafeAccount();
  
  console.log('[HRIS-DB] NUCLEAR RESET completed - database is clean');
}

// Initialize database (run on startup)
export function initializeDatabase(): void {
  runMigrations();
  seedFormulas();
  seedFailsafeAccount();
  console.log('[HRIS-DB] Database initialization complete');
}

// Get system status (counts)
export function getSystemStatus(): {
  departments: number;
  employees: number;
  attendance_logs: number;
  unmapped_punches: number;
  payroll_records: number;
  last_import: string | null;
} {
  const conn = getConnection();
  
  const counts = conn.prepare(`
    SELECT
      (SELECT COUNT(*) FROM departments) as departments,
      (SELECT COUNT(*) FROM employees WHERE username != 'failsafe') as employees,
      (SELECT COUNT(*) FROM attendance_logs) as attendance_logs,
      (SELECT COUNT(*) FROM unmapped_punches) as unmapped_punches,
      (SELECT COUNT(*) FROM payroll) as payroll_records,
      (SELECT MAX(created_at) FROM import_logs) as last_import
  `).get() as {
    departments: number;
    employees: number;
    attendance_logs: number;
    unmapped_punches: number;
    payroll_records: number;
    last_import: string | null;
  };

  return counts;
}

// Close database connection
export function closeConnection(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[HRIS-DB] Database connection closed');
  }
}
