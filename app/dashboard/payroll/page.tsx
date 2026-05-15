'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calculator, Download, Send, Eye, CreditCard, Printer, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const payPeriods = [
  { value: '2026-05-01', label: 'May 2026' },
  { value: '2026-04-01', label: 'April 2026' },
  { value: '2026-03-01', label: 'March 2026' },
];

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-05-01');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'generate' | 'release' | null>(null);

  // Fetch payroll data for selected period
  const { data: payrollData = [], isLoading, mutate } = useSWR(
    `/api/payroll?period=${selectedPeriod}`,
    fetcher
  );

  // Ensure payrollData is always an array
  const payrollList = Array.isArray(payrollData) ? payrollData : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'Processed':
        return <Badge variant="secondary">Processed</Badge>;
      case 'Released':
        return <Badge variant="default">Released</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(payrollList.map(p => p.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, id]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(e => e !== id));
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      if (!response.ok) throw new Error('Failed to generate payroll');
      toast.success('Payroll generated successfully');
      mutate();
    } catch (error) {
      toast.error('Failed to generate payroll');
    } finally {
      setIsGenerating(false);
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const handleReleasePayroll = async () => {
    try {
      setIsReleasing(true);
      const response = await fetch('/api/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEmployees, action: 'release' }),
      });
      if (!response.ok) throw new Error('Failed to release payroll');
      toast.success('Payroll released successfully');
      mutate();
      setSelectedEmployees([]);
    } catch (error) {
      toast.error('Failed to release payroll');
    } finally {
      setIsReleasing(false);
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const openConfirmDialog = (action: 'generate' | 'release') => {
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  // Stats
  const totalGross = payrollList.reduce((sum, p) => sum + (p.gross_pay || 0), 0);
  const totalDeductions = payrollList.reduce((sum, p) => sum + (p.total_deductions || 0), 0);
  const totalNet = payrollList.reduce((sum, p) => sum + (p.net_pay || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Payroll Management"
        description="Generate and manage employee payroll"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollList.length}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalGross)}</div>
              <p className="text-xs text-muted-foreground">Before deductions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
              <p className="text-xs text-muted-foreground">All deductions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</div>
              <p className="text-xs text-muted-foreground">To be released</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll</CardTitle>
                <CardDescription>Review and process employee payroll</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payPeriods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => openConfirmDialog('generate')}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Generate Payroll
                </Button>
                <Button
                  onClick={() => openConfirmDialog('release')}
                  disabled={selectedEmployees.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Release Selected ({selectedEmployees.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmployees.length === payrollList.length && payrollList.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Days Worked</TableHead>
                  <TableHead>Late (min)</TableHead>
                  <TableHead>OT (hrs)</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading payroll data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payrollList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
                      No payroll data. Click &quot;Generate Payroll&quot; to create payroll for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollList.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(payroll.id)}
                          onCheckedChange={(checked) => handleSelectEmployee(payroll.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payroll.employee?.name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">ID: {payroll.employee?.employee_id || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payroll.employee?.department?.name || '-'}</TableCell>
                      <TableCell>{payroll.days_worked || 0}</TableCell>
                      <TableCell className={payroll.late_deduction_minutes > 0 ? 'text-red-600' : ''}>
                        {payroll.late_deduction_minutes > 0 ? payroll.late_deduction_minutes : '-'}
                      </TableCell>
                      <TableCell className={payroll.ot_hours > 0 ? 'text-blue-600' : ''}>
                        {payroll.ot_hours > 0 ? payroll.ot_hours.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(payroll.gross_pay)}</TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(payroll.total_deductions)}</TableCell>
                      <TableCell className="font-bold text-green-600">{formatCurrency(payroll.net_pay)}</TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => downloadPayslip(payroll.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Confirm Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmAction === 'generate' ? 'Generate Payroll' : 'Release Payroll'}
              </DialogTitle>
              <DialogDescription>
                {confirmAction === 'generate'
                  ? 'This will calculate payroll for all employees based on their attendance records and the current formula settings.'
                  : `This will release payroll for ${selectedEmployees.length} selected employee(s). This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted">
              <p className="text-sm font-medium">Pay Period: {payPeriods.find(p => p.value === selectedPeriod)?.label}</p>
              {confirmAction === 'release' && (
                <p className="text-sm mt-2">
                  Total Net Pay: <span className="font-bold text-green-600">
                    {formatCurrency(mockPayrollData.filter(p => selectedEmployees.includes(p.id)).reduce((sum, p) => sum + p.netPay, 0))}
                  </span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAction === 'generate' ? handleGeneratePayroll : handleReleasePayroll}
                disabled={isGenerating || isReleasing}
              >
                {isGenerating || isReleasing ? 'Processing...' : confirmAction === 'generate' ? 'Generate' : 'Release'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  function downloadPayslip(payrollId: string) {
    // Trigger download of payslip PDF
    window.open(`/api/payroll/${payrollId}/payslip`, '_blank');
  }
}
