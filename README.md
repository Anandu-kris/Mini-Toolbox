# 🚀 MiniToolbox

A modern all-in-one productivity toolkit built for developers and everyday users.  
MiniToolbox combines multiple useful utilities into a single, fast, and clean web application.

---

## ✨ Features

### 📝 Notes (Rich Editor + Autosave)
- Rich text editor (TipTap)
- Auto-save with debounce
- Tags & search support
- Trash & restore functionality

### 🔐 PassLock (Secure Vault)
- Store passwords & secrets securely
- End-to-end encryption (client-side)
- Auto-lock system
- Folder & favorites support

### ⏱️ Pomodoro Timer
- Focus / Short Break / Long Break modes
- Task tracking
- Notification support

### 🔗 URL Shortener
- Generate short links
- Fast lookup & redirection


## 🛠️ Tech Stack

### Frontend
- ⚛️ React (Vite)
- 🎨 Tailwind CSS + shadcn/ui
- 🔄 React Query
- 🧠 TipTap Editor
- 🎯 Lucide Icons

### Backend
- ⚡ FastAPI
- 🗄️ MongoDB Atlas (Motor async driver)
- 🔐 JWT Authentication
- 🧩 Pydantic Models

### DevOps / Infra
- Docker (planned)
- GitHub Actions (CI/CD planned)
- AWS / EC2 / Amplify (deployment)

---

## 📁 Project Structure

```
MiniToolbox/
│
├── frontend/          # React app  
│   ├── components/  
│   ├── pages/  
│   ├── hooks/  
│   └── services/  
│
├── backend/           # FastAPI server  
│   ├── app/  
│   │   ├── routes/  
│   │   ├── schemas/  
│   │   ├── services/  
│   │   └── core/  
│   └── main.py  
│
└── README.md  
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repo

```
git clone https://github.com/your-username/minitoolbox.git
cd minitoolbox
```

---

### 2️⃣ Backend Setup (FastAPI)

```
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Server runs at:  
👉 http://localhost:8000  

---

### 3️⃣ Frontend Setup (React)

```
cd frontend

npm install
npm run dev
```

App runs at:  
👉 http://localhost:5173  

---

## 🔐 Environment Variables

### Backend (.env)

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:8000
```
