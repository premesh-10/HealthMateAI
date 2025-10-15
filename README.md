# 🩺 HealthMate AI — Monorepo

**HealthMate AI** is an intelligent healthcare assistant that helps users analyze symptoms, receive triage-level recommendations, and access quick, AI-powered medical insights.  
This monorepo contains both the **frontend (React + Vite)** and **backend (FastAPI)** of the project.
Note: This project is developed strictly for educational purposes and is not intended for professional medical diagnosis or treatment.

---

## 📁 Project Structure

```
project-root/
│
├── frontend/                     
│   ├── node_modules/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── __pycache__/
│   │   ├── main.py
│   │   └── triage_infer.py
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
│
├── Demo_video_HealthMateAI
│
└── README.md                     # Project documentation and instructions

```

---

## ⚙️ Getting Started

### 🧩 Prerequisites

Make sure you have the following installed:

- **Python** 3.10+
- **Node.js** (v18+ recommended)
- **npm** or **bun**

---

### 🧠 Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables, e.g.:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_connection_uri
   DB_NAME=healthmate_db
   CORS_ORIGINS=http://localhost:3000
   ```

3. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be live at: 👉 **http://127.0.0.1:8000**

---

### 💻 Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   # or
   bun install
   ```

2. **Run the frontend**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

   The frontend will be live at: 👉 **http://localhost:8080**

   *(The Vite proxy automatically forwards API requests to the backend — see `vite.config.ts`.)*

---

## 🧩 Development Workflow

- Start **backend** and **frontend** servers in separate terminals.  
- Frontend requests to `/api` are proxied to the FastAPI backend.  
- Modify code in:
  - `frontend/src` → UI, components, and logic  
  - `backend/app` → routes, controllers, and AI inference logic  

---


## 🎨 Frontend Customization

- All assets and UI visuals are under:  
  ```
  frontend/src/assets/
  ```
- Built using **React**, **Vite**, **TypeScript**, **TailwindCSS**, and **shadcn/ui** for modular and scalable design.  
- You can easily update colors, icons, and brand styling here.

---

## 🚀 Deployment

You can deploy both parts separately or together.

### Option 1 — Deploy Separately
- **Backend:** Render / Railway / AWS / GCP  
- **Frontend:** Vercel / Netlify  
- **Database:** MongoDB Atlas

### Option 2 — Docker (Full Stack)
You can use Docker Compose to deploy the entire stack with one command.

---

## 🔧 Environment Variables

| Variable | Description |
|-----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `MONGODB_URI` | MongoDB Atlas connection URI |
| `DB_NAME` | MongoDB database name |
| `CORS_ORIGINS` | Allowed frontend origins |

---

## 🤝 Contributing

Contributions are welcome!  

1. Fork the repository  
2. Create a new branch (`git checkout -b feature-name`)  
3. Commit changes (`git commit -m 'Add new feature'`)  
4. Push to your branch (`git push origin feature-name`)  
5. Open a Pull Request 🚀  

---

## 🧠 Tech Stack Overview

| Layer | Technology |
|-------|-------------|
| **Frontend** | React, Vite, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | FastAPI, Python |
| **Database** | MongoDB Atlas |
| **LLM** | Google Gemini API |
| **Hosting (optional)** | Vercel / Render / Netlify |

---

## 🩵 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

## 👨‍💻 Author

**Developed by:** Premesh Yenduru 
📧 *premesh.sai11@gmail.com*  


---

## 💡 Summary

HealthMate AI combines modern frontend design with AI-powered backend intelligence to deliver an intuitive health triage assistant.
It’s lightweight, easy to deploy, and built with scalability in mind for future healthcare integrations.
Note: This project is developed strictly for educational purposes and is not intended for professional medical diagnosis or treatment.
