import { FormulaRepository, AttendanceRepository } from '@/lib/db/models';
import { safeDivide, getSafeSalaryDivisor } from '@/lib/validation/schemas';

interface Employee {
  id: number;
  basic_salary: number;
}

interface PayrollCalculationInput {
  employee: Employee;
  period_start: string;
  period_end: string;
}

interface PayrollCalculationOutput {
  employee_id: number;
  period_start: string;
  period_end: string;
  basic_salary: number;
  days_worked: number;
  regular_hours: number;
  overtime_hours: number;
  overtime_pay: number;
  holiday_pay: number;
  allowances: number;
  gross_pay: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  tax_deduction: number;
  salary_advance_deduction: number;
  late_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
}

// Safe formula value retrieval with fallback
function getFormulaValue(key: string, fallback: number = 0): number {
  try {
    const formula = FormulaRepository.findByKey(key);
    if (!formula) {
      console.warn(`[HRIS-PAYROLL] Formula '${key}' not found, using fallback: ${fallback}`);
      return fallback;
    }
    const value = parseFloat(formula.value);
    if (isNaN(value) || !isFinite(value)) {
      console.warn(`[HRIS-PAYROLL] Formula '${key}' has invalid value: ${formula.value}, using fallback: ${fallback}`);
      return fallback;
    }
    return value;
  } catch (error) {
    console.error(`[HRIS-PAYROLL] Error getting formula '${key}':`, error);
    return fallback;
  }
}

export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationOutput {
  const { employee, period_start, period_end } = input;

  console.log(`[HRIS-PAYROLL] Calculating payroll for employee ${employee.id}: ${period_start} to ${period_end}`);

  // Get attendance records for the period
  let attendanceRecords: { status: string; total_hours: number; overtime_minutes: number; late_minutes: number }[] = [];
  try {
    attendanceRecords = AttendanceRepository.findByEmployeeAndPeriod(employee.id, period_start, period_end);
  } catch (error) {
    console.error(`[HRIS-PAYROLL] Error fetching attendance for employee ${employee.id}:`, error);
    attendanceRecords = [];
  }

  // Calculate days worked and overtime with safe math
  let daysWorked = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let totalLateMinutes = 0;

  for (const record of attendanceRecords) {
    if (record.status === 'Present' || record.status === 'Late') {
      daysWorked += 1;
      const recordOTHours = safeDivide(record.overtime_minutes || 0, 60, 0);
      regularHours += Math.max(0, (record.total_hours || 0) - recordOTHours);
      overtimeHours += recordOTHours;
      totalLateMinutes += record.late_minutes || 0;
    }
  }

  // Get salary information with safe defaults
  const basicSalary = Math.max(0, employee.basic_salary || 0);
  
  // CRITICAL: Prevent division by zero for salary divisor
  const workingDaysPerMonth = getSafeSalaryDivisor(getFormulaValue('working_days_per_month', 22));
  const workingHoursPerDay = getFormulaValue('working_hours_per_day', 8) || 8;
  
  // Calculate daily and hourly rates with safe division
  const dailyRate = safeDivide(basicSalary, workingDaysPerMonth, 0);
  const hourlyRate = safeDivide(dailyRate, workingHoursPerDay, 0);

  console.log(`[HRIS-PAYROLL] Basic: ${basicSalary}, Days/Mo: ${workingDaysPerMonth}, Daily: ${dailyRate}, Hourly: ${hourlyRate}`);

  // Calculate overtime pay with safe math
  const otMultiplier = getFormulaValue('ot_multiplier_regular', 1.25);
  const overtimePay = overtimeHours * hourlyRate * otMultiplier;

  // Calculate late deductions
  const lateDeductionPerMinute = getFormulaValue('late_deduction_per_minute', 0);
  const lateDeduction = totalLateMinutes * lateDeductionPerMinute;

  // Deduction rates (percentage - convert to decimal)
  const sssRate = safeDivide(getFormulaValue('sss_rate', 4.5), 100, 0.045);
  const philhealthRate = safeDivide(getFormulaValue('philhealth_rate', 2.0), 100, 0.02);
  const pagibigRate = safeDivide(getFormulaValue('pagibig_rate', 2.0), 100, 0.02);

  // Calculate gross pay
  const grossPay = basicSalary + overtimePay;
  
  // Calculate deductions
  const sssDeduction = basicSalary * sssRate;
  const philhealthDeduction = basicSalary * philhealthRate;
  const pagibigDeduction = basicSalary * pagibigRate;

  // Simplified tax calculation (13% of taxable income after deductions)
  const taxableIncome = Math.max(0, basicSalary - sssDeduction - philhealthDeduction - pagibigDeduction);
  const taxDeduction = taxableIncome * 0.13;

  // Total deductions
  const totalDeductions = sssDeduction + philhealthDeduction + pagibigDeduction + taxDeduction + lateDeduction;

  // Net pay (cannot be negative)
  const netPay = Math.max(0, grossPay - totalDeductions);

  console.log(`[HRIS-PAYROLL] Result: Gross=${grossPay.toFixed(2)}, Deductions=${totalDeductions.toFixed(2)}, Net=${netPay.toFixed(2)}`);

  return {
    employee_id: employee.id,
    period_start,
    period_end,
    basic_salary: basicSalary,
    days_worked: daysWorked,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    overtime_pay: overtimePay,
    holiday_pay: 0,
    allowances: 0,
    gross_pay: grossPay,
    sss_deduction: sssDeduction,
    philhealth_deduction: philhealthDeduction,
    pagibig_deduction: pagibigDeduction,
    tax_deduction: taxDeduction,
    salary_advance_deduction: 0,
    late_deduction: lateDeduction,
    other_deductions: 0,
    total_deductions: totalDeductions,
    net_pay: netPay,
  };
}
