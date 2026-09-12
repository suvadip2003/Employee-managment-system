# Employee Attendance Management System

A full-stack MERN application for managing employee attendance, leave requests, and HR operations.

## Features

- **Employee Portal**
  - Daily check-in / check-out with automatic time tracking
  - Real-time working hours calculation
  - Late arrival detection (after 9:00 AM)
  - Personal attendance history with date filters
  - Leave request submission (Annual, Sick, Personal, Unpaid)
  - Leave balance tracking

- **HR Portal**
  - Dashboard with live attendance statistics
  - Attendance overview charts (last 7 days)
  - Leave request distribution charts
  - Employee directory with search and filter
  - Approve / reject leave requests with notes
  - Edit employee profiles (department, position, leave balance)
  - Company-wide attendance monitoring

- **Security**
  - JWT authentication
  - Role-based access control (Employee / HR)
  - Password hashing with bcryptjs
  - Rate limiting on auth endpoints
  - Helmet security headers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS, Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Auth | JSON Web Tokens (JWT) |
| Build | Vite 5 |

## Project Structure

```
├── server/
│   └── src/
│       ├── config/        # Database connection
│       ├── controllers/   # Route handlers
│       ├── middleware/    # Auth & error middleware
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       └── utils/         # Seed script
├── client/
│   └── src/
│       ├── components/    # Navbar, Sidebar, etc.
│       ├── context/       # AuthContext
│       ├── pages/         # All page components
│       ├── services/      # API service layer
│       └── utils/         # Helper functions
├── .env.example
└── README.md
```

## Requirements

- Node.js 18 or higher
- A MongoDB Atlas account (free tier works)
- npm or yarn

## Installation

### 1. Clone / unzip the project

```bash
cd Employee-managment-system-main
```

### 2. Set up environment variables

Copy `.env.example` to `.env` inside the `server/` folder:

```bash
cp .env.example server/.env
```

Edit `server/.env` with your values (see Environment Variables section below).

### 3. Install server dependencies

```bash
cd server
npm install
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

## Environment Variables

Create `server/.env` with the following:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/employee-attendance
JWT_SECRET=replace_this_with_a_long_random_string_at_least_32_chars
PORT=5000
CLIENT_URL=http://localhost:5173
```

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens — keep this private |
| `PORT` | Port the Express server listens on |
| `CLIENT_URL` | Frontend URL for CORS configuration |

## MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **Free Tier** cluster (M0)
3. Under **Database Access**, create a database user with read/write access
4. Under **Network Access**, add your IP address (or `0.0.0.0/0` for development)
5. Click **Connect** → **Connect your application** and copy the connection string
6. Replace `<username>`, `<password>`, and the cluster URL in your `.env`

## Running the Application

### Seed the database (optional but recommended)

From the `server/` directory:

```bash
npm run seed
```

This creates 1 HR account and 5 employee accounts with 30 days of realistic attendance history.

### Start the backend

```bash
cd server
npm run dev
```

The API will be available at `http://localhost:5000`.

### Start the frontend

In a new terminal:

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

## Demo Credentials

Run `npm run seed` from the server directory first, then use these credentials:

| Role | Email | Password |
|------|-------|----------|
| HR Manager | hr@company.com | hr123456 |
| Employee | john.doe@company.com | emp123456 |
| Employee | jane.smith@company.com | emp123456 |
| Employee | bob.wilson@company.com | emp123456 |
| Employee | alice.brown@company.com | emp123456 |
| Employee | charlie.davis@company.com | emp123456 |

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Protected |

### Attendance
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/attendance/checkin` | Employee |
| PUT | `/api/attendance/checkout` | Employee |
| GET | `/api/attendance/my` | Protected |
| GET | `/api/attendance/today` | Protected |

### Leave
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/leave` | Employee |
| GET | `/api/leave/my` | Protected |
| GET | `/api/leave/balance` | Protected |

### HR (HR role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hr/employees` | List all employees |
| GET | `/api/hr/employees/:id` | Employee details |
| PUT | `/api/hr/employees/:id` | Update employee |
| GET | `/api/hr/attendance` | All attendance records |
| GET | `/api/hr/attendance/stats` | Attendance statistics |
| GET | `/api/hr/leaves` | All leave requests |
| PUT | `/api/hr/leaves/:id/review` | Approve/reject leave |

## Security

- Passwords are hashed with bcryptjs (salt rounds: 10)
- JWTs expire after 7 days
- Auth endpoints are rate-limited (15 requests per 15 minutes)
- Helmet middleware sets security headers
- Passwords are never returned in API responses

## Future Improvements

- Export attendance reports to CSV/PDF
- Email notifications for leave approvals
- Overtime tracking
- Multiple HR managers per department
- Mobile app with push notifications
- SSO / OAuth integration
- Advanced reporting and analytics
