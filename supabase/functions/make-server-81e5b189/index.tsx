import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to generate complaint token
const generateToken = () => `CMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// Initialize default departments
const initializeDepartments = async () => {
  const existingDepts = await kv.get('departments:list');
  if (!existingDepts) {
    const defaultDepts = [
      'Waste Management Department',
      'Water Supply and Drainage Department',
      'Roads and Transportation Department',
      'Streetlight and Electricity Maintenance',
      'Public Health and Sanitation Department',
      'Garden and Parks Department',
      'Building and Construction Department',
      'Environmental and Pollution Control Department',
      'Fire and Emergency Services',
      'Public Works Department (PWD)',
      'Water Drainage (Sewage) Department',
      'Solid Waste Recycling Department',
      'Public Grievance and Feedback Cell'
    ];
    
    const deptIds = [];
    for (const deptName of defaultDepts) {
      const deptId = generateId();
      await kv.set(`departments:${deptId}`, {
        id: deptId,
        name: deptName,
        customerCare: {
          phone: '1800-XXX-XXXX',
          email: `${deptName.toLowerCase().replace(/\s+/g, '')}@civicease.gov`
        },
        subAdminId: null,
        createdAt: new Date().toISOString()
      });
      deptIds.push(deptId);
    }
    await kv.set('departments:list', deptIds);
  }
};

// Initialize on startup
initializeDepartments();

// ============= AUTH ROUTES =============

// Signup - Common People
app.post('/make-server-81e5b189/auth/signup/citizen', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, phone, name, aadhaar, address } = body;

    if (!email || !password || !phone || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name,
        phone,
        aadhaar,
        address,
        role: 'citizen'
      }
    });

    if (error) {
      console.log('Citizen signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user data
    await kv.set(`users:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone,
      aadhaar,
      address,
      role: 'citizen',
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log('Citizen signup exception:', error);
    return c.json({ error: 'Signup failed: ' + error.message }, 500);
  }
});

// Signup - Contractor/Worker
app.post('/make-server-81e5b189/auth/signup/contractor', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, phone, name, aadhaar, address, workTypes, departments } = body;

    if (!email || !password || !phone || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name,
        phone,
        aadhaar,
        address,
        workTypes,
        departments,
        role: 'contractor'
      }
    });

    if (error) {
      console.log('Contractor signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    await kv.set(`users:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone,
      aadhaar,
      address,
      workTypes,
      departments,
      role: 'contractor',
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log('Contractor signup exception:', error);
    return c.json({ error: 'Signup failed: ' + error.message }, 500);
  }
});

// Signup - Sub-Admin (by Main Admin)
app.post('/make-server-81e5b189/auth/signup/subadmin', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is main admin
    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Only main admin can create sub-admins' }, 403);
    }

    const body = await c.req.json();
    const { email, password, phone, name, departmentId, departmentName } = body;

    if (!email || !password || !phone || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name,
        phone,
        departmentId,
        departmentName,
        role: 'subadmin'
      }
    });

    if (error) {
      console.log('Sub-admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    await kv.set(`users:${authData.user.id}`, {
      id: authData.user.id,
      email,
      name,
      phone,
      departmentId,
      departmentName,
      role: 'subadmin',
      createdAt: new Date().toISOString()
    });

    // Update department with sub-admin
    if (departmentId) {
      const dept = await kv.get(`departments:${departmentId}`);
      if (dept) {
        dept.subAdminId = authData.user.id;
        dept.subAdminName = name;
        await kv.set(`departments:${departmentId}`, dept);
      }
    }

    return c.json({ success: true, userId: authData.user.id });
  } catch (error) {
    console.log('Sub-admin signup exception:', error);
    return c.json({ error: 'Signup failed: ' + error.message }, 500);
  }
});

