# CORS Fix - Deployment Guide

## Problem
Your localhost:3000 is getting blocked because Render is still running old code or has incorrect environment variables.

## Solution

### Step 1: Verify Render Environment Variables

1. Go to: https://dashboard.render.com
2. Select your backend service: `real-time-task-board-ith5`
3. Click the **Environment** tab
4. Check/Update these variables:

```
CLIENT_URL=https://real-time-task-board-web-ujjn.vercel.app
SOCKET_CORS_ORIGIN=https://real-time-task-board-web-ujjn.vercel.app
```

**Important:** No trailing slashes!

### Step 2: Trigger Redeploy

After updating environment variables, Render will automatically redeploy. Or you can:

1. Go to the **Manual Deploy** section
2. Click **Deploy latest commit**
3. Wait for deployment to complete (check the logs)

### Step 3: Verify the Fix

Once deployed, check the logs on Render. You should see:

```
Server running on port 4000
Allowed CORS origins: https://real-time-task-board-web-ujjn.vercel.app, http://localhost:3000, http://localhost:3001
```

### Step 4: Test Locally

1. Make sure your frontend `.env` has:
   ```
   NEXT_PUBLIC_API_URL=https://real-time-task-board-ith5.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://real-time-task-board-ith5.onrender.com
   ```

2. Restart your frontend:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Open http://localhost:3000 and try to login

## Why This Works

The backend code (`server/src/index.ts`) now:
- Strips trailing slashes from environment variables automatically
- Always includes `http://localhost:3000` and `http://localhost:3001` for local development
- Allows both your Vercel frontend AND localhost

## Troubleshooting

### If you still get CORS errors:

1. **Check Render logs** to see what origins are allowed
2. **Clear browser cache** and do a hard refresh (Ctrl+Shift+R)
3. **Check Network tab** in DevTools to see the actual CORS headers
4. **Verify environment variables** don't have typos or extra spaces

### If Render isn't deploying:

1. Check the **Events** tab in Render dashboard
2. Manually trigger a deploy
3. Check if there are any build errors in the logs
