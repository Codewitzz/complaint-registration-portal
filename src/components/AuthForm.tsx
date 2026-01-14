import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { UserCircle, Briefcase, Shield, ShieldCheck, LogIn, UserPlus, Megaphone, X } from 'lucide-react';
import { supabase, projectId, publicAnonKey } from '../utils/supabase/client';

interface AuthFormProps {
  onAuthSuccess: (accessToken: string) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [userType, setUserType] = useState<'citizen' | 'contractor' | 'subadmin' | 'admin'>('citizen');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  // Load departments
  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-81e5b189/departments`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(console.error);
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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        onAuthSuccess(data.session.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const aadhaar = formData.get('aadhaar') as string;
    const address = formData.get('address') as string;

    let endpoint = '';
    let body: any = { email, password, name, phone, aadhaar, address };

    if (userType === 'citizen') {
      endpoint = '/auth/signup/citizen';
    } else if (userType === 'contractor') {
      endpoint = '/auth/signup/contractor';
      body.workTypes = formData.get('workTypes') as string;
      body.departments = formData.get('departments') as string;
    } else if (userType === 'admin') {
      endpoint = '/auth/create-admin';
      body.secretKey = formData.get('secretKey') as string;
      delete body.aadhaar;
      delete body.address;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-81e5b189${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Now login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;

      if (loginData.session) {
        onAuthSuccess(loginData.session.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements.filter(
    ann => !dismissedAnnouncements.has(ann.id)
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
        {/* Announcements Section */}
        {visibleAnnouncements.length > 0 && (
          <div className="space-y-3">
            {visibleAnnouncements.map((announcement) => (
              <Card
                key={announcement.id}
                className={`border-2 ${
                  announcement.priority === 'high'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        announcement.priority === 'high'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      }`}>
                        <Megaphone className={`size-5 ${
                          announcement.priority === 'high'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{announcement.title}</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {announcement.message}
                        </p>
                        {announcement.createdByName && (
                          <p className="text-xs text-gray-500 mt-2">
                            - {announcement.createdByName}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
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

        <Card className="w-full">
        <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-full">
              <ShieldCheck className="size-6 sm:size-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">CivicEase Portal</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Civic Complaint Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-auto">
              <TabsTrigger value="login" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                <LogIn className="size-3 sm:size-4" />
                <span className="hidden xs:inline">Login</span>
                <span className="xs:hidden">Login</span>
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                <UserPlus className="size-3 sm:size-4" />
                <span className="hidden xs:inline">Sign Up</span>
                <span className="xs:hidden">Sign Up</span>
              </TabsTrigger>
            </TabsList>

            {/* User Type Selection */}
            <div className="mb-4 sm:mb-6">
              <Label className="mb-2 sm:mb-3 block text-sm sm:text-base">I am a:</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant={userType === 'citizen' ? 'default' : 'outline'}
                  onClick={() => setUserType('citizen')}
                  className="flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 min-h-[80px] sm:min-h-[100px]"
                >
                  <UserCircle className="size-5 sm:size-6" />
                  <span className="text-xs">Citizen</span>
                </Button>
                <Button
                  type="button"
                  variant={userType === 'contractor' ? 'default' : 'outline'}
                  onClick={() => setUserType('contractor')}
                  className="flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 min-h-[80px] sm:min-h-[100px]"
                >
                  <Briefcase className="size-5 sm:size-6" />
                  <span className="text-xs">Contractor</span>
                </Button>
                <Button
                  type="button"
                  variant={userType === 'subadmin' ? 'default' : 'outline'}
                  onClick={() => setUserType('subadmin')}
                  className="flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 min-h-[80px] sm:min-h-[100px]"
                  disabled={!isLogin}
                  title={isLogin ? "Login as Sub-Admin" : "Sub-admins are created by Main Admin"}
                >
                  <Shield className="size-5 sm:size-6" />
                  <span className="text-xs">Sub-Admin</span>
                </Button>
                <Button
                  type="button"
                  variant={userType === 'admin' ? 'default' : 'outline'}
                  onClick={() => setUserType('admin')}
                  className="flex flex-col items-center gap-1 sm:gap-2 h-auto py-3 sm:py-4 min-h-[80px] sm:min-h-[100px]"
                >
                  <ShieldCheck className="size-5 sm:size-6" />
                  <span className="text-xs">Admin</span>
                </Button>
              </div>
            </div>

            {/* Login Form */}
          <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="login-email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    className="text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="login-password" className="text-sm sm:text-base">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-xs sm:text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full min-h-[44px] text-sm sm:text-base" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="signup-name" className="text-sm sm:text-base">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      className="text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="signup-phone" className="text-sm sm:text-base">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      required
                      className="text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="signup-password" className="text-sm sm:text-base">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="text-sm sm:text-base min-h-[44px]"
                  />
                </div>

                {userType !== 'admin' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-aadhaar">Aadhaar Number (Optional)</Label>
                      <Input
                        id="signup-aadhaar"
                        name="aadhaar"
                        type="text"
                        placeholder="1234 5678 9012"
                        maxLength={12}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Address</Label>
                      <Textarea
                        id="signup-address"
                        name="address"
                        placeholder="Your full address"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {userType === 'contractor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-workTypes">Work Types / Specialization</Label>
                      <Input
                        id="signup-workTypes"
                        name="workTypes"
                        type="text"
                        placeholder="e.g., Plumbing, Electrical, Road Work"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-departments">Departments (comma-separated)</Label>
                      <Input
                        id="signup-departments"
                        name="departments"
                        type="text"
                        placeholder="e.g., Water Supply, Roads, Streetlights"
                      />
                    </div>
                  </>
                )}

                {userType === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-secretKey">Admin Secret Key</Label>
                    <Input
                      id="signup-secretKey"
                      name="secretKey"
                      type="password"
                      placeholder="Enter admin secret key"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact system administrator for the secret key
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2 sm:py-3 rounded-md text-xs sm:text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full min-h-[44px] text-sm sm:text-base" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {userType === 'subadmin' && !isLogin && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Note:</strong> Sub-admin accounts are created by the Main Admin. 
                If you're a department head, please contact the Main Admin to create your account.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}