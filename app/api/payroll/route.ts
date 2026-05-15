import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, PayrollRepository, EmployeeRepository, AttendanceRepository, OTRequestRepository, LeaveRequestRepository, SalaryAdvanceRepository, FormulaRepository, SalaryGradeRepository, DepartmentRepository } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth';

// Helper function to calculate payroll for an employee
function calculatePayrollForEmployee(
  employeeId: number,
  periodStart: string,
  periodEnd: string,
  formulas: Record<string, number>
) {
  const employee = EmployeeRepository.findById(employeeId);
  if (!employee) return null;

  // Get salary grade
  const salaryGrade = employee.salary_grade_id 
    ? SalaryGradeRepository.findById(employee.salary_grade_id)
    : null;
  
  const monthlySalary = salaryGrade?.basic_salary || 20000;
  const dailyRate = monthlySalary / (formulas['workDaysPerMonth'] || 22);
  const hourlyRate = dailyRate / (formulas['workHoursPerDay'] || 8);

  // Get attendance records for the period
  const allAttendance = AttendanceRepository.findByEmployeeId(employeeId);
  const periodAttendance = allAttendance.filter(a => {
    const date = new Date(a.date);
    return date >= new Date(periodStart) && date <= new Date(periodEnd);
  });

  // Calculate days worked and late minutes
  let daysWorked = 0;
  let totalLateMinutes = 0;
  let totalUndertimeMinutes = 0;

  periodAttendance.forEach(att => {
    if (att.status === 'Present' || att.status === 'Late') {
      daysWorked++;
    }
    totalLateMinutes += att.late_minutes || 0;
    totalUndertimeMinutes += att.undertime_minutes || 0;
  });

  // Get approved OT hours for the period
  const otRequests = OTRequestRepository.findAll().filter(ot => 
    ot.employee_id === employeeId &&
    ot.status === 'Approved' &&
    new Date(ot.ot_date) >= new Date(periodStart) &&
    new Date(ot.ot_date) <= new Date(periodEnd)
  );
  const totalOTHours = otRequests.reduce((sum, ot) => sum + ot.hours, 0);

  // Get approved leave days
  const leaveRequests = LeaveRequestRepository.findAll().filter(leave =>
    leave.employee_id === employeeId &&
    leave.status === 'Approved' &&
    new Date(leave.start_date) >= new Date(periodStart) &&
    new Date(leave.end_date) <= new Date(periodEnd)
  );
  const totalLeaveDays = leaveRequests.reduce((sum, leave) => sum + leave.days, 0);

  // Get salary advances for deduction
  const salaryAdvances = SalaryAdvanceRepository.findAll().filter(adv =>
    adv.employee_id === employeeId &&
    adv.status === 'Approved'
  );
  const totalAdvanceDeduction = salaryAdvances.reduce((sum, adv) => sum + (adv.amount / (adv.repayment_months || 1)), 0);

  // Calculate earnings
  const basicPay = daysWorked * dailyRate;
  const otRate = formulas['otRateMultiplier'] || 1.25;
  const otPay = totalOTHours * hourlyRate * otRate;

  // Calculate allowances from salary grade
  const allowances = salaryGrade ? (
    (salaryGrade.food_allowance || 0) +
    (salaryGrade.transportation_allowance || 0) +
    (salaryGrade.communication_allowance || 0) +
    (salaryGrade.housing_allowance || 0)
  ) : 0;

  const grossPay = basicPay + otPay + allowances;

  // Calculate deductions
  const lateDeductionRate = formulas['lateDeductionPerMinute'] || 5;
  const lateDeduction = totalLateMinutes * lateDeductionRate;
  const undertimeDeduction = totalUndertimeMinutes * (hourlyRate / 60);

  // Government deductions (simplified)
  const sssRate = formulas['sssRate'] || 0.045;
  const philhealthRate = formulas['philhealthRate'] || 0.025;
  const pagibigRate = formulas['pagibigRate'] || 100; // Fixed amount
  const taxRate = formulas['taxRate'] || 0.20;

  const sss = grossPay * sssRate;
  const philhealth = grossPay * philhealthRate;
  const pagibig = pagibigRate;
  const taxableIncome = grossPay - sss - philhealth - pagibig;
  const tax = taxableIncome > 20833 ? (taxableIncome - 20833) * taxRate : 0;

  const totalDeductions = sss + philhealth + pagibig + tax + lateDeduction + undertimeDeduction + totalAdvanceDeduction;
  const netPay = grossPay - totalDeductions;

  return {
    employee_id: employeeId,
    period_start: periodStart,
    period_end: periodEnd,
    days_worked: daysWorked,
    ot_hours: totalOTHours,
    late_minutes: totalLateMinutes,
    undertime_minutes: totalUndertimeMinutes,
    basic_pay: Math.round(basicPay * 100) / 100,
    ot_pay: Math.round(otPay * 100) / 100,
    allowances: Math.round(allowances * 100) / 100,
    gross_pay: Math.round(grossPay * 100) / 100,
    sss: Math.round(sss * 100) / 100,
    philhealth: Math.round(philhealth * 100) / 100,
    pagibig: Math.round(pagibig * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    late_deduction: Math.round(lateDeduction * 100) / 100,
    undertime_deduction: Math.round(undertimeDeduction * 100) / 100,
    advance_deduction: Math.round(totalAdvanceDeduction * 100) / 100,
    total_deductions: Math.round(totalDeductions * 100) / 100,
    net_pay: Math.round(netPay * 100) / 100,
    status: 'Draft',
  };
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('period_start');
    const periodEnd = searchParams.get('period_end');

    let payrolls = PayrollRepository.findAll();

    // Filter by period if provided
    if (periodStart && periodEnd) {
      payrolls = payrolls.filter(p => p.period_start === periodStart && p.period_end === periodEnd);
    }

    // Filter based on role
    if (user.role === 'Employee') {
      payrolls = payrolls.filter(p => p.employee_id === user.id);
    } else if (user.role === 'Manager') {
      const employees = EmployeeRepository.findAll();
      const teamIds = employees
        .filter(e => e.department_id === user.departmentId || e.id === user.id)
        .map(e => e.id);
      payrolls = payrolls.filter(p => teamIds.includes(p.employee_id));
    }

    // Enrich with employee info
    const enrichedPayrolls = payrolls.map(p => {
      const employee = EmployeeRepository.findById(p.employee_id);
      const department = employee?.department_id ? DepartmentRepository.findById(employee.department_id) : null;
      return {
        ...p,
        employeeName: employee?.name || 'Unknown',
        employeeIdStr: employee?.employee_id || 'N/A',
        departmentName: department?.name || 'N/A',
      };
    });

    return NextResponse.json({
      success: true,
      payrolls: enrichedPayrolls,
    });
  } catch (error) {
    console.error('[HRIS] Get payroll error:', error);
    return NextResponse.json({ error: 'Failed to retrieve payroll' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin, CEO, DEV can generate payroll
    if (!['Admin', 'CEO', 'DEV'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { period_start, period_end } = body;

    if (!period_start || !period_end) {
      return NextResponse.json({ error: 'Period start and end are required' }, { status: 400 });
    }

    // Get all active employees
    const employees = EmployeeRepository.findAll().filter(e => e.status === 'Active');

    // Get formulas
    const formulaRecords = FormulaRepository.findAll();
    const formulas: Record<string, number> = {};
    formulaRecords.forEach(f => {
      formulas[f.key] = f.value;
    });

    // Generate payroll for each employee
    const generatedPayrolls = [];
    for (const employee of employees) {
      // Check if payroll already exists for this period
      const existingPayroll = PayrollRepository.findByPeriod(period_start, period_end)
        .find(p => p.employee_id === employee.id);
      
      if (existingPayroll) {
        // Update existing
        const payrollData = calculatePayrollForEmployee(employee.id, period_start, period_end, formulas);
        if (payrollData) {
          const updated = PayrollRepository.update(existingPayroll.id, payrollData);
          if (updated) generatedPayrolls.push(updated);
        }
      } else {
        // Create new
        const payrollData = calculatePayrollForEmployee(employee.id, period_start, period_end, formulas);
        if (payrollData) {
          const created = PayrollRepository.create(payrollData);
          generatedPayrolls.push(created);
        }
      }
    }

    console.log('[HRIS] Generated payroll for', generatedPayrolls.length, 'employees');

    return NextResponse.json({
      success: true,
      message: `Generated payroll for ${generatedPayrolls.length} employees`,
      count: generatedPayrolls.length,
    });
  } catch (error) {
    console.error('[HRIS] Generate payroll error:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admin, CEO, DEV can release payroll
    if (!['Admin', 'CEO', 'DEV'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: 'IDs array and status are required' }, { status: 400 });
    }

    let updatedCount = 0;
    for (const id of ids) {
      const updated = PayrollRepository.update(id, { status });
      if (updated) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} payroll records`,
      count: updatedCount,
    });
  } catch (error) {
    console.error('[HRIS] Update payroll error:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}
