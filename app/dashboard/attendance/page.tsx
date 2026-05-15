'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

// No attendance data until imported from ZKTeco files
const mockAttendance: any[] = [];

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return <Badge variant="default">Present</Badge>;
      case 'Late':
        return <Badge variant="destructive">Late</Badge>;
      case 'Absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'On-leave':
        return <Badge variant="secondary">On Leave</Badge>;
      case 'Weekend':
        return <Badge variant="outline">Weekend</Badge>;
      case 'Holiday':
        return <Badge variant="outline">Holiday</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate summary
  const summary = {
    present: mockAttendance.filter(a => a.status === 'Present').length,
    late: mockAttendance.filter(a => a.status === 'Late').length,
    absent: mockAttendance.filter(a => a.status === 'Absent').length,
    leave: mockAttendance.filter(a => a.status === 'On-leave').length,
    totalLateMinutes: mockAttendance.reduce((sum, a) => sum + a.late, 0),
    totalOvertimeMinutes: mockAttendance.reduce((sum, a) => sum + a.overtime, 0),
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="My Attendance"
        description="View your attendance records and time logs"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.present}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Late Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.late}</div>
              <p className="text-xs text-muted-foreground">{summary.totalLateMinutes} total minutes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Leaves Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.leave}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(summary.totalOvertimeMinutes / 60)}h {summary.totalOvertimeMinutes % 60}m
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Your daily time in/out logs</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[120px] text-center">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Late (min)</TableHead>
                    <TableHead>OT (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendance.map((record) => (
                    <TableRow key={record.date}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{format(new Date(record.date), 'EEEE')}</TableCell>
                      <TableCell>
                        {record.checkIn ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.checkIn}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.checkOut}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className={record.late > 0 ? 'text-red-600' : ''}>
                        {record.late > 0 ? record.late : '-'}
                      </TableCell>
                      <TableCell className={record.overtime > 0 ? 'text-blue-600' : ''}>
                        {record.overtime > 0 ? record.overtime : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {daysInMonth.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const record = mockAttendance.find(a => a.date === dateStr);
                  const weekend = isWeekend(date);
                  
                  return (
                    <div
                      key={dateStr}
                      className={`p-2 border border-border min-h-[60px] ${
                        weekend ? 'bg-muted/50' : ''
                      } ${record?.status === 'Present' ? 'bg-green-50 dark:bg-green-950' : ''} ${
                        record?.status === 'Late' ? 'bg-red-50 dark:bg-red-950' : ''
                      } ${record?.status === 'On-leave' ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                    >
                      <div className="text-sm font-medium">{format(date, 'd')}</div>
                      {record && record.checkIn && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {record.checkIn}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
