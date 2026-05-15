'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Download, Eye, CreditCard, Printer } from 'lucide-react';

// No initial payslips - generated only after payroll processing
const mockPayslips: any[] = [];

export default function PayslipsPage() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPayslip, setSelectedPayslip] = useState<typeof mockPayslips[0] | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="My Payslips"
        description="View and download your payroll history"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Latest Net Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(mockPayslips[0]?.netPay || 0)}
              </div>
              <p className="text-xs text-muted-foreground">{mockPayslips[0]?.period}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">YTD Gross Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(mockPayslips.reduce((sum, p) => sum + p.grossPay, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Year to date</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">YTD Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(mockPayslips.reduce((sum, p) => sum + p.totalDeductions, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Year to date</p>
            </CardContent>
          </Card>
        </div>

        {/* Payslips Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll History</CardTitle>
                <CardDescription>View your past payslips</CardDescription>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">{payslip.period}</TableCell>
                    <TableCell>{formatCurrency(payslip.grossPay)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(payslip.totalDeductions)}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(payslip.netPay)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{payslip.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPayslip(payslip)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payslip Detail Modal */}
        <Dialog open={!!selectedPayslip} onOpenChange={() => setSelectedPayslip(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payslip - {selectedPayslip?.period}
              </DialogTitle>
            </DialogHeader>
            {selectedPayslip && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employee Name</p>
                    <p className="font-medium">Sarah Wilson</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-medium">5</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pay Period</p>
                    <p className="font-medium">{selectedPayslip.period}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Days Worked</p>
                    <p className="font-medium">{selectedPayslip.daysWorked} days</p>
                  </div>
                </div>

                <Separator />

                {/* Earnings */}
                <div>
                  <h4 className="font-semibold mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Basic Pay</span>
                      <span>{formatCurrency(selectedPayslip.earnings.basicPay)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overtime Pay</span>
                      <span>{formatCurrency(selectedPayslip.earnings.overtime)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Holiday Pay</span>
                      <span>{formatCurrency(selectedPayslip.earnings.holidayPay)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allowances</span>
                      <span>{formatCurrency(selectedPayslip.earnings.allowances)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Gross Pay</span>
                      <span>{formatCurrency(selectedPayslip.grossPay)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deductions */}
                <div>
                  <h4 className="font-semibold mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SSS</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.sss)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>PhilHealth</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.philhealth)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pag-IBIG</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.pagibig)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.tax)}</span>
                    </div>
                    {selectedPayslip.deductions.late > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Late Deduction</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.late)}</span>
                      </div>
                    )}
                    {selectedPayslip.deductions.salaryAdvance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Salary Advance</span>
                        <span className="text-red-600">-{formatCurrency(selectedPayslip.deductions.salaryAdvance)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Deductions</span>
                      <span className="text-red-600">-{formatCurrency(selectedPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Net Pay */}
                <div className="flex justify-between items-center p-4 bg-muted">
                  <span className="text-lg font-bold">NET PAY</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedPayslip.netPay)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
