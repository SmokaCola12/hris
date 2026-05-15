import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, EmployeeRepository, AttendanceRepository } from '@/lib/db/models';

interface ReportParams {
  start_date: string;
  end_date: string;
  department_id?: number;
  employee_id?: number;
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const departmentId = searchParams.get('department_id');
    const employeeId = searchParams.get('employee_id');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Get all employees
    let employees = EmployeeRepository.findAll().filter(e => e.employee_id !== 'FAILSAFE001');

    // Filter by department if specified
    if (departmentId) {
      employees = employees.filter(e => e.department_id === parseInt(departmentId));
    }

    // Filter by employee if specified
    if (employeeId) {
      employees = employees.filter(e => e.id === parseInt(employeeId));
    }

    // Generate attendance report for each employee
    const report = employees.map(employee => {
      const attendanceRecords = DailyAttendanceRepository.findByEmployeeAndDateRange(
        employee.id,
        startDate,
        endDate
      );

      const stats = {
        present: attendanceRecords.filter(a => a.status === 'Present').length,
        absent: attendanceRecords.filter(a => a.status === 'Absent').length,
        late: attendanceRecords.filter(a => a.status === 'Late').length,
        leave: attendanceRecords.filter(a => a.status === 'Leave').length,
        total_hours: attendanceRecords.reduce((sum, a) => sum + (a.total_hours || 0), 0),
        overtime_hours: attendanceRecords.reduce((sum, a) => sum + (a.overtime_minutes || 0) / 60, 0),
      };

      return {
        employee_id: employee.id,
        employee_name: employee.name,
        employee_idno: employee.employee_id,
        department_id: employee.department_id,
        stats,
        records: attendanceRecords,
      };
    });

    // Calculate summary statistics
    const summary = {
      total_employees: employees.length,
      total_present: report.reduce((sum, e) => sum + e.stats.present, 0),
      total_absent: report.reduce((sum, e) => sum + e.stats.absent, 0),
      total_late: report.reduce((sum, e) => sum + e.stats.late, 0),
      total_leave: report.reduce((sum, e) => sum + e.stats.leave, 0),
      total_hours: report.reduce((sum, e) => sum + e.stats.total_hours, 0),
      total_overtime: report.reduce((sum, e) => sum + e.stats.overtime_hours, 0),
    };

    return NextResponse.json({
      success: true,
      period: { start_date: startDate, end_date: endDate },
      summary,
      report,
    });
  } catch (error) {
    console.error('[HRIS] Attendance report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate attendance report' },
      { status: 500 }
    );
  }
}
