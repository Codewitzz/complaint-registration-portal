import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LogOut, 
  FileText, 
  Clock, 
  CheckCircle,
  UserPlus,
  Phone
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
import { LocationMap } from './LocationMap';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SubAdminDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function SubAdminDashboard({ accessToken, onLogout }: SubAdminDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadComplaints();
    loadContractors();
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
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    }
  };

  const loadContractors = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/contractors`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setContractors(data.contractors || []);
    } catch (error) {
      console.error('Failed to load contractors:', error);
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

  const handleAssignContractor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const assignmentData = {
      contractorId: formData.get('contractorId'),
      estimatedFees: formData.get('estimatedFees'),
      estimatedTime: formData.get('estimatedTime'),
      description: formData.get('description')
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${selectedComplaint.id}/assign-contractor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(assignmentData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Contractor assigned successfully!');
        setShowAssign(false);
        setSelectedComplaint(null);
        loadComplaints();
      } else {
        alert(data.error || 'Failed to assign contractor');
      }
    } catch (error) {
      console.error('Failed to assign contractor:', error);
      alert('Failed to assign contractor');
    } finally {
      setLoading(false);
    }
  };

  const newComplaints = complaints.filter(c => c.status === 'assigned_to_subadmin');
  const assignedComplaints = complaints.filter(c => 
    ['assigned_to_contractor', 'in_progress'].includes(c.status)
  );
  const completedComplaints = complaints.filter(c => 
    ['completed', 'closed', 'closed_by_authority'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">CivicEase - Sub-Admin Portal</h1>
            <p className="text-sm text-muted-foreground">
              {user?.departmentName || 'Department'} | {user?.name}
            </p>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FileText className="size-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{newComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">New Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="size-5 text-blue-600" />
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
                  <CheckCircle className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{completedComplaints.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Tabs */}
        <Tabs defaultValue="new" className="space-y-4">
          <TabsList>
            <TabsTrigger value="new">
              New Complaints
              {newComplaints.length > 0 && (
                <Badge className="ml-2 bg-yellow-600">{newComplaints.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {newComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No new complaints</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newComplaints.map(complaint => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onViewDetails={() => loadComplaintDetails(complaint.id)}
                    showCitizen
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {assignedComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No complaints in progress</p>
                </CardContent>
              </Card>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed complaints</p>
                </CardContent>
              </Card>
            ) : (
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
                {/* Complaint Details */}
                <div>
                  <h4 className="font-medium mb-2">{selectedComplaint.complaintType}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedComplaint.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{selectedComplaint.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <p className="font-medium capitalize">{selectedComplaint.priority}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Citizen:</span>
                      <p className="font-medium">{selectedComplaint.citizenName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedComplaint.citizenPhone}</p>
                    </div>
                  </div>

                  {/* Location Map */}
                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Exact Location</h5>
                      <LocationMap
                        latitude={selectedComplaint.latitude}
                        longitude={selectedComplaint.longitude}
                        address={selectedComplaint.location}
                        height="250px"
                      />
                    </div>
                  )}

                  {/* Photos */}
                  {selectedComplaint.photos && selectedComplaint.photos.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Photos ({selectedComplaint.photos.length})</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedComplaint.photos.map((photo: string, index: number) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={photo}
                              alt={`Complaint photo ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                              onClick={() => window.open(photo, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assignment Info */}
                {assignment && assignment.contractorId && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Assigned Contractor</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{assignment.contractorName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="capitalize">{assignment.contractorStatus}</Badge>
                        </div>
                      </div>
                      {assignment.contractorPhone && (
                        <Button variant="outline" size="sm">
                          <Phone className="size-4 mr-2" />
                          Call: {assignment.contractorPhone}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <TrackingTimeline 
                  timeline={selectedComplaint.timeline}
                  currentStatus={selectedComplaint.status}
                />

                {/* Assign Contractor Button */}
                {selectedComplaint.status === 'assigned_to_subadmin' && (
                  <Button 
                    onClick={() => setShowAssign(true)}
                    className="w-full"
                  >
                    <UserPlus className="size-4 mr-2" />
                    Assign to Contractor
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Contractor Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign to Contractor</DialogTitle>
            <DialogDescription>
              Select a contractor and provide work details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignContractor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractorId">Select Contractor</Label>
              <Select name="contractorId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose contractor" />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map(contractor => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name} - {contractor.workTypes || 'General'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contractors.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No contractors available. Ask main admin to create contractor accounts.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedFees">Estimated Fees (₹)</Label>
                <Input
                  id="estimatedFees"
                  name="estimatedFees"
                  type="number"
                  placeholder="5000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time</Label>
                <Input
                  id="estimatedTime"
                  name="estimatedTime"
                  type="text"
                  placeholder="e.g., 2-3 days"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Work Instructions</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed instructions for the contractor..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Contractor'}
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
    </div>
  );
}
