import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  LogOut, 
  FileText, 
  CheckCircle, 
  Clock,
  Star,
  Upload,
  Pin,
  Bell,
  Megaphone,
  X
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
import { LocationPicker } from './LocationPicker';
import { ImageUpload } from './ImageUpload';
import { LocationMap } from './LocationMap';
import { PhotoLightbox } from './PhotoLightbox';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CitizenDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function CitizenDashboard({ accessToken, onLogout }: CitizenDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [locationData, setLocationData] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadKey, setUploadKey] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUserProfile();
    loadDepartments();
    loadComplaints();
  }, []);

  // Load announcements
  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/announcements`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.announcements) {
          setAnnouncements(data.announcements);
        }
      })
      .catch((error) => {
        console.error('Failed to load announcements:', error);
        // Don't break the component if announcements fail to load
        setAnnouncements([]);
      });
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

   const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements.filter(
    ann => !dismissedAnnouncements.has(ann.id)
  );


  const handleSubmitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!locationData) {
      alert('Please select a location on the map or use your current location');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const complaintData = {
      departmentId: formData.get('departmentId'),
      complaintType: formData.get('complaintType'),
      description: formData.get('description'),
      location: locationData.address,
      latitude: locationData.lat,
      longitude: locationData.lng,
      photos: photos
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(complaintData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`Complaint registered successfully! Token: ${data.token}`);
        setShowNewComplaint(false);
        setLocationData(null);
        setPhotos([]);
        setUploadKey(prev => prev + 1); // Reset ImageUpload component
        loadComplaints();
        (e.target as HTMLFormElement).reset();
      } else {
        alert(data.error || 'Failed to register complaint');
      }
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      alert('Failed to register complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const feedbackData = {
      rating: parseInt(formData.get('rating') as string),
      comment: formData.get('comment'),
      satisfied: formData.get('satisfied') === 'yes'
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/complaints/${selectedComplaint.id}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(feedbackData)
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setShowFeedback(false);
        setSelectedComplaint(null);
        loadComplaints();
      } else {
        alert(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const pendingComplaints = complaints.filter(c => 
    ['pending', 'assigned_to_subadmin', 'assigned_to_contractor', 'in_progress'].includes(c.status)
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
              <h1 className="font-semibold text-lg sm:text-xl">CivicEase</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Welcome, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button onClick={() => setShowNewComplaint(true)} size="sm" className="flex-1 sm:flex-initial min-h-[44px] text-xs sm:text-sm">
                <Plus className="size-3 sm:size-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Complaint</span>
                <span className="xs:hidden">New</span>
              </Button>
              <Button onClick={onLogout} variant="outline" size="sm" className="min-h-[44px] text-xs sm:text-sm">
                <LogOut className="size-3 sm:size-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* Announcements Section */}
        {visibleAnnouncements.length > 0 && (
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {visibleAnnouncements.map((announcement) => (
              <Card
                key={announcement.id}
                className={`border-2 ${
                  announcement.priority === 'high'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                        announcement.priority === 'high'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}>
                        <Megaphone className={`size-4 sm:size-5 ${
                          announcement.priority === 'high'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 text-sm sm:text-base break-words">{announcement.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">
                          {announcement.message}
                        </p>
                        {announcement.createdByName && (
                          <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                            - {announcement.createdByName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-6 sm:w-6 flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                      onClick={() => handleDismissAnnouncement(announcement.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <FileText className="size-4 sm:size-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-semibold">{complaints.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Complaints</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Clock className="size-4 sm:size-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-semibold">{pendingComplaints.length}</p>
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
        <Tabs defaultValue="active" className="space-y-3 sm:space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="active" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              <span className="hidden sm:inline">Active Complaints</span>
              <span className="sm:hidden">Active</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              Completed
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-4">
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 sm:space-y-4">
            {pendingComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="size-10 sm:size-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">No active complaints</p>
                  <Button 
                    onClick={() => setShowNewComplaint(true)} 
                    className="mt-3 sm:mt-4 min-h-[44px]"
                    size="sm"
                  >
                    Register New Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pendingComplaints.map(complaint => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onViewDetails={() => loadComplaintDetails(complaint.id)}
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
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {complaints.map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onViewDetails={() => loadComplaintDetails(complaint.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Complaint Dialog */}
      <Dialog open={showNewComplaint} onOpenChange={setShowNewComplaint}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Register New Complaint</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Fill in the details about your complaint. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitComplaint} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="departmentId" className="text-sm sm:text-base">Department</Label>
              <Select name="departmentId" required>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
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

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="complaintType" className="text-sm sm:text-base">Complaint Type</Label>
              <Input
                id="complaintType"
                name="complaintType"
                placeholder="e.g., Garbage not collected, Water leakage"
                required
                className="min-h-[44px] text-sm sm:text-base"
              />
            </div>

            <LocationPicker
              onLocationChange={(location) => setLocationData(location)}
              initialLocation={locationData || undefined}
            />

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail..."
                rows={4}
                className="text-sm sm:text-base min-h-[120px]"
                required
              />
            </div>

            <ImageUpload
              key={uploadKey}
              onImagesChange={(images) => setPhotos(images)}
              maxImages={5}
              maxSizeMB={5}
            />

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="submit" className="flex-1 min-h-[44px] text-sm sm:text-base" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowNewComplaint(false);
                  setLocationData(null);
                  setPhotos([]);
                  setUploadKey(prev => prev + 1); // Reset ImageUpload component
                }}
                className="min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complaint Details Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => {
        setSelectedComplaint(null);
        setAssignment(null);
      }}>
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
                <div>
                  <h4 className="font-medium mb-2">{selectedComplaint.complaintType}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs sm:text-sm">Location:</span>
                    <p className="font-medium text-sm sm:text-base break-words">{selectedComplaint.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs sm:text-sm">Priority:</span>
                    <p className="font-medium capitalize text-sm sm:text-base">{selectedComplaint.priority}</p>
                  </div>
                </div>

                {/* Location Map */}
                {selectedComplaint.latitude && selectedComplaint.longitude && (
                  <div>
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
                  <div>
                    <h5 className="font-medium mb-2 text-sm sm:text-base">Photos ({selectedComplaint.photos.length})</h5>
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

                <TrackingTimeline 
                  timeline={selectedComplaint.timeline}
                  currentStatus={selectedComplaint.status}
                />

                {selectedComplaint.status === 'completed' && (
                  <div className="flex gap-2 sm:gap-3">
                    <Button 
                      onClick={() => {
                        setShowFeedback(true);
                        setSelectedComplaint(selectedComplaint);
                      }}
                      className="flex-1 min-h-[44px] text-sm sm:text-base"
                    >
                      <Star className="size-3 sm:size-4 mr-1 sm:mr-2" />
                      Provide Feedback
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="mx-2 sm:mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Provide Feedback</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Rate the resolution of your complaint
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="rating" className="text-sm sm:text-base">Rating (1-5)</Label>
              <Select name="rating" required>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="2">2 - Poor</SelectItem>
                  <SelectItem value="1">1 - Very Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="satisfied" className="text-sm sm:text-base">Are you satisfied with the resolution?</Label>
              <Select name="satisfied" required>
                <SelectTrigger className="min-h-[44px] text-sm sm:text-base">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="comment" className="text-sm sm:text-base">Comments (Optional)</Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Share your experience..."
                rows={3}
                className="text-sm sm:text-base min-h-[100px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button type="submit" className="flex-1 min-h-[44px] text-sm sm:text-base" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowFeedback(false)}
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
