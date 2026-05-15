'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Clock, Moon, Sun } from 'lucide-react';

// No shifts until configured by DEV
const mockShifts: any[] = [];

interface ShiftFormData {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  isNightShift: boolean;
  isActive: boolean;
}

const initialFormData: ShiftFormData = {
  name: '',
  code: '',
  startTime: '08:00',
  endTime: '17:00',
  breakMinutes: '60',
  isNightShift: false,
  isActive: true,
};

export default function ShiftsPage() {
  const [shifts, setShifts] = useState(mockShifts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<typeof mockShifts[0] | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>(initialFormData);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const calculateWorkHours = (start: string, end: string, breakMins: number) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let startMins = startH * 60 + startM;
    let endMins = endH * 60 + endM;
    
    // Handle night shift (end time is next day)
    if (endMins < startMins) {
      endMins += 24 * 60;
    }
    
    const totalMins = endMins - startMins - breakMins;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingShift) {
      setShifts(shifts.map(s => 
        s.id === editingShift.id 
          ? { 
              ...s, 
              name: formData.name,
              code: formData.code,
              startTime: formData.startTime,
              endTime: formData.endTime,
              breakMinutes: parseInt(formData.breakMinutes),
              isNightShift: formData.isNightShift,
              isActive: formData.isActive,
            }
          : s
      ));
      toast.success('Shift updated successfully');
    } else {
      const newShift = {
        id: Math.max(...shifts.map(s => s.id)) + 1,
        name: formData.name,
        code: formData.code,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakMinutes: parseInt(formData.breakMinutes),
        isNightShift: formData.isNightShift,
        isActive: formData.isActive,
      };
      setShifts([...shifts, newShift]);
      toast.success('Shift created successfully');
    }
    
    setIsDialogOpen(false);
    setEditingShift(null);
    setFormData(initialFormData);
  };

  const handleEdit = (shift: typeof mockShifts[0]) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes.toString(),
      isNightShift: shift.isNightShift,
      isActive: shift.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setShifts(shifts.filter(s => s.id !== id));
    toast.success('Shift deleted successfully');
    setIsDeleting(null);
  };

  const handleToggleActive = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setShifts(shifts.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
    toast.success('Shift status updated');
  };

  const activeShifts = shifts.filter(s => s.isActive);
  const inactiveShifts = shifts.filter(s => !s.isActive);

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="Shift Management"
        description="Configure work shifts and schedules"
      />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeShifts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Day Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.filter(s => !s.isNightShift).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Night Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.filter(s => s.isNightShift).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Work Shifts</CardTitle>
                <CardDescription>Manage employee work schedules</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingShift(null);
                  setFormData(initialFormData);
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Shift
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
                    <DialogDescription>
                      {editingShift ? 'Update shift details' : 'Create a new work shift'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Shift Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Morning Shift"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., AM"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
                      <Input
                        id="breakMinutes"
                        type="number"
                        min="0"
                        max="120"
                        value={formData.breakMinutes}
                        onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isNightShift"
                          checked={formData.isNightShift}
                          onCheckedChange={(checked) => setFormData({ ...formData, isNightShift: checked })}
                        />
                        <Label htmlFor="isNightShift" className="flex items-center gap-1">
                          <Moon className="h-4 w-4" />
                          Night Shift
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Work Hours: <span className="font-medium text-foreground">
                          {calculateWorkHours(formData.startTime, formData.endTime, parseInt(formData.breakMinutes) || 0)}
                        </span>
                      </p>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingShift ? 'Update' : 'Create'} Shift
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id} className={!shift.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{shift.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{shift.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      {calculateWorkHours(shift.startTime, shift.endTime, shift.breakMinutes)}
                    </TableCell>
                    <TableCell>{shift.breakMinutes} min</TableCell>
                    <TableCell>
                      {shift.isNightShift ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Moon className="h-3 w-3" />
                          Night
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Sun className="h-3 w-3" />
                          Day
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={shift.isActive}
                        onCheckedChange={() => handleToggleActive(shift.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(shift)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(shift.id)}
                          disabled={isDeleting === shift.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {shifts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No shifts configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
