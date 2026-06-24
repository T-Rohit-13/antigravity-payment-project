# RetireQuest

RetireQuest is a full-stack, gamified retirement savings platform designed for Gen Z in India. It empowers users to start their retirement journey early through streaks, quests, hints, and automated round-up/cashback saves.

## Prerequisites

Before you start, ensure you have:
- Node.js installed (v18 or higher)
- A Supabase project set up

## Setup Instructions

### 1. Supabase Initialization
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/).
2. Open the **SQL Editor**.
3. Copy the contents of `supabase_schema.sql` (located in the root of this project) and run it to create the tables and seed data.
4. Go to **Project Settings** > **API**.
5. Copy your **Project URL** and **Service Role Key** (under Project API keys).

### 2. Backend Server Setup
1. CD into the server directory:
   ```bash
   cd retirequest/server
   ```
2. Open `.env` and paste your Supabase keys:
   ```env
   PORT=5000
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secure-jwt-secret
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Express server:
   ```bash
   npm start
   ```

### 3. Frontend Client Setup
1. Open a new terminal and CD into the client directory:
   ```bash
   cd retirequest/client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and automatically proxies API requests to the backend server.
