import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, EmployeeRepository } from '@/lib/db/models';
import { createToken, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const trimmedUsername = username?.trim().toLowerCase();

    if (!trimmedUsername || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check database accounts
    ensureInitialized();
    const employee = EmployeeRepository.findByUsername(trimmedUsername);

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (employee.status !== 'Active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    let isValidPassword = false;
    if (employee.password_hash) {
      try {
        isValidPassword = await verifyPassword(password, employee.password_hash);
      } catch (error) {
        console.error('[HRIS] Password verification error:', error);
        isValidPassword = false;
      }
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = {
      id: employee.id,
      employeeId: employee.employee_id,
      name: employee.name,
      username: employee.username,
      email: employee.email,
      role: employee.role,
      departmentId: employee.department_id,
      positionId: employee.position_id,
      picture: employee.picture,
    };

    const token = createToken(user);

    const response = NextResponse.json({
      success: true,
      user,
    });

    response.cookies.set('hris_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[HRIS] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
