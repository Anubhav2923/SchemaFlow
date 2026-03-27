# 🌌 SchemaFlow

**Design. Visualize. Engineer.** Build complex database architectures with a premium visual experience and AI-powered intelligence.

---

![Hero Dashboard](frontend/public/dashboard.png)

## 🚀 Overview

SchemaFlow is a modern, high-performance database schema designer that bridges the gap between design and development. It provides a visual canvas powered by ReactFlow to architect your databases, generate AI-optimized schemas, and export deployment-ready code in seconds.

## ✨ Core Features

### 🛠️ Visual Schema Builder
*   **Intuitive Canvas**: Drag-and-drop tables, columns, and relationships.
*   **Smart Handles**: Connect foreign keys with a simple drag motion.
*   **Automatic Layout**: Professional auto-arrangement to keep your diagrams clean.


### 🌑 Nebula UI Experience
*   **Pixel-Perfect Rendering**: High-performance, crisp text at every zoom level.
*   **Deep Dark Mode**: Premium "Nebula" aesthetic with glassmorphism effects.
*   **Interactive Tilted Cards**: High-fidelity UI for project selection and templates.

### 🏗️ Production Ready
*   **SQL Export**: Export your design to Postgres and other industry standards.
*   **Industry Templates**: Pre-built schemas for Social Graphs, FinTech, E-commerce, and more.
*   **Project Persistence**: Save and manage multiple database designs.

---

## 🖼️ Showcase

### 📊 Dashboard Overview
![Dashboard](frontend/public/dahboard_image.png)
*Track and manage your schema projects with our comprehensive dashboard analytics.*

### 🎨 Workspace Canvas
![Workspace](frontend/public/workspace.png)
*Architect complex relationships with ease using our purpose-built canvas.*

### 📄 Documentation & Code
![Documentation](frontend/public/docs.png)
*View interactive documentation and export schemas in one click.*

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **Canvas Engine**: ReactFlow
- **Styling**: Tailwind CSS v4 (Nebula Design System)
- **State Management**: Zustand + TanStack Query
- **Animations**: Framer Motion

### Backend
- **Server**: Fastify (Node.js)
- **Database**: PostgreSQL
- **Security**: Clerk Authentication
- **Language**: TypeScript

---

## ⚙️ Local Installation

Follow these steps to set up SchemaFlow on your local machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)
- A [Clerk](https://clerk.com/) account for authentication.

### 2. Clone the Repository
```bash
git clone https://github.com/Anubhav2923/SchemaFlow.git
cd SchemaFlow
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:2/schemaflow
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
VITE_API_BASE_URL=http://localhost:5001/api
```

### 5. Running the Application
From the **root** folder:
```bash
npm install
npm run dev
```
This will start both the backend and frontend concurrently. 
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

---

## 📄 License
This project is licensed under the **ISC License**.

---

Developed with ❤️ by [Anubhav](https://github.com/Anubhav2923)
