import { useState, useEffect } from 'react';
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
  Bell
} from 'lucide-react';
import { ComplaintCard } from './ComplaintCard';
import { TrackingTimeline } from './TrackingTimeline';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadDepartments();
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

  const handleSubmitComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const complaintData = {
      departmentId: formData.get('departmentId'),
      complaintType: formData.get('complaintType'),
      description: formData.get('description'),
      location: formData.get('location'),
      photos: [] // In production, handle photo uploads
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-semibold">CivicEase</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowNewComplaint(true)} size="sm">
              <Plus className="size-4 mr-2" />
              New Complaint
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="size-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingComplaints.length}</p>
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
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Complaints</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {pendingComplaints.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="size-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active complaints</p>
                  <Button 
                    onClick={() => setShowNewComplaint(true)} 
                    className="mt-4"
                    size="sm"
                  >
                    Register New Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingComplaints.map(complaint => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onViewDetails={() => setSelectedComplaint(complaint)}
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
                    onViewDetails={() => setSelectedComplaint(complaint)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaints.map(complaint => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onViewDetails={() => setSelectedComplaint(complaint)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Complaint Dialog */}
      <Dialog open={showNewComplaint} onOpenChange={setShowNewComplaint}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Complaint</DialogTitle>
            <DialogDescription>
              Fill in the details about your complaint. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="complaintType">Complaint Type</Label>
              <Input
                id="complaintType"
                name="complaintType"
                placeholder="e.g., Garbage not collected, Water leakage"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Complete address / landmark"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Photos (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Photo upload will be available in production
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewComplaint(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                <div>
                  <h4 className="font-medium mb-2">{selectedComplaint.complaintType}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{selectedComplaint.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <p className="font-medium capitalize">{selectedComplaint.priority}</p>
                  </div>
                </div>

                <TrackingTimeline 
                  timeline={selectedComplaint.timeline}
                  currentStatus={selectedComplaint.status}
                />

                {selectedComplaint.status === 'completed' && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        setShowFeedback(true);
                        setSelectedComplaint(selectedComplaint);
                      }}
                      className="flex-1"
                    >
                      <Star className="size-4 mr-2" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Rate the resolution of your complaint
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Select name="rating" required>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="satisfied">Are you satisfied with the resolution?</Label>
              <Select name="satisfied" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comments (Optional)</Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowFeedback(false)}
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
