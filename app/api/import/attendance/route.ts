import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, AttendanceRepository, EmployeeRepository } from '@/lib/db/models';
import { AttendanceLogSchema, validateWithErrors } from '@/lib/validation/schemas';

interface AttendanceRecord {
  employeeId: string;
  timestamp: string;
  state: number;
}

interface UnmappedPunch {
  employeeId: string;
  timestamp: string;
  state: number;
  reason: string;
  lineNumber: number;
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();
    const { records } = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No records provided' },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let errors = 0;
    const unmappedPunches: UnmappedPunch[] = [];
    const validationErrors: string[] = [];

    console.log(`[HRIS-IMPORT] Starting attendance import: ${records.length} records`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i] as AttendanceRecord;
      const lineNumber = i + 1;

      try {
        // Validate record format
        const validation = validateWithErrors(AttendanceLogSchema, {
          employee_idno: record.employeeId,
          timestamp: record.timestamp,
          state: record.state,
        });

        if (!validation.success) {
          console.warn(`[HRIS-IMPORT] Line ${lineNumber}: Validation failed - ${validation.errors.join(', ')}`);
          validationErrors.push(`Line ${lineNumber}: ${validation.errors.join(', ')}`);
          errors++;
          continue;
        }

        // Find employee by employee_id
        const employee = EmployeeRepository.findByEmployeeId(record.employeeId);
        
        if (!employee) {
          // Orphan log - employee doesn't exist
          console.warn(`[HRIS-IMPORT] Line ${lineNumber}: Unmapped punch - Employee ID ${record.employeeId} not found`);
          unmappedPunches.push({
            employeeId: record.employeeId,
            timestamp: record.timestamp,
            state: record.state,
            reason: `Employee ID ${record.employeeId} not found in system`,
            lineNumber,
          });
          errors++;
          continue;
        }

        // Parse the timestamp
        const [date, time] = record.timestamp.split(' ');
        
        if (!date || !time) {
          console.warn(`[HRIS-IMPORT] Line ${lineNumber}: Invalid timestamp format - ${record.timestamp}`);
          validationErrors.push(`Line ${lineNumber}: Invalid timestamp format`);
          errors++;
          continue;
        }

        console.log(`[HRIS-IMPORT] Line ${lineNumber}: Processing ${employee.name} (${record.employeeId}) - ${date} ${time} - State: ${record.state}`);

        // Create or update attendance record
        const existingAttendance = AttendanceRepository.findByEmployeeAndDate(employee.id, date);

        if (existingAttendance) {
          // Update existing record
          if (record.state === 0) {
            // Check in (state 0 is typically first punch of day)
            if (!existingAttendance.check_in || time < existingAttendance.check_in) {
              AttendanceRepository.update(existingAttendance.id, { check_in: time });
              console.log(`[HRIS-IMPORT] Line ${lineNumber}: Updated check-in for ${employee.name}`);
            }
          } else {
            // Check out (state 1 is typically last punch of day)
            if (!existingAttendance.check_out || time > existingAttendance.check_out) {
              AttendanceRepository.update(existingAttendance.id, { check_out: time });
              console.log(`[HRIS-IMPORT] Line ${lineNumber}: Updated check-out for ${employee.name}`);
            }
          }
          updated++;
        } else {
          // Create new record
          AttendanceRepository.create({
            employee_id: employee.id,
            date,
            check_in: record.state === 0 ? time : null,
            check_out: record.state === 1 ? time : null,
            status: 'Present',
          });
          console.log(`[HRIS-IMPORT] Line ${lineNumber}: Created new attendance record for ${employee.name}`);
          imported++;
        }
      } catch (err) {
        console.error(`[HRIS-IMPORT] Line ${lineNumber}: Error -`, err);
        validationErrors.push(`Line ${lineNumber}: Processing error - ${err instanceof Error ? err.message : 'Unknown error'}`);
        errors++;
      }
    }

    console.log(`[HRIS-IMPORT] Attendance import complete: ${imported} new, ${updated} updated, ${errors} errors, ${unmappedPunches.length} unmapped`);

    return NextResponse.json({
      success: true,
      imported,
      updated,
      errors,
      total: records.length,
      unmappedPunches,
      validationErrors: validationErrors.slice(0, 50), // Limit to first 50 errors
    });
  } catch (error) {
    console.error('[HRIS-IMPORT] Attendance import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import attendance data' },
      { status: 500 }
    );
  }
}
