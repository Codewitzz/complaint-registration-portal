# Deployment Guide for Supabase Edge Function

## Option 1: Deploy using Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

**Windows (using Scoop):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Windows (using npm):**
```powershell
npm install -g supabase
```

**Or download directly:**
Visit: https://github.com/supabase/cli/releases

### Step 2: Login to Supabase
```powershell
supabase login
```

### Step 3: Link to your project
```powershell
supabase link --project-ref gzdpcczwvtqvjssdvnde
```

### Step 4: Deploy the function
```powershell
supabase functions deploy make-server-81e5b189 --project-ref gzdpcczwvtqvjssdvnde
```

**Note:** You may need to create the function structure first. The function files should be in:
- `supabase/functions/make-server-81e5b189/index.tsx`
- `supabase/functions/make-server-81e5b189/kv_store.tsx`

If the structure is different, you may need to:
1. Create a `supabase` folder at the root
2. Create `supabase/functions/make-server-81e5b189/` folder
3. Copy the files from `src/supabase/functions/server/` to `supabase/functions/make-server-81e5b189/`

---

## Option 2: Deploy via Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project (gzdpcczwvtqvjssdvnde)

### Step 2: Navigate to Edge Functions
1. Click on "Edge Functions" in the left sidebar
2. Find or create the function `make-server-81e5b189`

### Step 3: Upload/Update the function
1. Copy the contents of `src/supabase/functions/server/index.tsx`
2. Paste it into the function editor
3. Also update `kv_store.tsx` if it's a separate file

---

## Option 3: If using Figma Make

If this project was generated from Figma Make:
1. Go to your Figma Make workflow
2. Update the Supabase Edge Function node
3. Copy the updated code from `src/supabase/functions/server/index.tsx`
4. Save and deploy through Figma Make

---

## Verify Deployment

After deployment:

1. **Test the health endpoint:**
   ```
   https://gzdpcczwvtqvjssdvnde.supabase.co/functions/v1/make-server-81e5b189/health
   ```

2. **Check the admin dashboard:**
   - Log in as admin
   - Click "Refresh" button
   - Check browser console for logs
   - You should see all 5 complaints

3. **Check browser console logs:**
   - Open Developer Tools (F12)
   - Look for logs like:
     - `🔑 Admin accessing all complaints`
     - `📦 All complaint keys found: X`
     - `✅ Total filtered complaints: X`

---

## Troubleshooting

### If complaints still don't show:

1. **Check browser console** for any errors
2. **Verify the function is deployed** by checking the health endpoint
3. **Check Supabase logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for any errors in the function execution

4. **Verify the function code:**
   - Make sure `getByPrefixWithKeys` function is included
   - Check that the admin role logic is updated

### Common Issues:

- **Function not found:** Make sure the function name matches exactly: `make-server-81e5b189`
- **Authentication errors:** Verify your access token is valid
- **No complaints showing:** Check if complaints are actually stored in the database

---

## Quick Test Script

You can test if the function is working by running this in your browser console (while logged in as admin):

```javascript
fetch('https://gzdpcczwvtqvjssdvnde.supabase.co/functions/v1/make-server-81e5b189/complaints', {
  headers: {
    'Authorization': `Bearer ${YOUR_ACCESS_TOKEN}`
  }
})
.then(r => r.json())
.then(data => console.log('Complaints:', data));
```

Replace `YOUR_ACCESS_TOKEN` with your actual access token from the admin session.