// Create Main Admin (one-time setup)
app.post('/make-server-81e5b189/auth/create-admin', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, secretKey } = body;

    // Simple secret key check for initial setup
    if (secretKey !== 'CIVICEASE_ADMIN_2025') {
      return c.json({ error: 'Invalid secret key' }, 403);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name,
        role: 'admin'
      }
    });

    if (error) {
      console.log('Admin creation error:', error);
      return c.json({ error: error.message }, 400);
    }

    await kv.set(`users:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, userId: data.user.id });
  } catch (error) {
    console.log('Admin creation exception:', error);
    return c.json({ error: 'Admin creation failed: ' + error.message }, 500);
  }
});

// ============= DEPARTMENT ROUTES =============

// Get all departments
app.get('/make-server-81e5b189/departments', async (c) => {
  try {
    const deptIds = await kv.get('departments:list') || [];
    const departments = [];
    
    for (const deptId of deptIds) {
      const dept = await kv.get(`departments:${deptId}`);
      if (dept) {
        departments.push(dept);
      }
    }

    return c.json({ departments });
  } catch (error) {
    console.log('Get departments error:', error);
    return c.json({ error: 'Failed to get departments: ' + error.message }, 500);
  }
});

// Add new department (Main Admin only)
app.post('/make-server-81e5b189/departments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Only main admin can add departments' }, 403);
    }

    const body = await c.req.json();
    const { name, customerCarePhone, customerCareEmail } = body;

    const deptId = generateId();
    const newDept = {
      id: deptId,
      name,
      customerCare: {
        phone: customerCarePhone || '1800-XXX-XXXX',
        email: customerCareEmail || `${name.toLowerCase().replace(/\s+/g, '')}@civicease.gov`
      },
      subAdminId: null,
      createdAt: new Date().toISOString()
    };

    await kv.set(`departments:${deptId}`, newDept);
    
    const deptIds = await kv.get('departments:list') || [];
    deptIds.push(deptId);
    await kv.set('departments:list', deptIds);

    return c.json({ success: true, department: newDept });
  } catch (error) {
    console.log('Add department error:', error);
    return c.json({ error: 'Failed to add department: ' + error.message }, 500);
  }
});

// ============= COMPLAINT ROUTES =============

// Register complaint (Citizen)
app.post('/make-server-81e5b189/complaints', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'citizen') {
      return c.json({ error: 'Only citizens can register complaints' }, 403);
    }

    const body = await c.req.json();
    const { departmentId, complaintType, description, location, photos } = body;

    if (!departmentId || !complaintType || !description || !location) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const complaintId = generateId();
    const token = generateToken();
    
    const complaint = {
      id: complaintId,
      token,
      citizenId: user.id,
      citizenName: userData.name,
      citizenPhone: userData.phone,
      departmentId,
      complaintType,
      description,
      location,
      photos: photos || [],
      status: 'pending',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: 'Complaint registered successfully'
      }]
    };

    await kv.set(`complaints:${complaintId}`, complaint);
    
    // Add to citizen's complaints
    const citizenComplaints = await kv.get(`user_complaints:${user.id}`) || [];
    citizenComplaints.push(complaintId);
    await kv.set(`user_complaints:${user.id}`, citizenComplaints);

    // Add to pending complaints list
    const pendingComplaints = await kv.get('complaints:pending') || [];
    pendingComplaints.push(complaintId);
    await kv.set('complaints:pending', pendingComplaints);

    return c.json({ success: true, complaint, token });
  } catch (error) {
    console.log('Register complaint error:', error);
    return c.json({ error: 'Failed to register complaint: ' + error.message }, 500);
  }
});

// Get complaints (different views for different roles)
app.get('/make-server-81e5b189/complaints', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('📊 Fetching complaints for user:', {
      userId: user.id,
      role: userData.role,
      email: userData.email
    });

    let complaints = [];
    
    if (userData.role === 'citizen') {
      // Get citizen's own complaints
      const complaintIds = await kv.get(`user_complaints:${user.id}`) || [];
      for (const complaintId of complaintIds) {
        const complaint = await kv.get(`complaints:${complaintId}`);
        if (complaint) {
          complaints.push(complaint);
        }
      }
    } else if (userData.role === 'admin') {
      // Get all complaints - admin should see everything
      console.log('🔑 Admin accessing all complaints');
      try {
        const allComplaintData = await kv.getByPrefixWithKeys('complaints:');
        console.log('📦 All complaint keys found:', allComplaintData.length);
        console.log('📋 Sample keys:', allComplaintData.slice(0, 3).map(item => item.key));
        
        // Filter to only get actual complaint objects (not arrays like 'complaints:pending')
        // A complaint object has an 'id' field, arrays don't
        for (const item of allComplaintData) {
          // Skip the 'complaints:pending' key which stores an array of IDs
          if (item.key === 'complaints:pending') {
            console.log('⏭️ Skipping complaints:pending array');
            continue;
          }
          // Only include items that are actual complaint objects (have 'id' field)
          if (item.value && typeof item.value === 'object' && item.value.id) {
            // Check if it's a complaint object (has required fields)
            if (item.value.complaintType || item.value.description || item.value.status) {
              complaints.push(item.value);
              console.log(`✅ Added complaint: ${item.value.id} - ${item.value.complaintType || 'N/A'}`);
            } else {
              console.log(`⚠️ Skipping item ${item.key} - doesn't look like a complaint object`);
            }
          } else {
            console.log(`⚠️ Skipping item ${item.key} - invalid structure`);
          }
        }
        console.log('✅ Total filtered complaints:', complaints.length);
      } catch (error) {
        console.error('❌ Error fetching complaints for admin:', error);
        // Fallback: try to get complaints individually from pending list
        try {
          const pendingIds = await kv.get('complaints:pending') || [];
          console.log('🔄 Fallback: Trying to load from pending list:', pendingIds.length);
          for (const complaintId of pendingIds) {
            const complaint = await kv.get(`complaints:${complaintId}`);
            if (complaint) {
              complaints.push(complaint);
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
    } else if (userData.role === 'subadmin') {
      // Get all complaints for this sub-admin's department (not just assigned ones)
      console.log('🔑 Sub-admin accessing department complaints');
      const subAdminDeptId = userData.departmentId;
      if (subAdminDeptId) {
        const allComplaintData = await kv.getByPrefixWithKeys('complaints:');
        // Filter complaints by departmentId
        for (const item of allComplaintData) {
          if (item.key === 'complaints:pending') {
            continue;
          }
          if (item.value && typeof item.value === 'object' && item.value.id && item.value.departmentId === subAdminDeptId) {
            complaints.push(item.value);
          }
        }
        console.log(`✅ Found ${complaints.length} complaints for department ${subAdminDeptId}`);
      }
    } else if (userData.role === 'contractor') {
      // Get complaints assigned to this contractor
      const allAssignments = await kv.getByPrefix('assignment:');
      const complaintIds = allAssignments
        .filter(item => item && item.contractorId === user.id)
        .map(item => item.complaintId);
      
      for (const complaintId of complaintIds) {
        const complaint = await kv.get(`complaints:${complaintId}`);
        if (complaint) {
          complaints.push(complaint);
        }
      }
    }

    // Enrich complaints with department names
    for (const complaint of complaints) {
      if (complaint.departmentId && !complaint.departmentName) {
        try {
          const dept = await kv.get(`departments:${complaint.departmentId}`);
          if (dept) {
            complaint.departmentName = dept.name;
          }
        } catch (error) {
          console.log('Failed to load department for complaint:', complaint.id);
        }
      }
    }

    // Sort by creation date (newest first)
    complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`✅ Returning ${complaints.length} complaints for role: ${userData.role}`);
    return c.json({ complaints });
  } catch (error) {
    console.log('Get complaints error:', error);
    return c.json({ error: 'Failed to get complaints: ' + error.message }, 500);
  }
});

