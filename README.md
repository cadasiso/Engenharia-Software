# Bookswap - Book Exchange Platform

A full-stack web application for exchanging books between users in the same location. Features include intelligent matching, chat system, trade proposals with book locking, and community rooms.

## Features

### Core Functionality
- **User Authentication** - Secure registration and login with JWT tokens
- **Book Management** - Add books to inventory and wishlist with conditions and photos
- **Smart Matching** - Automatic matching based on location and book preferences
  - Perfect matches (mutual interest)
  - Partial matches (one-way interest)
- **Trade Proposals** - Propose trades with automatic book locking (48 hours)
  - Counter-proposals
  - Lock extensions (up to 2x)
  - Competing interest tracking
- **Real-time Chat** - Direct messaging between matched users
- **Meeting Proposals** - Schedule in-person exchanges
- **Community Rooms** - Create public/private rooms for book clubs or genres
- **User Ratings** - Rate trading partners after completed exchanges
- **User Search** - Find other users with profile pictures and book collections

### Advanced Features
- **Book Scoping** - Books can be global or room-specific
- **Room Management** - Admins can manage members and room settings
- **Profile Customization** - Biography, profile pictures, social links
- **Notification System** - Stay updated on trades and messages

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **Multer** for file uploads
- **Redis** for caching (optional)

## Prerequisites

Before running this project, make sure you have installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Redis** (optional, for caching)

## Quick Start (Copy & Paste)

**Prerequisites:** Make sure PostgreSQL is running and you have Node.js installed.

```bash
# Clone and install
git clone <repository-url>
cd bookswap
npm install
cd packages/backend && npm install
cd ../frontend && npm install
cd ../..

# Create environment files
cat > packages/backend/.env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookswap"
JWT_SECRET="change-this-to-a-random-secret-key-in-production"
PORT=5000
REDIS_URL="redis://localhost:6379"
EOF

cat > packages/frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000
EOF

# Set up database
cd packages/backend
mkdir -p uploads/profiles
npx prisma generate
npx prisma migrate dev --name init
cd ../..

# Done! Now run the app (see "Running the Application" section)
```

**Note:** Update the `DATABASE_URL` in `packages/backend/.env` with your PostgreSQL credentials if different from `postgres:postgres`.

## Detailed Installation

If you prefer step-by-step instructions:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bookswap
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd packages/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ../..
```

### 3. Set Up Environment Variables

#### Backend (.env)

Create `packages/backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bookswap"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server
PORT=5000

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

#### Frontend (.env)

Create `packages/frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Set Up Database

```bash
cd packages/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

### 5. Create Upload Directories

```bash
cd packages/backend
mkdir -p uploads/profiles
```

## Running the Application

### Quick Run (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd packages/backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend && npm run dev
```

**Terminal 3 - Redis (Optional):**
```bash
redis-server
```

Then open `http://localhost:5173` in your browser!

### Alternative: Using Concurrently (Single Terminal)

Install concurrently in the root:
```bash
npm install -D concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"cd packages/backend && npm run dev\" \"cd packages/frontend && npm run dev\""
  }
}
```

Then run:
```bash
npm run dev
```

### Development Mode Details

Backend will run on `http://localhost:5000`
Frontend will run on `http://localhost:5173`

### Production Build

#### Backend
```bash
cd packages/backend
npm run build
npm start
```

#### Frontend
```bash
cd packages/frontend
npm run build
npm run preview
```

## Using the Application

### First Time Setup

1. **Register an Account**
   - Navigate to `http://localhost:5173`
   - Click "Register" and create an account
   - Include your location (e.g., "São Paulo, Brazil")

2. **Add Books**
   - Go to "My Books"
   - Add books to your **Inventory** (books you have)
   - Add books to your **Wishlist** (books you want)

3. **Find Matches**
   - Go to "Matches"
   - Click "Refresh Matches" to find users in your location
   - View perfect matches (mutual interest) and partial matches

