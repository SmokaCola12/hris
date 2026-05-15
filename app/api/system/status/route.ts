import { NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/db/models';
import { getDatabase } from '@/lib/db/config';

export async function GET() {
  try {
    ensureInitialized();
    const db = getDatabase();

    return NextResponse.json({
      departmentsLoaded: db.departments.length,
      employeesLoaded: db.employees.length,
      attendanceLogsLoaded: db.attendance_logs.length,
      totalData: db.employees.length + db.departments.length + db.attendance_logs.length,
    });
  } catch (error) {
    console.error('[HRIS] Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
