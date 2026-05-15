import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, EmployeeRepository, PayrollRepository } from '@/lib/db/models';
import { calculatePayroll } from '@/lib/payroll/calculator';

interface PayrollBatchRequest {
  period_start: string;
  period_end: string;
  employee_ids?: number[];
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const { period_start, period_end, employee_ids } = await request.json() as PayrollBatchRequest;

    if (!period_start || !period_end) {
      return NextResponse.json(
        { error: 'Missing period dates' },
        { status: 400 }
      );
    }

    // Get employees to process
    const allEmployees = EmployeeRepository.findAll();
    const employees = employee_ids && employee_ids.length > 0
      ? allEmployees.filter(e => employee_ids.includes(e.id))
      : allEmployees.filter(e => e.employee_id !== 'FAILSAFE001'); // Exclude failsafe

    const now = new Date().toISOString();
    const payrollBatch = [];
    let processed = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        // Calculate payroll for employee
        const calculation = calculatePayroll({
          employee,
          period_start,
          period_end,
        });

        // Create payroll record
        const payroll = PayrollRepository.create({
          employee_id: employee.id,
          period_start,
          period_end,
          basic_salary: calculation.basic_salary,
          days_worked: calculation.days_worked,
          regular_hours: calculation.regular_hours,
          overtime_hours: calculation.overtime_hours,
          overtime_pay: calculation.overtime_pay,
          holiday_pay: calculation.holiday_pay,
          allowances: calculation.allowances,
          gross_pay: calculation.gross_pay,
          sss_deduction: calculation.sss_deduction,
          philhealth_deduction: calculation.philhealth_deduction,
          pagibig_deduction: calculation.pagibig_deduction,
          tax_deduction: calculation.tax_deduction,
          salary_advance_deduction: calculation.salary_advance_deduction,
          other_deductions: calculation.other_deductions,
          total_deductions: calculation.total_deductions,
          net_pay: calculation.net_pay,
          status: 'Draft',
        });

        payrollBatch.push(payroll);
        processed++;
      } catch (err) {
        console.error(`[HRIS] Error calculating payroll for employee ${employee.id}:`, err);
        errors++;
      }
    }

    console.log(`[HRIS] Payroll batch generated: ${processed} records, ${errors} errors`);

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: employees.length,
      batch: payrollBatch,
    });
  } catch (error) {
    console.error('[HRIS] Payroll generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payroll' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const { searchParams } = new URL(request.url);
    const periodStart = searchParams.get('period_start');
    const periodEnd = searchParams.get('period_end');

    let payrolls = PayrollRepository.findAll();

    if (periodStart && periodEnd) {
      payrolls = payrolls.filter(
        p => p.period_start >= periodStart && p.period_end <= periodEnd
      );
    }

    return NextResponse.json({
      payrolls,
      count: payrolls.length,
    });
  } catch (error) {
    console.error('[HRIS] Get payroll error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll' },
      { status: 500 }
    );
  }
}
