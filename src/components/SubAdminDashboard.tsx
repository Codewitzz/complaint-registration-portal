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
  Phone,
  Star,
  Megaphone,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
import { LocationMap } from './LocationMap';
import { PhotoLightbox } from './PhotoLightbox';
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
  const [feedback, setFeedback] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadComplaints();
    loadContractors();
    loadAnnouncements();
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

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/announcements/all`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
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
      setFeedback(data.feedback);
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

  const handleSaveAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const announcementData = {
      id: editingAnnouncement?.id,
      title: formData.get('title'),
      message: formData.get('message'),
      priority: formData.get('priority'),
      isActive: formData.get('isActive') === 'true'
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/announcements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(announcementData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(editingAnnouncement ? 'Announcement updated successfully!' : 'Announcement created successfully!');
        setShowAnnouncementForm(false);
        setEditingAnnouncement(null);
        loadAnnouncements();
        (e.target as HTMLFormElement).reset();
      } else {
        alert(data.error || 'Failed to save announcement');
      }
    } catch (error) {
      console.error('Failed to save announcement:', error);
      alert('Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/announcements/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        alert('Announcement deleted successfully!');
        loadAnnouncements();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement');
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-semibold text-lg sm:text-xl">CivicEase - Sub-Admin Portal</h1>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                {user?.departmentName || 'Department'} | {user?.name}
              </p>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="min-h-[44px] text-xs sm:text-sm w-full sm:w-auto">
              <LogOut className="size-3 sm:size-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Logout</span>
              <span className="xs:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button onClick={() => {
            setShowAnnouncements(true);
            loadAnnouncements();
          }} variant="outline" className="min-h-[44px] text-sm sm:text-base">
            <Megaphone className="size-3 sm:size-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Manage Announcements</span>
            <span className="sm:hidden">Announcements</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FileText className="size-4 sm:size-5 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-semibold">{newComplaints.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">New Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Clock className="size-4 sm:size-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-semibold">{assignedComplaints.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <CheckCircle className="size-4 sm:size-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-semibold">{completedComplaints.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Tabs */}
        <Tabs defaultValue="new" className="space-y-3 sm:space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="new" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              <span className="hidden sm:inline">New Complaints</span>
              <span className="sm:hidden">New</span>
              {newComplaints.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-yellow-600 text-[10px] sm:text-xs">{newComplaints.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              <span className="hidden sm:inline">In Progress</span>
              <span className="sm:hidden">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              Completed
            </TabsTrigger>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

          <TabsContent value="completed" className="space-y-3 sm:space-y-4">
            {completedComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <CheckCircle className="size-10 sm:size-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">No completed complaints</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
          {selectedComplaint && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-lg sm:text-xl">
                  <span>Complaint Details</span>
                  <Badge variant="outline" className="font-mono text-xs sm:text-sm w-fit">
                    {selectedComplaint.token}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Complaint Details */}
                <div>
                  <h4 className="font-medium mb-2">{selectedComplaint.complaintType}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedComplaint.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium break-words">{selectedComplaint.location}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>
                      <p className="font-medium capitalize break-words">{selectedComplaint.priority}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Citizen:</span>
                      <p className="font-medium break-words">{selectedComplaint.citizenName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium break-words">{selectedComplaint.citizenPhone}</p>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {selectedComplaint.photos.map((photo: string, index: number) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={photo}
                              alt={`Complaint photo ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                              onClick={() => {
                                setLightboxImages(selectedComplaint.photos);
                                setLightboxIndex(index);
                                setShowLightbox(true);
                              }}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium break-words">{assignment.contractorName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className="capitalize text-xs sm:text-sm">{assignment.contractorStatus}</Badge>
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

                {/* Completion Details */}
                {assignment && assignment.completionNotes && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="size-4" />
                        Work Completion Details
                      </h4>
                      {assignment.completedAt && (
                        <div className="mb-3 text-sm">
                          <span className="text-muted-foreground">Completed On:</span>
                          <p className="font-medium">
                            {new Date(assignment.completedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="mb-3">
                        <span className="text-sm text-muted-foreground">Completion Notes:</span>
                        <p className="text-sm mt-1">{assignment.completionNotes}</p>
                      </div>
                      {assignment.completionPhotos && assignment.completionPhotos.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2 text-sm">
                            Completion Photos ({assignment.completionPhotos.length})
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {assignment.completionPhotos.map((photo: string, index: number) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={photo}
                                  alt={`Completion photo ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                  onClick={() => {
                                    setLightboxImages(assignment.completionPhotos);
                                    setLightboxIndex(index);
                                    setShowLightbox(true);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Feedback Section */}
                {feedback && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        Citizen Feedback
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`size-4 ${
                                  star <= feedback.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">
                              {feedback.rating} / 5
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Satisfaction:</span>
                          <Badge
                            className={`ml-2 ${
                              feedback.satisfied
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            {feedback.satisfied ? 'Satisfied' : 'Not Satisfied'}
                          </Badge>
                        </div>
                        {feedback.comment && (
                          <div>
                            <span className="text-sm text-muted-foreground">Comment:</span>
                            <p className="text-sm mt-1 bg-white p-2 rounded border">
                              {feedback.comment}
                            </p>
                          </div>
                        )}
                        {feedback.submittedAt && (
                          <div className="text-xs text-muted-foreground">
                            Submitted on: {new Date(feedback.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
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
        <DialogContent className="max-w-2xl mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assign to Contractor</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select a contractor and provide work details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignContractor} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="contractorId" className="text-sm sm:text-base">Select Contractor</Label>
              <Select name="contractorId" required>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="estimatedFees" className="text-sm sm:text-base">Estimated Fees (₹)</Label>
                <Input
                  id="estimatedFees"
                  name="estimatedFees"
                  type="number"
                  placeholder="5000"
                  required
                  className="min-h-[44px] text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="estimatedTime" className="text-sm sm:text-base">Estimated Time</Label>
                <Input
                  id="estimatedTime"
                  name="estimatedTime"
                  type="text"
                  placeholder="e.g., 2-3 days"
                  required
                  className="min-h-[44px] text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-sm sm:text-base">Work Instructions</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide detailed instructions for the contractor..."
                rows={4}
                required
                className="text-sm sm:text-base min-h-[120px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="submit" className="flex-1 min-h-[44px] text-sm sm:text-base" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Contractor'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAssign(false)}
                className="min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Announcements Management Dialog */}
      <Dialog open={showAnnouncements} onOpenChange={setShowAnnouncements}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Manage Announcements</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create and manage announcements that appear on the login/signup page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <Button
              onClick={() => {
                setEditingAnnouncement(null);
                setShowAnnouncementForm(true);
              }}
              className="w-full min-h-[44px] text-sm sm:text-base"
            >
              <Plus className="size-3 sm:size-4 mr-1 sm:mr-2" />
              Create New Announcement
            </Button>

            <div className="space-y-2 sm:space-y-3">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <Megaphone className="size-10 sm:size-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">No announcements yet</p>
                  </CardContent>
                </Card>
              ) : (
                announcements.map((announcement) => (
                  <Card key={announcement.id} className={announcement.isActive ? 'border-2 border-blue-300' : 'opacity-60'}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{announcement.title}</h4>
                            {announcement.priority === 'high' && (
                              <Badge variant="destructive">High Priority</Badge>
                            )}
                            {!announcement.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line mb-2">
                            {announcement.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {announcement.createdByName}</span>
                            <span>Created: {new Date(announcement.createdAt).toLocaleString()}</span>
                            {announcement.updatedAt !== announcement.createdAt && (
                              <span>Updated: {new Date(announcement.updatedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setShowAnnouncementForm(true);
                            }}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            disabled={loading}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Form Dialog */}
      <Dialog open={showAnnouncementForm} onOpenChange={(open) => {
        setShowAnnouncementForm(open);
        if (!open) {
          setEditingAnnouncement(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              This announcement will be displayed on the login/signup page
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAnnouncement} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="announcement-title" className="text-sm sm:text-base">Title</Label>
              <Input
                id="announcement-title"
                name="title"
                placeholder="e.g., Important Notice"
                defaultValue={editingAnnouncement?.title}
                required
                className="min-h-[44px] text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="announcement-message" className="text-sm sm:text-base">Message</Label>
              <Textarea
                id="announcement-message"
                name="message"
                placeholder="Enter the announcement message..."
                rows={5}
                defaultValue={editingAnnouncement?.message}
                required
                className="text-sm sm:text-base min-h-[120px]"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="announcement-priority" className="text-sm sm:text-base">Priority</Label>
              <Select name="priority" defaultValue={editingAnnouncement?.priority || 'normal'}>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="announcement-active" className="text-sm sm:text-base">Status</Label>
              <Select name="isActive" defaultValue={editingAnnouncement?.isActive !== false ? 'true' : 'false'}>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active (Visible on login page)</SelectItem>
                  <SelectItem value="false">Inactive (Hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="submit" className="flex-1 min-h-[44px] text-sm sm:text-base" disabled={loading}>
                {loading ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAnnouncementForm(false);
                  setEditingAnnouncement(null);
                }}
                className="min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
      />
    </div>
  );
}
