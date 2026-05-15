import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, EmployeeRepository, DepartmentRepository } from '@/lib/db/models';
import { hashPassword } from '@/lib/auth';

interface CreateEmployeeRequest {
  employee_id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  department?: string;
  position?: string;
  role?: string;
  salary_grade_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const { employee_id, name, email, username, password, department, position, role, salary_grade_id } = await request.json() as CreateEmployeeRequest;

    // Validate required fields
    if (!employee_id || !name || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if employee already exists
    const existing = EmployeeRepository.findByEmployeeId(employee_id);
    if (existing) {
      return NextResponse.json(
        { error: 'Employee with this ID already exists' },
        { status: 409 }
      );
    }

    // Find or create department
    let departmentId = null;
    if (department) {
      let dept = DepartmentRepository.findByName(department);
      if (!dept) {
        dept = DepartmentRepository.create({
          name: department,
          code: department.substring(0, 3).toUpperCase(),
          description: null,
        });
      }
      departmentId = dept.id;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create employee
    const employee = EmployeeRepository.create({
      employee_id,
      name,
      username,
      email: email || null,
      phone: null,
      picture: null,
      department_id: departmentId,
      position_id: position ? parseInt(position) : null,
      area_id: null,
      status: 'Active',
      role: (role || 'Employee') as any,
      password_hash: passwordHash,
      basic_salary: 0,
      hire_date: new Date().toISOString().split('T')[0],
    });

    console.log('[HRIS] Employee created manually:', employee.id);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        username: employee.username,
        email: employee.email,
      },
    });
  } catch (error) {
    console.error('[HRIS] Create employee error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const employees = EmployeeRepository.findAll();

    return NextResponse.json({
      employees: employees.map(e => ({
        id: e.id,
        employee_id: e.employee_id,
        name: e.name,
        email: e.email,
        department_id: e.department_id,
        status: e.status,
        role: e.role,
      })),
    });
  } catch (error) {
    console.error('[HRIS] Get employees error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
