# Migration Guide: Railway to Render

## Prerequisites
1. Create a Render account at https://render.com
2. Connect your GitHub repository to Render

## Step 1: Create PostgreSQL Database
1. Go to Render Dashboard → New → PostgreSQL
2. Name: `bookswap-db`
3. Database Name: `bookswap`
4. User: `bookswap`
5. Plan: Free
6. Click "Create Database"
7. **Copy the Internal Connection String** (not the external one) - you'll need it for the web service
   - Format: `postgresql://user:password@hostname:5432/database`
   - Use the internal URL for better performance and security

## Step 2: Create Redis Instance
1. Go to Render Dashboard → New → Redis
2. Name: `bookswap-redis`
3. Plan: Free
4. Click "Create Redis"
5. **Copy the Internal Connection String** (not the external one) - you'll need it for the web service
   - Format: `redis://hostname:6379`
   - Use the internal URL for better performance and security

## Step 3: Create Web Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Select the repository containing your backend
4. Configure:
   - **Name**: `bookswap-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`

**Important**: Make sure to set the **Root Directory** to `packages/backend` so Render builds from the correct location.

## Step 4: Set Environment Variables
In your web service settings, add these environment variables:

### Required Variables:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render uses this port)
- `DATABASE_URL` = [Your PostgreSQL **Internal** connection string from Step 1]
- `REDIS_URL` = [Your Redis **Internal** connection string from Step 2]
- `JWT_SECRET` = [Generate a strong secret key]
- `JWT_EXPIRES_IN` = `7d`
- `GOOGLE_BOOKS_API_KEY` = [Your Google Books API key]
- `UPLOAD_DIR` = `./uploads`
- `MAX_FILE_SIZE` = `5242880`
- `CORS_ORIGIN` = [Your frontend URL, e.g., https://your-app.vercel.app]

### Optional Variables:
- `FRONTEND_URL` = [Your frontend URL]

## Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Monitor the build logs for any issues

## Step 6: Update Frontend
Update your frontend's API URL to point to your new Render service:
- Format: `https://your-service-name.onrender.com`
- Example: `https://bookswap-backend.onrender.com`

## Step 7: Test Migration
1. Check health endpoint: `https://your-service-name.onrender.com/health`
2. Test authentication endpoints
3. Verify database connectivity
4. Test file uploads

## Important Notes

### Free Tier Limitations:
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes 30+ seconds
- **750 hours/month**: Enough for one always-on service
- **Database**: 90-day retention on free PostgreSQL

### Performance Tips:
- Keep your service active with a cron job or uptime monitor
- Consider upgrading to paid plan for production use
- Monitor your usage in Render dashboard

### Troubleshooting:
- Check build logs if deployment fails
- Verify all environment variables are set correctly
- Ensure DATABASE_URL format is correct (use **Internal** connection string)
- Make sure REDIS_URL uses the **Internal** connection string
- Check CORS settings if frontend can't connect
- Internal URLs provide better performance and don't count against bandwidth limits
- **TypeScript Build Issues**: If you get TypeScript errors, the build now uses a relaxed config for production
- **Root Directory**: Ensure Root Directory is set to `packages/backend` in Render settings

## Migration Checklist
- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Web service configured
- [ ] Environment variables set
- [ ] Service deployed successfully
- [ ] Health check passes
- [ ] Frontend updated with new API URL
- [ ] Authentication tested
- [ ] Database operations tested
- [ ] File uploads tested

## Rollback Plan
If issues occur, you can:
1. Keep Railway running temporarily
2. Switch frontend back to Railway URL
3. Debug Render issues
4. Gradually migrate traffic once stable