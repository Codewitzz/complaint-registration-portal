import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LogOut, 
  FileText, 
  Users, 
  Building2,
  Plus,
  UserPlus,
  Settings,
  Phone,
  Mail,
  RefreshCw,
  Bell
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface MainAdminDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function MainAdminDashboard({ accessToken, onLogout }: MainAdminDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showNewDept, setShowNewDept] = useState(false);
  const [showNewSubAdmin, setShowNewSubAdmin] = useState(false);
  const [showDeptInfo, setShowDeptInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickAssignComplaint, setQuickAssignComplaint] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);

  useEffect(() => {
    loadUserProfile();
    loadComplaints();
    loadDepartments();
    loadSubAdmins();

    // Set up auto-refresh every 10 seconds for live updates
    const refreshInterval = setInterval(() => {
      loadComplaintsInBackground();
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const loadComplaintsInBackground = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      const newComplaints = data.complaints || [];
      
      // Check if there are new complaints
      if (newComplaints.length > complaints.length) {
        setNewComplaintsCount(newComplaints.length - complaints.length);
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('CivicEase - New Complaint', {
            body: `${newComplaints.length - complaints.length} new complaint(s) registered!`,
            icon: '/favicon.ico'
          });
        }
      }
      
      setComplaints(newComplaints);
    } catch (error) {
      console.error('Failed to refresh complaints:', error);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setNewComplaintsCount(0);
    await loadComplaints();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/profile`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadComplaints = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      console.log('✅ Complaints loaded:', data.complaints?.length || 0, 'complaints');
      console.log('📋 Full response:', data);
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('❌ Failed to load complaints:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/departments`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadSubAdmins = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/subadmins`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setSubAdmins(data.subadmins || []);
    } catch (error) {
      console.error('Failed to load sub-admins:', error);
    }
  };

  const loadComplaintDetails = async (complaintId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${complaintId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setSelectedComplaint(data.complaint);
      setAssignment(data.assignment);
    } catch (error) {
      console.error('Failed to load complaint details:', error);
    }
  };

  const handleSetPriority = async (priority: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${selectedComplaint.id}/priority`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ priority })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Priority updated successfully!');
        loadComplaintDetails(selectedComplaint.id);
        loadComplaints();
      } else {
        alert(data.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      alert('Failed to update priority');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const subAdminId = formData.get('subAdminId') as string;

    const complaintToAssign = selectedComplaint || quickAssignComplaint;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${complaintToAssign.id}/assign-subadmin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ subAdminId })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Sub-admin assigned successfully!');
        setShowAssign(false);
        setSelectedComplaint(null);
        setQuickAssignComplaint(null);
        loadComplaints();
      } else {
        alert(data.error || 'Failed to assign sub-admin');
      }
    } catch (error) {
      console.error('Failed to assign sub-admin:', error);
      alert('Failed to assign sub-admin');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = (complaint: any) => {
    setQuickAssignComplaint(complaint);
    setShowAssign(true);
  };

  // Get sub-admins for specific department
  const getSubAdminsForDepartment = (departmentId: string) => {
    return subAdmins.filter(sa => sa.departmentId === departmentId);
  };

  const handleAddDepartment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const deptData = {
      name: formData.get('name'),
      customerCarePhone: formData.get('phone'),
      customerCareEmail: formData.get('email')
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/departments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(deptData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Department added successfully!');
        setShowNewDept(false);
        loadDepartments();
        (e.target as HTMLFormElement).reset();
      } else {
        alert(data.error || 'Failed to add department');
      }
    } catch (error) {
      console.error('Failed to add department:', error);
      alert('Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const subAdminData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone'),
      departmentId: formData.get('departmentId'),
      departmentName: departments.find(d => d.id === formData.get('departmentId'))?.name
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/auth/signup/subadmin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(subAdminData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Sub-admin created successfully!');
        setShowNewSubAdmin(false);
        loadSubAdmins();
        loadDepartments();
        (e.target as HTMLFormElement).reset();
      } else {
        alert(data.error || 'Failed to create sub-admin');
      }
    } catch (error) {
      console.error('Failed to create sub-admin:', error);
      alert('Failed to create sub-admin');
    } finally {
      setLoading(false);
    }
  };

  const pendingComplaints = complaints.filter(c => c.status === 'pending');
  const assignedComplaints = complaints.filter(c => 
    ['assigned_to_subadmin', 'assigned_to_contractor', 'in_progress'].includes(c.status)
  );
  const completedComplaints = complaints.filter(c => 
    ['completed', 'closed', 'closed_by_authority'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-xl">CivicEase - Main Admin</h1>
            <p className="text-sm text-blue-100">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleManualRefresh}
              variant="secondary" 
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`size-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {newComplaintsCount > 0 && (
              <div className="relative">
                <Button 
                  onClick={() => setNewComplaintsCount(0)}
                  variant="secondary" 
                  size="sm"
                  className="animate-pulse bg-green-500 hover:bg-green-600 text-white"
                >
                  <Bell className="size-4 mr-2" />
                  {newComplaintsCount} New!
                </Button>
              </div>
            )}
            <Button 
              onClick={() => setShowDeptInfo(true)} 
              variant="secondary" 
              size="sm"
            >
              <Building2 className="size-4 mr-2" />
              Departments
            </Button>
            <Button onClick={onLogout} variant="secondary" size="sm">
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{complaints.length}</p>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FileText className="size-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{assignedComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{completedComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="size-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{subAdmins.length}</p>
                  <p className="text-sm text-muted-foreground">Sub-Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowNewDept(true)}>
            <Plus className="size-4 mr-2" />
            Add Department
          </Button>
          <Button onClick={() => setShowNewSubAdmin(true)} variant="outline">
            <UserPlus className="size-4 mr-2" />
            Add Sub-Admin
          </Button>
        </div>

        {/* Complaints Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All Complaints
              {complaints.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{complaints.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Assignment
              {pendingComplaints.length > 0 && (
                <Badge className="ml-2 bg-yellow-600">{pendingComplaints.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending complaints</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingComplaints.map(complaint => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onViewDetails={() => loadComplaintDetails(complaint.id)}
                    showCitizen
                    onQuickAssign={() => handleQuickAssign(complaint)}
                    showAssignButton={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedComplaints.map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onViewDetails={() => loadComplaintDetails(complaint.id)}
                  showCitizen
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedComplaints.map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onViewDetails={() => loadComplaintDetails(complaint.id)}
                  showCitizen
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {complaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No complaints registered yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Citizens need to register complaints to see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Complaints:</strong> {complaints.length} | 
                    <strong className="ml-4">Pending:</strong> {pendingComplaints.length} | 
                    <strong className="ml-4">In Progress:</strong> {assignedComplaints.length} | 
                    <strong className="ml-4">Completed:</strong> {completedComplaints.length}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {complaints.map(complaint => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onViewDetails={() => loadComplaintDetails(complaint.id)}
                      showCitizen
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Complaint Details Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Complaint Details</span>
                  <Badge variant="outline" className="font-mono">
                    {selectedComplaint.token}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Citizen Information */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="size-4" />
                      Citizen Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{selectedComplaint.citizenName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedComplaint.citizenEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{selectedComplaint.citizenPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Registered On:</span>
                        <p className="font-medium">
                          {new Date(selectedComplaint.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Complaint Information */}
                <div>
                  <h4 className="font-medium mb-2 text-lg">{selectedComplaint.complaintType}</h4>
                  <Badge className="mb-3">
                    {selectedComplaint.departmentName || 
                     departments.find(d => d.id === selectedComplaint.departmentId)?.name || 
                     'Department N/A'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedComplaint.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{selectedComplaint.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="capitalize">
                        {selectedComplaint.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge 
                        variant={
                          selectedComplaint.priority === 'urgent' ? 'destructive' : 
                          selectedComplaint.priority === 'high' ? 'default' : 
                          'outline'
                        }
                        className="capitalize"
                      >
                        {selectedComplaint.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Complaint ID:</span>
                      <p className="font-medium font-mono text-xs">{selectedComplaint.id}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                {assignment && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Assignment Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {assignment.subAdminName && (
                          <div>
                            <span className="text-muted-foreground">Sub-Admin:</span>
                            <p className="font-medium">{assignment.subAdminName}</p>
                          </div>
                        )}
                        {assignment.contractorName && (
                          <div>
                            <span className="text-muted-foreground">Contractor:</span>
                            <p className="font-medium">{assignment.contractorName}</p>
                          </div>
                        )}
                        {assignment.assignedAt && (
                          <div>
                            <span className="text-muted-foreground">Assigned On:</span>
                            <p className="font-medium">
                              {new Date(assignment.assignedAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Priority Setting */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Label>Set Priority:</Label>
                  <div className="flex gap-2">
                    {['urgent', 'high', 'normal', 'low'].map(p => (
                      <Button
                        key={p}
                        size="sm"
                        variant={selectedComplaint.priority === p ? 'default' : 'outline'}
                        onClick={() => handleSetPriority(p)}
                        disabled={loading}
                        className="capitalize"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Progress Timeline</h4>
                  <TrackingTimeline 
                    timeline={selectedComplaint.timeline}
                    currentStatus={selectedComplaint.status}
                  />
                </div>

                {/* Assign Button */}
                {selectedComplaint.status === 'pending' && (
                  <Button 
                    onClick={() => setShowAssign(true)}
                    className="w-full"
                  >
                    <UserPlus className="size-4 mr-2" />
                    Assign to Sub-Admin
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Sub-Admin Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Sub-Admin</DialogTitle>
            <DialogDescription>
              Select a department sub-admin to handle this complaint
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignSubAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subAdminId">Sub-Admin / Department</Label>
              <Select name="subAdminId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose sub-admin" />
                </SelectTrigger>
                <SelectContent>
                  {subAdmins.map(subAdmin => (
                    <SelectItem key={subAdmin.id} value={subAdmin.id}>
                      {subAdmin.name} - {subAdmin.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAssign(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={showNewDept} onOpenChange={setShowNewDept}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department for complaint management
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDepartment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Waste Management Department"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Customer Care Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="1800-XXX-XXXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Customer Care Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="department@civicease.gov"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Adding...' : 'Add Department'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewDept(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Admin Dialog */}
      <Dialog open={showNewSubAdmin} onOpenChange={setShowNewSubAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sub-Admin</DialogTitle>
            <DialogDescription>
              Create a department head account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa-name">Full Name</Label>
              <Input
                id="sa-name"
                name="name"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sa-email">Email</Label>
                <Input
                  id="sa-email"
                  name="email"
                  type="email"
                  placeholder="subadmin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-phone">Phone</Label>
                <Input
                  id="sa-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sa-password">Password</Label>
              <Input
                id="sa-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select name="departmentId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create Sub-Admin'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewSubAdmin(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Departments Info Dialog */}
      <Dialog open={showDeptInfo} onOpenChange={setShowDeptInfo}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Departments & Customer Care</DialogTitle>
            <DialogDescription>
              View all departments and their contact information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {departments.map(dept => (
              <Card key={dept.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{dept.name}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="size-3" />
                          <span>{dept.customerCare?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="size-3" />
                          <span>{dept.customerCare?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {dept.subAdminName ? (
                      <Badge variant="secondary">
                        Head: {dept.subAdminName}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No Sub-Admin</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}