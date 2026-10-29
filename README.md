# 🎯 Bangladesh Carrom Federation (BCF) Portal

An official full-stack portal for the **Bangladesh Carrom Federation (BCF)**, built with **React**, **Node.js (Express)**, and **MySQL** (`bcf` database on `localhost`).

---

## 🌟 Features

- **Live Arena & Match Center**: Real-time board point tracking, white/black pieces pocketed, Queen covered counters, interactive ICF-compliant SVG Carrom Board visualizer.
- **National Rankings & Leaderboard**: Men's and Women's national singles & doubles rankings, Elo rating points, White Slams & Black Slams records.
- **Official Tournament Calendar**: Upcoming, ongoing, and completed national championships, Bangabandhu Premier League, prize pools, and registration deadlines.
- **Registered Player Directory**: Searchable directory by district and club with player win/loss statistics.
- **Affiliated Clubs & Academies**: District clubs across Dhaka, Chittagong, Sylhet, Khulna, Rajshahi, etc.
- **Official News & Notices**: Direct bulletins and press releases from the BCF secretariat.
- **Online Registration System**: Direct submission modal for players and tournament entries saved directly into MySQL.

---

## 🏗️ Architecture & Tech Stack

```
CarromFedaration/
├── .agents/skills/terminal-dark/   # Adopted terminal-dark skill
├── client/                         # React Frontend (Vite)
│   ├── src/
│   │   ├── components/            # Header, LiveMatches, CarromBoardWidget, Tournaments, etc.
│   │   ├── App.jsx
│   │   ├── index.css              # Dark terminal sports aesthetic
│   │   └── main.jsx
│   └── package.json
├── server/                         # Node.js + Express Backend
│   ├── src/
│   │   ├── config/db.js           # MySQL connection pool (mysql2/promise)
│   │   ├── db/schema.sql          # SQL Schema for `bcf` database
│   │   ├── db/init.js             # Auto table creation & initial seed script
│   │   ├── routes/                # REST endpoints (players, matches, tournaments, etc.)
│   │   └── server.js              # Express app
│   └── package.json
├── package.json                    # Root runner (concurrently)
└── README.md
```

---

## 🚀 Getting Started

### 1. Database Configuration
The backend connects to MySQL on `localhost:3306` with database name `bcf`.
Configurations can be found in `server/.env` and `.env`:
```env
PORT=5050
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bcf
CLIENT_URL=http://localhost:5173
```

To initialize or re-seed the tables at any time:
```bash
npm run db:init
```

### 2. Start Both Server & Client
From the project root directory:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1 - Backend Server
npm run server

# Terminal 2 - Frontend Client
npm run client
```

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API URL**: [http://localhost:5050/api](http://localhost:5050/api)
- **API Health Check**: [http://localhost:5050/api/health](http://localhost:5050/api/health)

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service & DB status check |
| `GET` | `/api/stats` | Total players, clubs, tournaments, live matches |
| `GET` | `/api/players` | Filter players by gender, category, search |
| `POST` | `/api/players` | Add new player |
| `GET` | `/api/matches` | Live matches and tournament fixtures |
| `PUT` | `/api/matches/:id/score` | Update live score / board |
| `GET` | `/api/tournaments` | All tournaments |
| `GET` | `/api/clubs` | Affiliated clubs list |
| `GET` | `/api/news` | Federation announcements |
| `GET` | `/api/committee` | Executive committee roster |
| `POST` | `/api/registrations` | Submit online entry form |
