import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, PayrollRepository, EmployeeRepository } from '@/lib/db/models';

interface PayslipRequest {
  payroll_id: number;
  format?: 'json' | 'pdf';
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const { payroll_id, format = 'json' } = await request.json() as PayslipRequest;

    const payroll = PayrollRepository.findById(payroll_id);
    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    const employee = EmployeeRepository.findById(payroll.employee_id);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Generate payslip data structure
    const payslipData = {
      payroll_id: payroll.id,
      employee_id: employee.id,
      employee_name: employee.name,
      employee_idno: employee.employee_id,
      position: employee.position_id ? `Position ${employee.position_id}` : 'N/A',
      period: `${payroll.period_start} to ${payroll.period_end}`,
      generated_date: new Date().toISOString().split('T')[0],
      earnings: {
        basic_salary: payroll.basic_salary,
        overtime_pay: payroll.overtime_pay,
        holiday_pay: payroll.holiday_pay,
        allowances: payroll.allowances,
        gross_pay: payroll.gross_pay,
      },
      deductions: {
        sss: payroll.sss_deduction,
        philhealth: payroll.philhealth_deduction,
        pagibig: payroll.pagibig_deduction,
        tax: payroll.tax_deduction,
        salary_advance: payroll.salary_advance_deduction,
        other: payroll.other_deductions,
        total: payroll.total_deductions,
      },
      summary: {
        gross_pay: payroll.gross_pay,
        total_deductions: payroll.total_deductions,
        net_pay: payroll.net_pay,
      },
    };

    if (format === 'pdf') {
      // For PDF generation, return HTML that can be converted to PDF on client side
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
            .amount { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payslip</h1>
            <p>Period: ${payslipData.period}</p>
          </div>
          
          <div class="section">
            <h3>Employee Information</h3>
            <p>Name: ${payslipData.employee_name}</p>
            <p>Employee ID: ${payslipData.employee_idno}</p>
            <p>Position: ${payslipData.position}</p>
          </div>

          <div class="section">
            <h3>Earnings</h3>
            <table>
              <tr><td>Basic Salary</td><td class="amount">₱${payslipData.earnings.basic_salary.toFixed(2)}</td></tr>
              <tr><td>Overtime Pay</td><td class="amount">₱${payslipData.earnings.overtime_pay.toFixed(2)}</td></tr>
              <tr><td>Holiday Pay</td><td class="amount">₱${payslipData.earnings.holiday_pay.toFixed(2)}</td></tr>
              <tr><td>Allowances</td><td class="amount">₱${payslipData.earnings.allowances.toFixed(2)}</td></tr>
              <tr class="total"><td>Gross Pay</td><td class="amount">₱${payslipData.earnings.gross_pay.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>Deductions</h3>
            <table>
              <tr><td>SSS</td><td class="amount">₱${payslipData.deductions.sss.toFixed(2)}</td></tr>
              <tr><td>PhilHealth</td><td class="amount">₱${payslipData.deductions.philhealth.toFixed(2)}</td></tr>
              <tr><td>Pag-IBIG</td><td class="amount">₱${payslipData.deductions.pagibig.toFixed(2)}</td></tr>
              <tr><td>Tax</td><td class="amount">₱${payslipData.deductions.tax.toFixed(2)}</td></tr>
              <tr><td>Salary Advance</td><td class="amount">₱${payslipData.deductions.salary_advance.toFixed(2)}</td></tr>
              <tr><td>Other</td><td class="amount">₱${payslipData.deductions.other.toFixed(2)}</td></tr>
              <tr class="total"><td>Total Deductions</td><td class="amount">₱${payslipData.deductions.total.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>Summary</h3>
            <table>
              <tr><td>Gross Pay</td><td class="amount">₱${payslipData.summary.gross_pay.toFixed(2)}</td></tr>
              <tr><td>Total Deductions</td><td class="amount">₱${payslipData.summary.total_deductions.toFixed(2)}</td></tr>
              <tr class="total"><td>Net Pay</td><td class="amount">₱${payslipData.summary.net_pay.toFixed(2)}</td></tr>
            </table>
          </div>

          <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
            Generated on: ${payslipData.generated_date}
          </p>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="payslip-${employee.employee_id}-${payroll.period_start}.html"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payslip: payslipData,
    });
  } catch (error) {
    console.error('[HRIS] Payslip generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslip' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const { searchParams } = new URL(request.url);
    const payrollId = searchParams.get('payroll_id');

    if (!payrollId) {
      return NextResponse.json(
        { error: 'payroll_id required' },
        { status: 400 }
      );
    }

    const payroll = PayrollRepository.findById(parseInt(payrollId));
    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    const employee = EmployeeRepository.findById(payroll.employee_id);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const payslipData = {
      payroll_id: payroll.id,
      employee_name: employee.name,
      employee_idno: employee.employee_id,
      period: `${payroll.period_start} to ${payroll.period_end}`,
      gross_pay: payroll.gross_pay,
      total_deductions: payroll.total_deductions,
      net_pay: payroll.net_pay,
    };

    return NextResponse.json({
      payslip: payslipData,
    });
  } catch (error) {
    console.error('[HRIS] Get payslip error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payslip' },
      { status: 500 }
    );
  }
}
