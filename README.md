# 🩺 HealthMate AI 
**HealthMate AI** is an intelligent healthcare assistant that helps users analyze symptoms, receive triage-level recommendations, and access quick, AI-powered medical insights.  
This monorepo contains both the **frontend (React + Vite)** and **backend (FastAPI)** of the project.

> ⚠️ **Note:** This project is developed strictly for educational purposes and is **not intended for professional medical diagnosis or treatment**.

---

## 🎬 Demo Video

🎥 **Watch the demo of HealthMate AI here:**  
👉 [**Click to View on Google Drive**](https://drive.google.com/file/d/1aQ-99-tg6VqsXbDNgbk-9TTQOx3ABkP9/view?usp=sharing)

*(The video demonstrates the setup process, symptom analysis flow, and AI triage recommendations.)*

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
   Fill in your environment variables:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   MONGODB_URI=your_mongodb_connection_uri
   DB_NAME=healthmate_db
   CORS_ORIGINS=http://localhost:8080
   ```

3. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be live at 👉 **http://127.0.0.1:8000**

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

   The frontend will be live at 👉 **http://localhost:8080**

   *(The Vite proxy automatically forwards API requests to the backend — see `vite.config.ts`.)*

---

## 🧩 Development Workflow

- Run **backend** and **frontend** servers in separate terminals.  
- Frontend requests to `/api` are proxied to the FastAPI backend.  
- Modify code in:
  - `frontend/src` → UI, components, and logic  
  - `backend/app` → routes, controllers, and AI inference logic  

---

## 🎨 Frontend Customization

- All assets and UI visuals are located under:  
  ```
  frontend/src/assets/
  ```
- Built with **React**, **Vite**, **TypeScript**, **TailwindCSS**, and **shadcn/ui** for modern and scalable design.  
- You can easily update brand colors, typography, and UI components here.

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
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB Atlas |
| **AI Model** | Google Gemini API |
| **Hosting (optional)** | Vercel / Render / Netlify |

---

## 🩵 License

This project is licensed under the **MIT License** — you’re free to use, modify, and distribute it.

---

## 👨‍💻 Author

**Developed by:** *Premesh Yenduru*  
📧 *premesh.sai11@gmail.com*

---

## 💡 Summary

**HealthMate AI** combines modern frontend design with AI-powered backend intelligence to deliver an intuitive health triage assistant.  
It’s lightweight, scalable, and designed for educational use in exploring healthcare + AI integration.

> 🩺 *Disclaimer: This application is not a substitute for professional medical advice, diagnosis, or treatment.*