4. **Start Trading**
   - Click "Propose Trade" on a match
   - Books are automatically locked for 48 hours
   - Chat with the other user to coordinate
   - Accept, reject, or counter-propose trades

### Key Workflows

#### Creating a Trade Proposal
1. Find a match on the Matches page
2. Click "Propose Trade"
3. Selected books are automatically locked
4. Other user receives the proposal

#### Negotiating a Trade
1. View proposal on Trades page
2. Accept, reject, or counter-propose
3. Extend lock if you need more time (max 2 extensions)
4. Once accepted, coordinate meeting via chat

#### Using Rooms
1. Create or join a room (public or private)
2. Scope books to specific rooms
3. Only room members see room-scoped books in matches

## Project Structure

```
bookswap/
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── migrations/        # Database migrations
│   │   ├── src/
│   │   │   ├── routes/            # API endpoints
│   │   │   ├── services/          # Business logic
│   │   │   ├── middleware/        # Auth, validation
│   │   │   ├── utils/             # Helper functions
│   │   │   └── index.ts           # Server entry point
│   │   ├── uploads/               # User uploads
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── components/        # Reusable components
│       │   ├── contexts/          # React contexts
│       │   ├── pages/             # Page components
│       │   ├── lib/               # API client
│       │   └── main.tsx           # App entry point
│       └── package.json
├── .kiro/                         # Spec documents
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Books
- `GET /api/books` - Get user's books
- `GET /api/books/:id` - Get single book
- `POST /api/books/inventory` - Add to inventory
- `POST /api/books/wishlist` - Add to wishlist
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Matches
- `GET /api/matches` - Get user's matches
- `POST /api/matches/refresh` - Recalculate matches
- `DELETE /api/matches/:id` - Hide match

### Trades
- `GET /api/trades` - Get user's trades
- `POST /api/trades` - Create trade proposal
- `POST /api/trades/:id/accept` - Accept trade
- `POST /api/trades/:id/reject` - Reject trade
- `POST /api/trades/:id/counter` - Counter-propose
- `POST /api/trades/:id/extend-lock` - Extend book lock
- `GET /api/trades/:id/locks` - Get trade locks

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create chat
- `GET /api/chats/:id/messages` - Get messages
- `POST /api/chats/:id/messages` - Send message

### Rooms
- `GET /api/rooms` - Get rooms
- `POST /api/rooms` - Create room
- `POST /api/rooms/:id/join` - Join room
- `GET /api/rooms/:id/members` - Get members

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/:id/inventory` - Get user's inventory
- `GET /api/users/:id/wishlist` - Get user's wishlist
- `GET /api/users/:id/ratings` - Get user's ratings

## Testing

### Run Backend Tests
```bash
cd packages/backend
npm test
```

### Run Property-Based Tests
```bash
cd packages/backend
npm run test:property
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Run `npx prisma migrate dev` to apply migrations

### Port Already in Use
- Backend: Change PORT in `packages/backend/.env`
- Frontend: Change port in `packages/frontend/vite.config.ts`

### Prisma Client Errors
```bash
cd packages/backend
npx prisma generate
```

### File Upload Issues
- Ensure `uploads/profiles` directory exists
- Check file permissions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the spec documents in `.kiro/specs/`

## Acknowledgments

Built with modern web technologies and best practices for a seamless book exchange experience.


## Deployment to Production

### Option 1: Vercel (Frontend) + Railway (Backend) - Easiest

This is the simplest option for getting your app online quickly.

#### Deploy Backend to Railway

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select the `packages/backend` directory

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create a database

4. **Set Environment Variables**
   - Go to your backend service → Variables
   - Add these variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-production-secret-key-change-this
   PORT=5000
   NODE_ENV=production
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Note your backend URL (e.g., `https://your-app.railway.app`)

#### Deploy Frontend to Vercel

