import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/config';

export async function POST() {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Preserve failsafe account before clearing
    const failsafeAccount = {
      id: 1,
      employee_id: 'FAILSAFE001',
      name: 'System Failsafe',
      username: 'failsafe',
      email: null,
      phone: null,
      picture: null,
      department_id: null,
      position_id: null,
      area_id: null,
      status: 'Active' as const,
      role: 'DEV' as const,
      // Hash for "Knightfall1939" - generated with bcryptjs (verified working)
      password_hash: '$2b$10$BgbBjZPc2g8Pu2tsrN7sPOjbLkVo.jReSoffidtc2EuMwPBjiFd5i',
      basic_salary: 0,
      hire_date: null,
      created_at: now,
      updated_at: now,
    };

    // Clear all data tables except employees (will reset with failsafe only)
    db.employees = [failsafeAccount];
    db.departments = [];
    db.positions = [];
    db.salary_grades = [];
    db.areas = [];
    db.shifts = [];
    db.attendance_logs = [];
    db.daily_attendance = [];
    db.ot_requests = [];
    db.leave_requests = [];
    db.salary_advance_requests = [];
    db.holidays = [];
    db.payroll = [];
    db.employee_shifts = [];

    console.log('[HRIS] System reset completed - failsafe account preserved');

    return NextResponse.json({
      success: true,
      message: 'System has been reset to fresh state. Failsafe account is ready.',
      failsafeUsername: 'failsafe',
    });
  } catch (error) {
    console.error('[HRIS] Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset system' },
      { status: 500 }
    );
  }
}
