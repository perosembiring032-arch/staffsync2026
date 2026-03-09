# StaffSync — Staff Monitoring Dashboard System

A full-stack web application to monitor staff performance, daily targets, break time, and permissions.

## System Overview

- **47 Staff Members** + **1 Master Admin**
- Staff input daily member IDs and deposit data
- System calculates break time based on target completion
- Admin monitored via IP whitelist

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB (MongoDB Atlas) |
| Frontend | HTML + Tailwind CSS + Vanilla JS |
| Auth | JWT Tokens |

---

## Project Structure

```
staff-monitor/
├── backend/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── seed.js           # Database seeder
│   ├── middleware/
│   │   ├── auth.js           # JWT auth middleware
│   │   └── ipWhitelist.js    # Admin IP restriction
│   ├── models/
│   │   ├── Staff.js          # Staff collection
│   │   ├── MemberInput.js    # Daily member inputs
│   │   ├── BreakStatus.js    # Break time records
│   │   └── Permission.js     # Permission usage logs
│   ├── routes/
│   │   ├── auth.js           # Login endpoints
│   │   ├── members.js        # Member input endpoints
│   │   ├── permissions.js    # Permission endpoints
│   │   └── staff.js          # Staff management
│   ├── server.js             # Express app entry
│   ├── .env.example          # Environment template
│   └── package.json
└── frontend/
    ├── index.html            # Landing page
    ├── staff/
    │   └── index.html        # Staff portal (SPA)
    ├── admin/
    │   └── index.html        # Admin control panel (SPA)
    └── shared/
        └── api.js            # Shared API utilities
```

---

## Setup Instructions

### 1. Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/staff_monitor
JWT_SECRET=your_very_secure_random_secret_here
JWT_EXPIRES_IN=8h
ADMIN_ALLOWED_IPS=192.168.1.10,127.0.0.1
NODE_ENV=development
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- 1 Admin: `username=admin`, `password=Admin@123456`
- 47 Staff: `username=staff001~staff047`, `password=Staff@123456`

### 5. Start the Server

```bash
npm start
# or for development:
npm run dev
```

Access at: **http://localhost:5000**

---

## Routes

| Route | Description |
|-------|-------------|
| `GET /` | Landing page |
| `GET /staff` | Staff portal |
| `GET /admin` | Admin portal |

### API Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/admin` | Admin login (IP restricted) |
| POST | `/api/auth/login/staff` | Staff login |
| GET | `/api/auth/me` | Get current user |

#### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/members/input` | Staff adds member entry |
| GET | `/api/members/today` | Staff views today's data |
| GET | `/api/members/admin/all` | Admin views all staff |

#### Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/permissions/use` | Use a permission |
| GET | `/api/permissions/today` | View today's permissions |
| GET | `/api/permissions/admin/logs` | Admin views all logs |

#### Staff Management (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | List all staff |
| POST | `/api/staff` | Create staff |
| PUT | `/api/staff/:id` | Update staff |
| GET | `/api/staff/ranking/today` | Performance ranking |

---

## Business Rules

### Daily Target
- Each staff must input **3 valid members**
- Each member deposit must be **≥ Rp 50,000**
- Deposits below minimum are **rejected**
- Maximum **3 members per day**
- No **duplicate member IDs**

### Break Time
| Condition | Break Time |
|-----------|-----------|
| Target reached (3/3) | **2 hours** |
| Target not reached | **1 hour** |

### Permissions
Each staff gets per day:
- 🚽 **Toilet break** — 10 minutes (once)
- 🚬 **Smoking break 1** — 10 minutes (once)
- 🚬 **Smoking break 2** — 10 minutes (once)

All permissions **reset at midnight**.

### Security
- Passwords hashed with bcryptjs (12 rounds)
- JWT tokens expire in 8 hours
- Admin login restricted to whitelisted IPs
- Rate limiting: 100 req/15min general, 10 login attempts/15min
- Session auto-expires

---

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Set `ADMIN_ALLOWED_IPS` to your actual admin IP
3. Use a strong `JWT_SECRET` (32+ random characters)
4. Consider using PM2 or Docker for process management
5. Add HTTPS via nginx or Cloudflare

```bash
# Example with PM2
npm install -g pm2
pm2 start server.js --name staffsync
pm2 save
```

---

## Default Credentials

> ⚠️ **Change all passwords immediately after first login!**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@123456` |
| Staff 1-47 | `staff001`–`staff047` | `Staff@123456` |