1. **Sign up at [Vercel.com](https://vercel.com)**

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set Root Directory to `packages/frontend`

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

**Cost:** Free tier available for both!

---

### Option 2: Heroku (Full Stack) - Traditional

#### Prerequisites
```bash
# Install Heroku CLI
npm install -g heroku
heroku login
```

#### Deploy Backend

```bash
cd packages/backend

# Create Heroku app
heroku create your-app-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix packages/backend heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

#### Deploy Frontend

```bash
cd packages/frontend

# Create Heroku app
heroku create your-app-frontend

# Set environment variables
heroku config:set VITE_API_URL=https://your-app-backend.herokuapp.com

# Add buildpack for static sites
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static

# Create static.json
cat > static.json << 'EOF'
{
  "root": "dist",
  "clean_urls": true,
  "routes": {
    "/**": "index.html"
  }
}
EOF

# Deploy
git subtree push --prefix packages/frontend heroku main
```

**Cost:** ~$7/month for database

---

### Option 3: DigitalOcean App Platform - Balanced

1. **Sign up at [DigitalOcean](https://www.digitalocean.com)**

2. **Create App**
   - Go to Apps → Create App
   - Connect GitHub repository

3. **Configure Components**

   **Backend:**
   - Type: Web Service
   - Source Directory: `packages/backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Run Command: `npm start`
   - Environment Variables:
     ```
     DATABASE_URL=${db.DATABASE_URL}
     JWT_SECRET=your-secret
     PORT=8080
     ```

   **Frontend:**
   - Type: Static Site
   - Source Directory: `packages/frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=${backend.PUBLIC_URL}
     ```

   **Database:**
   - Add PostgreSQL database component

4. **Deploy**
   - Click "Create Resources"
   - App will be live in ~5 minutes

**Cost:** ~$12/month (includes database)

---

### Option 4: AWS (Advanced) - Most Control

#### Using AWS Elastic Beanstalk + RDS

**Backend:**
```bash
# Install EB CLI
pip install awsebcli

cd packages/backend

# Initialize
eb init -p node.js-18 bookswap-backend

# Create environment with database
eb create bookswap-backend-env --database.engine postgres

# Set environment variables
eb setenv JWT_SECRET=your-secret NODE_ENV=production

# Deploy
eb deploy
```

**Frontend (S3 + CloudFront):**
```bash
cd packages/frontend

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Cost:** ~$20-50/month depending on usage

---

### Option 5: Docker + Any VPS (Most Flexible)

#### Create Dockerfiles

**Backend Dockerfile** (`packages/backend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**Frontend Dockerfile** (`packages/frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**docker-compose.yml** (root):
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: bookswap
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./packages/backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/bookswap
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./packages/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Deploy to any VPS (DigitalOcean, Linode, AWS EC2):**
```bash
# SSH into your server
ssh user@your-server-ip

# Clone repo
git clone <your-repo>
cd bookswap

# Set environment variables
export DB_PASSWORD=your-db-password
export JWT_SECRET=your-jwt-secret

# Deploy
docker-compose up -d
```

**Cost:** ~$5-10/month for basic VPS

---

## Production Checklist

Before deploying to production, make sure to:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update `DATABASE_URL` with production database credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up proper CORS configuration
- [ ] Configure file upload limits and storage
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Add rate limiting to API endpoints
- [ ] Review and update security headers
- [ ] Test all features in production environment
- [ ] Set up domain name and DNS
- [ ] Configure email service for notifications (if needed)

## Recommended Production Stack

For a production-ready deployment, we recommend:

- **Frontend:** Vercel or Netlify (automatic HTTPS, CDN, easy deploys)
- **Backend:** Railway or Render (easy Node.js hosting, automatic deploys)
- **Database:** Railway PostgreSQL or Supabase (managed, automatic backups)
- **File Storage:** AWS S3 or Cloudinary (for profile pictures and book photos)
- **Monitoring:** Sentry (error tracking) + LogRocket (session replay)

This combination provides:
- ✅ Free tier or low cost (~$10-20/month)
- ✅ Automatic HTTPS
- ✅ Easy deployments from GitHub
- ✅ Automatic scaling
- ✅ Good performance globally