// Get single complaint details
app.get('/make-server-81e5b189/complaints/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const complaintId = c.req.param('id');
    const complaint = await kv.get(`complaints:${complaintId}`);
    
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    // Get assignment details if exists
    const assignment = await kv.get(`assignment:${complaintId}`);

    return c.json({ complaint, assignment });
  } catch (error) {
    console.log('Get complaint details error:', error);
    return c.json({ error: 'Failed to get complaint: ' + error.message }, 500);
  }
});

// Update complaint priority (Main Admin)
app.patch('/make-server-81e5b189/complaints/:id/priority', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Only admin can set priority' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { priority } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    complaint.priority = priority;
    complaint.updatedAt = new Date().toISOString();
    complaint.timeline.push({
      status: 'priority_updated',
      timestamp: new Date().toISOString(),
      message: `Priority set to ${priority}`
    });

    await kv.set(`complaints:${complaintId}`, complaint);

    return c.json({ success: true, complaint });
  } catch (error) {
    console.log('Update priority error:', error);
    return c.json({ error: 'Failed to update priority: ' + error.message }, 500);
  }
});

// ============= ASSIGNMENT ROUTES =============

// Assign complaint to Sub-Admin (Main Admin)
app.post('/make-server-81e5b189/complaints/:id/assign-subadmin', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Only admin can assign to sub-admin' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { subAdminId } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    const subAdmin = await kv.get(`users:${subAdminId}`);
    if (!subAdmin || subAdmin.role !== 'subadmin') {
      return c.json({ error: 'Sub-admin not found' }, 404);
    }

    // Update complaint status
    complaint.status = 'assigned_to_subadmin';
    complaint.updatedAt = new Date().toISOString();
    complaint.timeline.push({
      status: 'assigned_to_subadmin',
      timestamp: new Date().toISOString(),
      message: `Assigned to ${subAdmin.name} (${subAdmin.departmentName})`
    });
    await kv.set(`complaints:${complaintId}`, complaint);

    // Create assignment
    const assignment = await kv.get(`assignment:${complaintId}`) || {
      complaintId,
      createdAt: new Date().toISOString()
    };
    assignment.subAdminId = subAdminId;
    assignment.subAdminName = subAdmin.name;
    assignment.subAdminAssignedAt = new Date().toISOString();
    assignment.updatedAt = new Date().toISOString();
    await kv.set(`assignment:${complaintId}`, assignment);

    // Remove from pending list
    const pendingComplaints = await kv.get('complaints:pending') || [];
    const updatedPending = pendingComplaints.filter(id => id !== complaintId);
    await kv.set('complaints:pending', updatedPending);

    return c.json({ success: true, complaint, assignment });
  } catch (error) {
    console.log('Assign to sub-admin error:', error);
    return c.json({ error: 'Failed to assign: ' + error.message }, 500);
  }
});

