import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, LeaveRequestRepository, EmployeeRepository } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requests = LeaveRequestRepository.findAll();

    // Filter based on role
    if (user.role === 'Employee') {
      // Employees can only see their own requests
      requests = requests.filter(r => r.employee_id === user.id);
    } else if (user.role === 'Manager') {
      // Managers can see their team's requests + their own
      const employees = EmployeeRepository.findAll();
      const teamIds = employees
        .filter(e => e.department_id === user.departmentId || e.id === user.id)
        .map(e => e.id);
      requests = requests.filter(r => teamIds.includes(r.employee_id));
    }
    // Admin, CEO, DEV can see all

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
    console.error('[HRIS] Get leave requests error:', error);
    return NextResponse.json({ error: 'Failed to retrieve leave requests' }, { status: 500 });
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
    const { leave_type, start_date, end_date, days, reason } = body;

    if (!leave_type || !start_date || !end_date || !days) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = LeaveRequestRepository.create({
      employee_id: user.id,
      leave_type,
      start_date,
      end_date,
      days,
      reason: reason || null,
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
    });
  } catch (error) {
    console.error('[HRIS] Create leave request error:', error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureInitialized();
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Manager, Admin, CEO, DEV can approve/reject
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

    const updated = LeaveRequestRepository.update(id, updateData);

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      request: updated,
    });
  } catch (error) {
    console.error('[HRIS] Update leave request error:', error);
    return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
  }
}
