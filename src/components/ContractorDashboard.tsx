import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LogOut, 
  Briefcase, 
  Clock, 
  CheckCircle,
  Check,
  X,
  Upload,
  Phone
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
import { LocationMap } from './LocationMap';
import { ImageUpload } from './ImageUpload';
import { PhotoLightbox } from './PhotoLightbox';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ContractorDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function ContractorDashboard({ accessToken, onLogout }: ContractorDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadComplaints();
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

  const handleAccept = async (complaintId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${complaintId}/contractor-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ action: 'accept' })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Assignment accepted! You can now start working on this complaint.');
        loadComplaints();
        setSelectedComplaint(null);
      } else {
        alert(data.error || 'Failed to accept assignment');
      }
    } catch (error) {
      console.error('Failed to accept:', error);
      alert('Failed to accept assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (complaintId: string) => {
    if (!confirm('Are you sure you want to reject this assignment?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${complaintId}/contractor-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ action: 'reject' })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Assignment rejected.');
        loadComplaints();
        setSelectedComplaint(null);
      } else {
        alert(data.error || 'Failed to reject assignment');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const completionData = {
      completionNotes: formData.get('completionNotes'),
      completionPhotos: completionPhotos
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${selectedComplaint.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(completionData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Work completed successfully!');
        setShowComplete(false);
        setSelectedComplaint(null);
        setCompletionPhotos([]);
        loadComplaints();
      } else {
        alert(data.error || 'Failed to mark as complete');
      }
    } catch (error) {
      console.error('Failed to complete:', error);
      alert('Failed to mark as complete');
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = complaints.filter(c => 
    c.status === 'assigned_to_contractor' && 
    (assignment?.contractorStatus === 'pending' || !assignment)
  );
  const inProgress = complaints.filter(c => c.status === 'in_progress');
  const completed = complaints.filter(c => 
    ['completed', 'closed', 'closed_by_authority'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">CivicEase - Contractor Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
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
                  <Briefcase className="size-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingAssignments.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Assignments</p>
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
                  <p className="text-2xl font-semibold">{inProgress.length}</p>
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
                  <p className="text-2xl font-semibold">{completed.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Assignments */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Assignments
              {pendingAssignments.length > 0 && (
                <Badge className="ml-2 bg-yellow-600">{pendingAssignments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending assignments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingAssignments.map(complaint => (
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
            {inProgress.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No work in progress</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgress.map(complaint => (
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
            {completed.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed work</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map(complaint => (
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

      {/* Assignment Details Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedComplaint && assignment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Assignment Details</span>
                  <Badge variant="outline" className="font-mono">
                    {selectedComplaint.token}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Assignment Info */}
                {assignment.contractorStatus === 'pending' && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">New Assignment</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Estimated Fees:</span>
                          <p className="font-medium">₹{assignment.estimatedFees}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estimated Time:</span>
                          <p className="font-medium">{assignment.estimatedTime}</p>
                        </div>
                      </div>
                      {assignment.assignmentDescription && (
                        <div className="mb-4">
                          <span className="text-sm text-muted-foreground">Instructions:</span>
                          <p className="text-sm">{assignment.assignmentDescription}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleAccept(selectedComplaint.id)}
                          className="flex-1"
                          disabled={loading}
                        >
                          <Check className="size-4 mr-2" />
                          Accept Assignment
                        </Button>
                        <Button 
                          onClick={() => handleReject(selectedComplaint.id)}
                          variant="outline"
                          disabled={loading}
                        >
                          <X className="size-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                      <span className="text-muted-foreground">Citizen:</span>
                      <p className="font-medium">{selectedComplaint.citizenName}</p>
                    </div>
                  </div>

                  {selectedComplaint.citizenPhone && (
                    <Button variant="outline" size="sm" className="mb-4">
                      <Phone className="size-4 mr-2" />
                      Call Citizen: {selectedComplaint.citizenPhone}
                    </Button>
                  )}

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

                {/* Timeline */}
                <TrackingTimeline 
                  timeline={selectedComplaint.timeline}
                  currentStatus={selectedComplaint.status}
                />

                {/* Mark Complete Button */}
                {selectedComplaint.status === 'in_progress' && (
                  <Button 
                    onClick={() => setShowComplete(true)}
                    className="w-full"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Work Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Work as Complete</DialogTitle>
            <DialogDescription>
              Provide completion details and photos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="completionNotes">Completion Notes</Label>
              <Textarea
                id="completionNotes"
                name="completionNotes"
                placeholder="Describe what work was completed..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Completion Photos (Required)</Label>
              <ImageUpload
                onImagesChange={(images) => setCompletionPhotos(images)}
                maxImages={10}
                maxSizeMB={5}
              />
              {completionPhotos.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Please upload at least one completion photo
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={loading || completionPhotos.length === 0}
              >
                {loading ? 'Submitting...' : 'Submit & Complete'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowComplete(false);
                  setCompletionPhotos([]);
                }}
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