// Assign complaint to Contractor (Sub-Admin)
app.post('/make-server-81e5b189/complaints/:id/assign-contractor', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'subadmin') {
      return c.json({ error: 'Only sub-admin can assign to contractor' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { contractorId, estimatedFees, estimatedTime, description } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    const contractor = await kv.get(`users:${contractorId}`);
    if (!contractor || contractor.role !== 'contractor') {
      return c.json({ error: 'Contractor not found' }, 404);
    }

    // Update complaint status
    complaint.status = 'assigned_to_contractor';
    complaint.updatedAt = new Date().toISOString();
    complaint.timeline.push({
      status: 'assigned_to_contractor',
      timestamp: new Date().toISOString(),
      message: `Assigned to contractor ${contractor.name}`
    });
    await kv.set(`complaints:${complaintId}`, complaint);

    // Update assignment
    const assignment = await kv.get(`assignment:${complaintId}`) || {
      complaintId,
      createdAt: new Date().toISOString()
    };
    assignment.contractorId = contractorId;
    assignment.contractorName = contractor.name;
    assignment.contractorPhone = contractor.phone;
    assignment.contractorAssignedAt = new Date().toISOString();
    assignment.estimatedFees = estimatedFees;
    assignment.estimatedTime = estimatedTime;
    assignment.assignmentDescription = description;
    assignment.contractorStatus = 'pending';
    assignment.updatedAt = new Date().toISOString();
    await kv.set(`assignment:${complaintId}`, assignment);

    return c.json({ success: true, complaint, assignment });
  } catch (error) {
    console.log('Assign to contractor error:', error);
    return c.json({ error: 'Failed to assign: ' + error.message }, 500);
  }
});

// Contractor accepts/rejects assignment
app.post('/make-server-81e5b189/complaints/:id/contractor-response', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'contractor') {
      return c.json({ error: 'Only contractor can respond' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { action } = body; // 'accept' or 'reject'

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    const assignment = await kv.get(`assignment:${complaintId}`);
    if (!assignment || assignment.contractorId !== user.id) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    if (action === 'accept') {
      complaint.status = 'in_progress';
      complaint.timeline.push({
        status: 'in_progress',
        timestamp: new Date().toISOString(),
        message: 'Work started by contractor'
      });
      assignment.contractorStatus = 'accepted';
      assignment.workStartedAt = new Date().toISOString();
    } else {
      complaint.status = 'contractor_rejected';
      complaint.timeline.push({
        status: 'contractor_rejected',
        timestamp: new Date().toISOString(),
        message: 'Contractor rejected the assignment'
      });
      assignment.contractorStatus = 'rejected';
      assignment.rejectedAt = new Date().toISOString();
    }

    complaint.updatedAt = new Date().toISOString();
    assignment.updatedAt = new Date().toISOString();

    await kv.set(`complaints:${complaintId}`, complaint);
    await kv.set(`assignment:${complaintId}`, assignment);

    return c.json({ success: true, complaint, assignment });
  } catch (error) {
    console.log('Contractor response error:', error);
    return c.json({ error: 'Failed to respond: ' + error.message }, 500);
  }
});

