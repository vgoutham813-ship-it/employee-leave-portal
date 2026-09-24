# 🏢 Employee Leave Portal

A full-stack Employee Leave Management System built with **React**, **Node.js/Express**, and **SQLite**. Employees can apply for leave, track their history, and managers can approve or reject requests — all from a clean, modern dashboard.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based login/register with role access |
| 📋 Apply for Leave | Annual, Sick, Casual, Maternity, Paternity, Unpaid |
| 📊 Leave Balance | Real-time balance tracking per leave type |
| ✅ Approval Workflow | Managers/Admins can approve or reject with comments |
| 👥 Employee Directory | View all employees and update their roles |
| 📈 Admin Dashboard | Stats: pending, approved, rejected, total employees |
| 🗓️ Leave History | Filter and track all personal leave requests |
| 🔒 Role-Based Access | `employee`, `manager`, `admin` roles |

---

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API
- **SQLite** (via `better-sqlite3`) — local file-based database, zero setup
- **JWT** (`jsonwebtoken`) — authentication
- **bcryptjs** — password hashing

### Frontend
- **React 18** + **Vite** — fast dev environment
- **Tailwind CSS** — utility-first styling
- **React Router v6** — client-side routing
- **Axios** — HTTP requests
- **react-hot-toast** — notifications
- **lucide-react** — icons

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ (https://nodejs.org)
- npm v8+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/employee-leave-portal.git
cd employee-leave-portal
```

### 2. Set up the Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
npm run dev
```
> Server starts at **http://localhost:5000**

### 3. Set up the Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
> App opens at **http://localhost:5173**

---

## 🔑 Default Admin Credentials

Once the backend starts, a default admin is created:

| Field | Value |
|---|---|
| Email | `admin@company.com` |
| Password | `admin123` |
| Role | `admin` |

> ⚠️ Change these credentials immediately in production!

---

## 📁 Project Structure

```
employee-leave-portal/
│
├── backend/
│   ├── db/
│   │   └── database.js          # SQLite init + schema
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT auth + role guard
│   ├── routes/
│   │   ├── auth.js              # Register, login, profile
│   │   ├── leaves.js            # Apply, view, cancel leaves
│   │   └── admin.js             # Approve/reject, employee mgmt
│   ├── data/                    # SQLite DB file (auto-created)
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── services/
    │   │   └── api.js           # All API calls via Axios
    │   ├── components/
    │   │   └── Layout.jsx       # Sidebar + nav shell
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ApplyLeave.jsx
    │   │   ├── LeaveHistory.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── Employees.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new employee |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get current user + balance |

### Leaves (employee)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/leaves/apply` | Submit leave request |
| GET | `/api/leaves/my-leaves` | Get my leave history |
| GET | `/api/leaves/balance` | Get my leave balance |
| PUT | `/api/leaves/cancel/:id` | Cancel pending request |

### Admin (manager/admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/leaves` | All leave requests (filterable) |
| PUT | `/api/admin/leaves/:id` | Approve or reject leave |
| GET | `/api/admin/employees` | All employees + balances |
| GET | `/api/admin/stats` | Dashboard stats |
| PUT | `/api/admin/employees/:id/role` | Update employee role |

---

## ☁️ Cloud Deployment

### Database: Upgrade to PostgreSQL / Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Get your connection string from Settings → Database
3. Install `pg`: `npm install pg`
4. Replace `better-sqlite3` with `pg` in `db/database.js`
5. Set `DATABASE_URL` in `.env`

### Backend: Deploy to Render / Railway
- **Render**: Connect GitHub repo → choose `backend/` as root → set env vars
- **Railway**: `railway up` from the backend folder

### Frontend: Deploy to Vercel / Netlify
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```
Update `VITE_API_URL` in frontend `.env.production` to point to your deployed backend.

---

## 📜 License

MIT — free to use, modify, and distribute.
