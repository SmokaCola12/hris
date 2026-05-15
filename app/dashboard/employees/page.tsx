'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { EmployeeRepository, SalaryGradeRepository, ensureInitialized } from '@/lib/db/models';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, Plus, Eye, Edit, UserX, Users, UserCheck, AlertTriangle } from 'lucide-react';

export default function EmployeesPage() {
  ensureInitialized();
  
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'Employee',
    salary_grade_id: '',
    employee_id: '',
    username: '',
    tempPassword: '',
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);

  // Get all employees from database
  const allEmployees = useMemo(() => EmployeeRepository.findAll(), []);
  const salaryGrades = useMemo(() => SalaryGradeRepository.findAll(), []);

  // Get unique departments from employees
  const departments = useMemo(() => {
    const uniqueDepts = new Set(allEmployees.map(emp => emp.department_id || ''));
    return Array.from(uniqueDepts).filter(Boolean);
  }, [allEmployees]);

  // Filter employees based on privacy rules
  const getVisibleEmployees = () => {
    if (!user) return [];
    
    return allEmployees.filter(emp => {
      // DEV can see everyone
      if (user.role === 'DEV') return true;
      
      // CEO can see everyone except DEV
      if (user.role === 'CEO') return emp.role !== 'DEV';
      
      // Manager can see everyone except CEO and DEV
      if (user.role === 'Manager') return !['CEO', 'DEV'].includes(emp.role);
      
      // Admin cannot see Manager, CEO, or DEV (privacy rule)
      if (user.role === 'Admin') return !['Manager', 'CEO', 'DEV'].includes(emp.role);
      
      return false;
    });
  };

  const visibleEmployees = useMemo(() => getVisibleEmployees(), [allEmployees, user]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return visibleEmployees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      const matchesDept = departmentFilter === 'all' || emp.department_id === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [visibleEmployees, searchQuery, statusFilter, departmentFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Active: 'default',
      Resigned: 'secondary',
      AWOL: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getSalaryGradeName = (gradeId: number | null) => {
    if (!gradeId) return 'Not Set';
    const grade = salaryGrades.find(sg => sg.id === gradeId);
    return grade ? `${grade.grade_name} - PHP ${grade.amount}/${grade.frequency}` : 'Not Set';
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.employee_id) {
      toast.error('Name, email, and employee ID are required');
      return;
    }
    
    // Generate secure credentials
    const username = newEmployee.employee_id; // Default to Employee ID
    const tempPassword = generateSecurePassword();
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: newEmployee.employee_id,
          name: newEmployee.name,
          email: newEmployee.email,
          username,
          password: tempPassword,
          department: newEmployee.department,
          position: newEmployee.position,
          role: newEmployee.role,
          salary_grade_id: newEmployee.salary_grade_id,
        }),
      });

      if (!response.ok) throw new Error('Failed to add employee');
      
      setGeneratedCredentials({ username, password: tempPassword });
      toast.success(`Employee ${newEmployee.name} added successfully`);
      
      // Reset form after a delay to show credentials
      setTimeout(() => {
        setIsAddDialogOpen(false);
        setNewEmployee({
          name: '',
          email: '',
          department: '',
          position: '',
          role: 'Employee',
          salary_grade_id: '',
          employee_id: '',
          username: '',
          tempPassword: '',
        });
        setGeneratedCredentials(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to add employee');
      console.log('[v0] Error adding employee:', error);
    }
  };

  const generateSecurePassword = (): string => {
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    let password = '';
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const all = upperCase + lowerCase + numbers + special;
    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleChangeStatus = (employee: any) => {
    setSelectedEmployee(employee);
    setNewStatus(employee.status);
    setIsStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedEmployee || !newStatus) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Employee status updated to ${newStatus}`);
      setIsStatusDialogOpen(false);
      setSelectedEmployee(null);
      setNewStatus('');
    } catch (error) {
      toast.error('Failed to update status');
      console.log('[v0] Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    toast.success('Employee deleted successfully');
  };

  if (!user || !['Admin', 'CEO', 'DEV'].includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Employees" description="Manage employee records and information" />
      
      <div className="p-8 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Masterlist
              </CardTitle>
              <CardDescription>Total: {filteredEmployees.length} employees</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                  <SelectItem value="AWOL">AWOL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredEmployees.length === 0 ? (
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No employees found
              </TableCell>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Salary Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.picture} />
                              <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {employee.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{employee.email}</TableCell>
                        <TableCell>{employee.department || 'N/A'}</TableCell>
                        <TableCell>{employee.position || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{getSalaryGradeName(employee.salary_grade_id)}</TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewEmployee(employee);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEmployee(employee);
                              }}
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeStatus(employee);
                              }}
                              title="Change Status"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Employee Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEmployee.picture} />
                    <AvatarFallback>{selectedEmployee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{selectedEmployee.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedEmployee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="font-medium">{selectedEmployee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salary Grade</p>
                    <p className="font-medium">{getSalaryGradeName(selectedEmployee.salary_grade_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge variant="outline">{selectedEmployee.role}</Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                {generatedCredentials 
                  ? 'System access credentials have been generated. Save them securely.'
                  : 'Enter the details for the new employee'}
              </DialogDescription>
            </DialogHeader>
            {generatedCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-blue-900">Generated Credentials</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Username</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white border rounded font-mono text-sm">{generatedCredentials.username}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.username);
                            toast.success('Username copied');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Temporary Password</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white border rounded font-mono text-sm text-red-600">{generatedCredentials.password}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.password);
                            toast.success('Password copied');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Employee must change password on first login. These credentials cannot be recovered.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID *</Label>
                    <Input
                      id="employee_id"
                      value={newEmployee.employee_id}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                      placeholder="91939"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="john@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      placeholder="IT"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                      placeholder="Developer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newEmployee.role} 
                      onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setGeneratedCredentials(null);
              }}>
                {generatedCredentials ? 'Done' : 'Cancel'}
              </Button>
              {!generatedCredentials && (
                <Button onClick={handleAddEmployee}>
                  Add Employee
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update details for {selectedEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={selectedEmployee.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input defaultValue={selectedEmployee.email} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input defaultValue={selectedEmployee.department || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input defaultValue={selectedEmployee.position || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select defaultValue={selectedEmployee.role}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Salary Grade</Label>
                    <Select defaultValue={String(selectedEmployee.salary_grade_id || '')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top" align="center" className="max-h-40">
                        {salaryGrades.map((grade) => (
                          <SelectItem key={grade.id} value={String(grade.id)}>
                            {grade.grade_name} - {grade.amount}/{grade.frequency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success('Employee updated successfully');
                setIsEditDialogOpen(false);
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Change Employee Status
              </DialogTitle>
              <DialogDescription>
                Update the employment status for {selectedEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Resigned">Resigned</SelectItem>
                    <SelectItem value="AWOL">AWOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusChange} disabled={!newStatus}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