// Contractor completes work
app.post('/make-server-81e5b189/complaints/:id/complete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'contractor') {
      return c.json({ error: 'Only contractor can mark complete' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { completionPhotos, completionNotes } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    const assignment = await kv.get(`assignment:${complaintId}`);
    if (!assignment || assignment.contractorId !== user.id) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    complaint.status = 'completed';
    complaint.timeline.push({
      status: 'completed',
      timestamp: new Date().toISOString(),
      message: 'Work completed by contractor'
    });
    complaint.updatedAt = new Date().toISOString();

    assignment.contractorStatus = 'completed';
    assignment.completedAt = new Date().toISOString();
    assignment.completionPhotos = completionPhotos || [];
    assignment.completionNotes = completionNotes;
    assignment.updatedAt = new Date().toISOString();

    await kv.set(`complaints:${complaintId}`, complaint);
    await kv.set(`assignment:${complaintId}`, assignment);

    return c.json({ success: true, complaint, assignment });
  } catch (error) {
    console.log('Complete work error:', error);
    return c.json({ error: 'Failed to complete: ' + error.message }, 500);
  }
});

// ============= FEEDBACK ROUTES =============

// Submit feedback (Citizen)
app.post('/make-server-81e5b189/complaints/:id/feedback', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { rating, comment, satisfied } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    if (complaint.citizenId !== user.id) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const feedback = {
      complaintId,
      citizenId: user.id,
      rating,
      comment,
      satisfied,
      submittedAt: new Date().toISOString()
    };

    await kv.set(`feedback:${complaintId}`, feedback);

    if (satisfied) {
      complaint.status = 'closed';
      complaint.timeline.push({
        status: 'closed',
        timestamp: new Date().toISOString(),
        message: 'Complaint closed with feedback'
      });
    } else {
      complaint.status = 'reopened';
      complaint.timeline.push({
        status: 'reopened',
        timestamp: new Date().toISOString(),
        message: 'Complaint reopened - citizen not satisfied'
      });
    }

    complaint.updatedAt = new Date().toISOString();
    await kv.set(`complaints:${complaintId}`, complaint);

    return c.json({ success: true, feedback, complaint });
  } catch (error) {
    console.log('Submit feedback error:', error);
    return c.json({ error: 'Failed to submit feedback: ' + error.message }, 500);
  }
});

// Close complaint (Admin/Sub-Admin with reason)
app.post('/make-server-81e5b189/complaints/:id/close', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || (userData.role !== 'admin' && userData.role !== 'subadmin')) {
      return c.json({ error: 'Not authorized' }, 403);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { reason } = body;

    const complaint = await kv.get(`complaints:${complaintId}`);
    if (!complaint) {
      return c.json({ error: 'Complaint not found' }, 404);
    }

    complaint.status = 'closed_by_authority';
    complaint.timeline.push({
      status: 'closed_by_authority',
      timestamp: new Date().toISOString(),
      message: `Closed by ${userData.role}: ${reason}`
    });
    complaint.closureReason = reason;
    complaint.closedBy = user.id;
    complaint.updatedAt = new Date().toISOString();

    await kv.set(`complaints:${complaintId}`, complaint);

    return c.json({ success: true, complaint });
  } catch (error) {
    console.log('Close complaint error:', error);
    return c.json({ error: 'Failed to close complaint: ' + error.message }, 500);
  }
});

// Get user profile
app.get('/make-server-81e5b189/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    return c.json({ user: userData });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to get profile: ' + error.message }, 500);
  }
});

// Get all contractors (for Sub-Admin)
app.get('/make-server-81e5b189/contractors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allUsers = await kv.getByPrefix('users:');
    const contractors = allUsers
      .filter(u => u && typeof u === 'object' && u.role === 'contractor');

    return c.json({ contractors });
  } catch (error) {
    console.log('Get contractors error:', error);
    return c.json({ error: 'Failed to get contractors: ' + error.message }, 500);
  }
});

// Get all sub-admins (for Main Admin)
app.get('/make-server-81e5b189/subadmins', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`users:${user.id}`);
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Only admin can view sub-admins' }, 403);
    }

    const allUsers = await kv.getByPrefix('users:');
    const subadmins = allUsers
      .filter(u => u && typeof u === 'object' && u.role === 'subadmin');

    return c.json({ subadmins });
  } catch (error) {
    console.log('Get sub-admins error:', error);
    return c.json({ error: 'Failed to get sub-admins: ' + error.message }, 500);
  }
});

// Health check
app.get('/make-server-81e5b189/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);