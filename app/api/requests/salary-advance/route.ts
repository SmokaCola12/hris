import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, SalaryAdvanceRepository, EmployeeRepository } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requests = SalaryAdvanceRepository.findAll();

    // Filter based on role
    if (user.role === 'Employee') {
      requests = requests.filter(r => r.employee_id === user.id);
    } else if (user.role === 'Manager') {
      const employees = EmployeeRepository.findAll();
      const teamIds = employees
        .filter(e => e.department_id === user.departmentId || e.id === user.id)
        .map(e => e.id);
      requests = requests.filter(r => teamIds.includes(r.employee_id));
    }

    // Enrich with employee info
    const enrichedRequests = requests.map(req => {
      const employee = EmployeeRepository.findById(req.employee_id);
      return {
        ...req,
        employeeName: employee?.name || 'Unknown',
        employeeIdStr: employee?.employee_id || 'N/A',
      };
    });

    return NextResponse.json({
      success: true,
      requests: enrichedRequests,
    });
  } catch (error) {
    console.error('[HRIS] Get salary advance requests error:', error);
    return NextResponse.json({ error: 'Failed to retrieve salary advance requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, reason, repayment_months } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const newRequest = SalaryAdvanceRepository.create({
      employee_id: user.id,
      amount,
      reason: reason || null,
      repayment_months: repayment_months || 1,
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
    });
  } catch (error) {
    console.error('[HRIS] Create salary advance request error:', error);
    return NextResponse.json({ error: 'Failed to create salary advance request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['Manager', 'Admin', 'CEO', 'DEV'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    if (status === 'Rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const updated = SalaryAdvanceRepository.update(id, updateData);

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (error) {
    console.error('[HRIS] Update salary advance request error:', error);
    return NextResponse.json({ error: 'Failed to update salary advance request' }, { status: 500 });
  }
}
