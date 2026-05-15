import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, LeaveRequestRepository, OTRequestRepository, SalaryAdvanceRepository } from '@/lib/db/models';

interface ApprovalRecord {
  request_type: 'leave' | 'ot' | 'salary_advance';
  request_id: number;
  action: 'approve' | 'reject';
  remarks?: string;
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const { request_type, request_id, action, remarks } = await request.json() as ApprovalRecord;

    // In production, verify approver role via JWT
    const now = new Date().toISOString();

    let result;
    if (request_type === 'leave') {
      const leaveRequest = LeaveRequestRepository.findById(request_id);
      if (!leaveRequest) {
        return NextResponse.json(
          { error: 'Leave request not found' },
          { status: 404 }
        );
      }
      result = LeaveRequestRepository.update(request_id, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        approval_date: now,
        remarks: remarks || null,
      });
    } else if (request_type === 'ot') {
      const otRequest = OTRequestRepository.findById(request_id);
      if (!otRequest) {
        return NextResponse.json(
          { error: 'OT request not found' },
          { status: 404 }
        );
      }
      result = OTRequestRepository.update(request_id, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        approval_date: now,
        remarks: remarks || null,
      });
    } else if (request_type === 'salary_advance') {
      const advanceRequest = SalaryAdvanceRepository.findById(request_id);
      if (!advanceRequest) {
        return NextResponse.json(
          { error: 'Salary advance request not found' },
          { status: 404 }
        );
      }
      result = SalaryAdvanceRepository.update(request_id, {
        status: action === 'approve' ? 'Approved' : 'Rejected',
        approval_date: now,
        remarks: remarks || null,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    console.log(`[HRIS] Request ${request_type}/${request_id} ${action}ed`);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[HRIS] Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();
    
    // Get all pending requests across all types
    const leaveRequests = LeaveRequestRepository.findByStatus('Pending');
    const otRequests = OTRequestRepository.findByStatus('Pending');
    const advanceRequests = SalaryAdvanceRepository.findByStatus('Pending');

    return NextResponse.json({
      pending: {
        leave: leaveRequests,
        ot: otRequests,
        salary_advance: advanceRequests,
      },
      total: leaveRequests.length + otRequests.length + advanceRequests.length,
    });
  } catch (error) {
    console.error('[HRIS] Get pending requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending requests' },
      { status: 500 }
    );
  }
}
