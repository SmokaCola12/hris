// HRIS Database Models and Repositories
// Re-exports types from config and provides repository access

import {
  getDatabase,
  initializeDatabase,
  getNextId,
  Employee,
  Department,
  Position,
  Area,
  Shift,
  AttendanceLog,
  DailyAttendance,
  OTRequest,
  LeaveRequest,
  SalaryAdvanceRequest,
  Holiday,
  Formula,
  Payroll,
  EmployeeShift,
  SalaryGrade,
} from './config';

export type {
  Employee,
  Department,
  Position,
  Area,
  Shift,
  AttendanceLog,
  DailyAttendance,
  OTRequest,
  LeaveRequest,
  SalaryAdvanceRequest,
  Holiday,
  Formula,
  Payroll,
  EmployeeShift,
  SalaryGrade,
};

// Ensure database is initialized
export function ensureInitialized() {
  initializeDatabase();
}

// Employee Repository
export const EmployeeRepository = {
  findAll(): Employee[] {
    return getDatabase().employees;
  },

  findById(id: number): Employee | undefined {
    return getDatabase().employees.find(e => e.id === id);
  },

  findByUsername(username: string): Employee | undefined {
    const lowerUsername = username.toLowerCase();
    return getDatabase().employees.find(e => e.username?.toLowerCase() === lowerUsername);
  },

  findByEmail(email: string): Employee | undefined {
    const lowerEmail = email.toLowerCase();
    return getDatabase().employees.find(e => e.email?.toLowerCase() === lowerEmail);
  },

  findByEmployeeId(employeeId: string): Employee | undefined {
    return getDatabase().employees.find(e => e.employee_id === employeeId);
  },

  create(data: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Employee {
    const db = getDatabase();
    const now = new Date().toISOString();
    const employee: Employee = {
      ...data,
      id: getNextId(db.employees),
      created_at: now,
      updated_at: now,
    };
    db.employees.push(employee);
    return employee;
  },

  update(id: number, data: Partial<Employee>): Employee | undefined {
    const db = getDatabase();
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    
    db.employees[index] = {
      ...db.employees[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.employees[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    db.employees.splice(index, 1);
    return true;
  },
};

// Department Repository
export const DepartmentRepository = {
  findAll(): Department[] {
    return getDatabase().departments;
  },

  findById(id: number): Department | undefined {
    return getDatabase().departments.find(d => d.id === id);
  },

  findByName(name: string): Department | undefined {
    return getDatabase().departments.find(d => d.name.toLowerCase() === name.toLowerCase());
  },

  create(data: Omit<Department, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Department {
    const db = getDatabase();
    const now = new Date().toISOString();
    const department: Department = {
      ...data,
      id: getNextId(db.departments),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.departments.push(department);
    return department;
  },

  update(id: number, data: Partial<Department>): Department | undefined {
    const db = getDatabase();
    const index = db.departments.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    
    db.departments[index] = {
      ...db.departments[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.departments[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.departments.findIndex(d => d.id === id);
    if (index === -1) return false;
    db.departments.splice(index, 1);
    return true;
  },
};

// Position Repository
export const PositionRepository = {
  findAll(): Position[] {
    return getDatabase().positions;
  },

  findById(id: number): Position | undefined {
    return getDatabase().positions.find(p => p.id === id);
  },

  create(data: Omit<Position, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Position {
    const db = getDatabase();
    const now = new Date().toISOString();
    const position: Position = {
      ...data,
      id: getNextId(db.positions),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.positions.push(position);
    return position;
  },

  update(id: number, data: Partial<Position>): Position | undefined {
    const db = getDatabase();
    const index = db.positions.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    db.positions[index] = {
      ...db.positions[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.positions[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.positions.findIndex(p => p.id === id);
    if (index === -1) return false;
    db.positions.splice(index, 1);
    return true;
  },
};

// Salary Grade Repository
export const SalaryGradeRepository = {
  findAll(): SalaryGrade[] {
    return getDatabase().salary_grades;
  },

  findById(id: number): SalaryGrade | undefined {
    return getDatabase().salary_grades.find(sg => sg.id === id);
  },

  create(data: Omit<SalaryGrade, 'id' | 'is_active' | 'created_at' | 'updated_at'>): SalaryGrade {
    const db = getDatabase();
    const now = new Date().toISOString();
    const salaryGrade: SalaryGrade = {
      ...data,
      id: getNextId(db.salary_grades),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.salary_grades.push(salaryGrade);
    return salaryGrade;
  },

  update(id: number, data: Partial<SalaryGrade>): SalaryGrade | undefined {
    const db = getDatabase();
    const index = db.salary_grades.findIndex(sg => sg.id === id);
    if (index === -1) return undefined;
    
    db.salary_grades[index] = {
      ...db.salary_grades[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.salary_grades[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.salary_grades.findIndex(sg => sg.id === id);
    if (index === -1) return false;
    db.salary_grades.splice(index, 1);
    return true;
  },
};

// Area Repository
export const AreaRepository = {
  findAll(): Area[] {
    return getDatabase().areas;
  },

  findById(id: number): Area | undefined {
    return getDatabase().areas.find(a => a.id === id);
  },

  create(data: Omit<Area, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Area {
    const db = getDatabase();
    const now = new Date().toISOString();
    const area: Area = {
      ...data,
      id: getNextId(db.areas),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.areas.push(area);
    return area;
  },

  update(id: number, data: Partial<Area>): Area | undefined {
    const db = getDatabase();
    const index = db.areas.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    db.areas[index] = {
      ...db.areas[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.areas[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.areas.findIndex(a => a.id === id);
    if (index === -1) return false;
    db.areas.splice(index, 1);
    return true;
  },
};

// Shift Repository
export const ShiftRepository = {
  findAll(): Shift[] {
    return getDatabase().shifts;
  },

  findById(id: number): Shift | undefined {
    return getDatabase().shifts.find(s => s.id === id);
  },

  create(data: Omit<Shift, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Shift {
    const db = getDatabase();
    const now = new Date().toISOString();
    const shift: Shift = {
      ...data,
      id: getNextId(db.shifts),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.shifts.push(shift);
    return shift;
  },

  update(id: number, data: Partial<Shift>): Shift | undefined {
    const db = getDatabase();
    const index = db.shifts.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    db.shifts[index] = {
      ...db.shifts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.shifts[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.shifts.findIndex(s => s.id === id);
    if (index === -1) return false;
    db.shifts.splice(index, 1);
    return true;
  },
};

// Attendance Repository (for daily_attendance)
export const AttendanceRepository = {
  findAll(): DailyAttendance[] {
    return getDatabase().daily_attendance;
  },

  findByEmployeeId(employeeId: number): DailyAttendance[] {
    return getDatabase().daily_attendance.filter(a => a.employee_id === employeeId);
  },

  findByDate(date: string): DailyAttendance[] {
    return getDatabase().daily_attendance.filter(a => a.date === date);
  },

  findByEmployeeAndDate(employeeId: number, date: string): DailyAttendance | undefined {
    return getDatabase().daily_attendance.find(
      a => a.employee_id === employeeId && a.date === date
    );
  },

  findByEmployeeAndDateRange(employeeId: number, startDate: string, endDate: string): DailyAttendance[] {
    return getDatabase().daily_attendance.filter(
      a => a.employee_id === employeeId && a.date >= startDate && a.date <= endDate
    );
  },

  findById(id: number): DailyAttendance | undefined {
    return getDatabase().daily_attendance.find(a => a.id === id);
  },

  create(data: { 
    employee_id: number; 
    date: string; 
    check_in: string | null; 
    check_out: string | null;
    status: string;
  }): DailyAttendance {
    const db = getDatabase();
    const now = new Date().toISOString();
    const attendance: DailyAttendance = {
      id: getNextId(db.daily_attendance),
      employee_id: data.employee_id,
      date: data.date,
      time_in: data.check_in,
      time_out: data.check_out,
      shift_id: null,
      scheduled_in: null,
      scheduled_out: null,
      late_minutes: 0,
      early_out_minutes: 0,
      overtime_minutes: 0,
      undertime_minutes: 0,
      total_hours: 0,
      status: data.status as DailyAttendance['status'],
      remarks: null,
      created_at: now,
      updated_at: now,
    };
    db.daily_attendance.push(attendance);
    return attendance;
  },

  update(id: number, data: Partial<{ check_in: string; check_out: string }>): DailyAttendance | undefined {
    const db = getDatabase();
    const index = db.daily_attendance.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    if (data.check_in) db.daily_attendance[index].time_in = data.check_in;
    if (data.check_out) db.daily_attendance[index].time_out = data.check_out;
    db.daily_attendance[index].updated_at = new Date().toISOString();
    
    return db.daily_attendance[index];
  },
};

// OT Request Repository
export const OTRequestRepository = {
  findAll(): OTRequest[] {
    return getDatabase().ot_requests;
  },

  findByEmployeeId(employeeId: number): OTRequest[] {
    return getDatabase().ot_requests.filter(r => r.employee_id === employeeId);
  },

  findByStatus(status: string): OTRequest[] {
    return getDatabase().ot_requests.filter(r => r.status === status);
  },

  findById(id: number): OTRequest | undefined {
    return getDatabase().ot_requests.find(r => r.id === id);
  },

  create(data: Omit<OTRequest, 'id' | 'status' | 'approved_by' | 'approved_at' | 'rejection_reason' | 'created_at' | 'updated_at'>): OTRequest {
    const db = getDatabase();
    const now = new Date().toISOString();
    const request: OTRequest = {
      ...data,
      id: getNextId(db.ot_requests),
      status: 'Pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    };
    db.ot_requests.push(request);
    return request;
  },

  update(id: number, data: Partial<OTRequest>): OTRequest | undefined {
    const db = getDatabase();
    const index = db.ot_requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    db.ot_requests[index] = {
      ...db.ot_requests[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.ot_requests[index];
  },
};

// Leave Request Repository
export const LeaveRequestRepository = {
  findAll(): LeaveRequest[] {
    return getDatabase().leave_requests;
  },

  findByEmployeeId(employeeId: number): LeaveRequest[] {
    return getDatabase().leave_requests.filter(r => r.employee_id === employeeId);
  },

  findByStatus(status: string): LeaveRequest[] {
    return getDatabase().leave_requests.filter(r => r.status === status);
  },

  findById(id: number): LeaveRequest | undefined {
    return getDatabase().leave_requests.find(r => r.id === id);
  },

  create(data: Omit<LeaveRequest, 'id' | 'status' | 'approved_by' | 'approved_at' | 'rejection_reason' | 'created_at' | 'updated_at'>): LeaveRequest {
    const db = getDatabase();
    const now = new Date().toISOString();
    const request: LeaveRequest = {
      ...data,
      id: getNextId(db.leave_requests),
      status: 'Pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    };
    db.leave_requests.push(request);
    return request;
  },

  update(id: number, data: Partial<LeaveRequest>): LeaveRequest | undefined {
    const db = getDatabase();
    const index = db.leave_requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    db.leave_requests[index] = {
      ...db.leave_requests[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.leave_requests[index];
  },
};

// Salary Advance Repository
export const SalaryAdvanceRepository = {
  findAll(): SalaryAdvanceRequest[] {
    return getDatabase().salary_advance_requests;
  },

  findByEmployeeId(employeeId: number): SalaryAdvanceRequest[] {
    return getDatabase().salary_advance_requests.filter(r => r.employee_id === employeeId);
  },

  findByStatus(status: string): SalaryAdvanceRequest[] {
    return getDatabase().salary_advance_requests.filter(r => r.status === status);
  },

  findById(id: number): SalaryAdvanceRequest | undefined {
    return getDatabase().salary_advance_requests.find(r => r.id === id);
  },

  create(data: Omit<SalaryAdvanceRequest, 'id' | 'status' | 'approved_by' | 'approved_at' | 'rejection_reason' | 'created_at' | 'updated_at'>): SalaryAdvanceRequest {
    const db = getDatabase();
    const now = new Date().toISOString();
    const request: SalaryAdvanceRequest = {
      ...data,
      id: getNextId(db.salary_advance_requests),
      status: 'Pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    };
    db.salary_advance_requests.push(request);
    return request;
  },

  update(id: number, data: Partial<SalaryAdvanceRequest>): SalaryAdvanceRequest | undefined {
    const db = getDatabase();
    const index = db.salary_advance_requests.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    db.salary_advance_requests[index] = {
      ...db.salary_advance_requests[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.salary_advance_requests[index];
  },
};

// Holiday Repository
export const HolidayRepository = {
  findAll(): Holiday[] {
    return getDatabase().holidays;
  },

  findById(id: number): Holiday | undefined {
    return getDatabase().holidays.find(h => h.id === id);
  },

  findByDate(date: string): Holiday | undefined {
    return getDatabase().holidays.find(h => h.date === date);
  },

  create(data: Omit<Holiday, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Holiday {
    const db = getDatabase();
    const now = new Date().toISOString();
    const holiday: Holiday = {
      ...data,
      id: getNextId(db.holidays),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.holidays.push(holiday);
    return holiday;
  },

  update(id: number, data: Partial<Holiday>): Holiday | undefined {
    const db = getDatabase();
    const index = db.holidays.findIndex(h => h.id === id);
    if (index === -1) return undefined;
    
    db.holidays[index] = {
      ...db.holidays[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.holidays[index];
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const index = db.holidays.findIndex(h => h.id === id);
    if (index === -1) return false;
    db.holidays.splice(index, 1);
    return true;
  },
};

// Formula Repository
export const FormulaRepository = {
  findAll(): Formula[] {
    return getDatabase().formulas;
  },

  findById(id: number): Formula | undefined {
    return getDatabase().formulas.find(f => f.id === id);
  },

  findByKey(key: string): Formula | undefined {
    return getDatabase().formulas.find(f => f.key === key);
  },

  findByCategory(category: string): Formula[] {
    return getDatabase().formulas.filter(f => f.category === category);
  },

  update(id: number, data: Partial<Formula>): Formula | undefined {
    const db = getDatabase();
    const index = db.formulas.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    
    db.formulas[index] = {
      ...db.formulas[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.formulas[index];
  },

  getValue(key: string): string | undefined {
    const formula = this.findByKey(key);
    return formula?.value;
  },

  getNumericValue(key: string): number {
    const value = this.getValue(key);
    return value ? parseFloat(value) : 0;
  },
};

// Payroll Repository
export const PayrollRepository = {
  findAll(): Payroll[] {
    return getDatabase().payroll;
  },

  findByEmployeeId(employeeId: number): Payroll[] {
    return getDatabase().payroll.filter(p => p.employee_id === employeeId);
  },

  findByPeriod(periodStart: string, periodEnd: string): Payroll[] {
    return getDatabase().payroll.filter(
      p => p.period_start === periodStart && p.period_end === periodEnd
    );
  },

  findById(id: number): Payroll | undefined {
    return getDatabase().payroll.find(p => p.id === id);
  },

  create(data: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>): Payroll {
    const db = getDatabase();
    const now = new Date().toISOString();
    const payroll: Payroll = {
      ...data,
      id: getNextId(db.payroll),
      created_at: now,
      updated_at: now,
    };
    db.payroll.push(payroll);
    return payroll;
  },

  update(id: number, data: Partial<Payroll>): Payroll | undefined {
    const db = getDatabase();
    const index = db.payroll.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    db.payroll[index] = {
      ...db.payroll[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.payroll[index];
  },
};

// Attendance Log Repository
export const AttendanceLogRepository = {
  findAll(): AttendanceLog[] {
    return getDatabase().attendance_logs;
  },

  findByEmployeeId(employeeId: number): AttendanceLog[] {
    return getDatabase().attendance_logs.filter(log => log.employee_id === employeeId);
  },

  findById(id: number): AttendanceLog | undefined {
    return getDatabase().attendance_logs.find(log => log.id === id);
  },

  create(data: Omit<AttendanceLog, 'id' | 'created_at'>): AttendanceLog {
    const db = getDatabase();
    const log: AttendanceLog = {
      ...data,
      id: getNextId(db.attendance_logs),
      created_at: new Date().toISOString(),
    };
    db.attendance_logs.push(log);
    return log;
  },
};

// Employee Shift Repository
export const EmployeeShiftRepository = {
  findAll(): EmployeeShift[] {
    return getDatabase().employee_shifts;
  },

  findByEmployeeId(employeeId: number): EmployeeShift[] {
    return getDatabase().employee_shifts.filter(es => es.employee_id === employeeId);
  },

  findActiveByEmployeeId(employeeId: number): EmployeeShift | undefined {
    return getDatabase().employee_shifts.find(
      es => es.employee_id === employeeId && es.is_active
    );
  },

  create(data: Omit<EmployeeShift, 'id' | 'is_active' | 'created_at' | 'updated_at'>): EmployeeShift {
    const db = getDatabase();
    const now = new Date().toISOString();
    const employeeShift: EmployeeShift = {
      ...data,
      id: getNextId(db.employee_shifts),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    db.employee_shifts.push(employeeShift);
    return employeeShift;
  },

  update(id: number, data: Partial<EmployeeShift>): EmployeeShift | undefined {
    const db = getDatabase();
    const index = db.employee_shifts.findIndex(es => es.id === id);
    if (index === -1) return undefined;
    
    db.employee_shifts[index] = {
      ...db.employee_shifts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return db.employee_shifts[index];
  },
};
