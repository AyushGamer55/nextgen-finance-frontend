# 🚀 NextGen Finance Frontend

A modern, responsive **React-based financial dashboard** with a beautiful UI powered by **shadcn/ui**, **Radix UI**, and **Tailwind CSS**. Built with **Vite** for blazing-fast development and production builds.

---

## ✨ Features

### 🔹 Dashboard & Analytics

* 📊 **Interactive Charts & Graphs**
  Real-time visualization of financial data using Recharts
  
* 💰 **Transaction Overview**
  Display income, expenses, and balance at a glance

* 📈 **Category-wise Breakdown**
  Visual representation of spending by category

* 🎯 **Budget Tracking**
  Monitor budgets and get spending alerts

---

### 🔹 UI Components (shadcn/ui)

* 🎨 **Pre-built Components**
  Accordion, Dialog, Dropdown, Tabs, Toast notifications, etc.

* 🎭 **Dark Mode Support**
  Seamless theme switching with next-themes

* ♿ **Accessible Design**
  Built with Radix UI for WCAG compliance

* ⚡ **Performance Optimized**
  Lazy loading and code splitting

---

### 🔹 Forms & Validation

* ✅ **React Hook Form Integration**
  Efficient form handling with minimal re-renders

* 🛡️ **Zod Validation**
  Type-safe schema validation

* 📝 **Rich Input Components**
  Date pickers, selects, checkboxes, radio buttons

---

### 🔹 Data Management

* 🔄 **React Query (TanStack Query)**
  Server state management and caching

* 📡 **Axios Integration**
  HTTP client for API communication

* 🔗 **Socket.IO Support**
  Real-time updates and notifications

---

## 🧱 Project Structure

```
/src
  /components      # Reusable React components
  /pages           # Page components & routes
  /context         # React Context for state management
  /hooks           # Custom React hooks
  /utils           # Helper functions & utilities
  /lib             # Third-party library configurations
  /data            # Mock/static data
  /test            # Test files

/public            # Static assets

App.jsx            # Main app component
main.jsx           # Entry point
index.css          # Global styles
```

---

## ⚙️ Setup

### Prerequisites

* Node.js >= 18 (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
* npm or yarn

### Installation

```bash
# Step 1: Clone the repository
git clone https://github.com/AyushGamer55/nextgen-finance-frontend.git

# Step 2: Navigate to the project directory
cd nextgen-finance-frontend

# Step 3: Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Running Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:5173`

---

## 🏗️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build locally
npm run preview

# Run linting
npm lint

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 🛠 Tech Stack

* **Frontend Framework:** React 18+
* **Language:** TypeScript
* **Build Tool:** Vite
* **UI Components:** shadcn/ui, Radix UI
* **Styling:** Tailwind CSS
* **Form Management:** React Hook Form
* **Validation:** Zod
* **State Management:** React Context + React Query
* **HTTP Client:** Axios
* **Real-time:** Socket.IO Client
* **Charts:** Recharts
* **Theme:** next-themes
* **Testing:** Vitest, React Testing Library
* **Linting:** ESLint

---

## 📊 API Integration

The frontend communicates with the backend API at the configured `VITE_API_URL`:

```javascript
// Example API calls
GET  /api/analysis/:userId       # Fetch financial analysis
POST /api/upload                 # Upload CSV for analysis
GET  /api/transactions           # Get transactions
POST /api/budget                 # Create/update budget
```

---

## 🧪 Testing

Run unit tests:

```bash
npm run test
```

Watch mode for development:

```bash
npm run test:watch
```

---

## 🚀 Building & Deployment

### Production Build

```bash
npm run build
```

Generates optimized files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deployment Options

* **Vercel:** Connect GitHub repo directly
* **Netlify:** Connect GitHub repo with build command `npm run build`
* **Docker:** Use provided Dockerfile for containerization
* **Traditional Hosting:** Deploy `dist/` folder to any static host

---

## ⚠️ Notes

* Frontend is **fully typed with TypeScript** for better developer experience
* **Responsive design** works seamlessly on mobile, tablet, and desktop
* Designed to work with the **NextGen Finance Backend** (Node.js + MongoDB)
* Requires backend server running for full functionality

---

## 🚀 Future Improvements

* 🔐 Enhanced authentication UI (MFA, biometric login)
* 📊 Advanced data visualization & custom reports
* 📱 Mobile app version with React Native
* 🤖 AI-powered financial recommendations
* 💬 Real-time notifications system
* 🌐 Multi-language support (i18n)
* 📈 Advanced charting library integration

---

## ⭐ Status

✔ Frontend UI fully functional
✔ Component library integrated
✔ Form validation working
✔ Backend integration is completed
🚧 Real-time features being added.