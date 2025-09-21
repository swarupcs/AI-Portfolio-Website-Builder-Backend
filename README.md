
# AI-Powered Portfolio Builder - Backend

This repository contains the **backend services** for the AI-Powered Portfolio Builder, a platform that enables users to automatically generate, edit, and publish professional portfolios using Generative AI.

---

## 🚀 Features

- **User Authentication & Management**  
  - Email/password signup and login with JWT authentication  
  - OAuth support (Google/GitHub)  

- **Resume & Profile Integration**  
  - Upload resumes (PDF/DOCX)  
  - Optional LinkedIn/GitHub data fetch for portfolio enrichment  

- **AI-Powered Content Generation**  
  - Parse resumes into structured JSON (summary, skills, projects, education)  
  - Rewriting and summarizing content using LLMs (OpenAI GPT)  
  - Section-wise content refinement and regeneration  

- **Portfolio Management**  
  - CRUD operations for portfolios  
  - Template assignment and storage of structured portfolio content  

- **Memory & Personalization**  
  - Store user preferences and past edits  
  - Generate personalized suggestions based on previous interactions  

- **Tooling & Orchestration**  
  - LangChain for LLM orchestration, tool calling, and memory management  
  - LangGraph for complex AI workflow management  

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js, MongoDB  
- **AI Layer:** OpenAI GPT, LangChain, LangGraph, Embeddings (Vector Store)  
- **File Storage:** AWS S3 (or local storage for development)  
- **Dev Tools:** Docker, Nodemon, ESLint, Prettier  

---

## 📦 Project Structure

```

/backend
├─ src/
│  ├─ controllers/       # API controllers
│  ├─ models/            # Mongoose schemas (User, Portfolio, AIRequestLog)
│  ├─ routes/            # Express routes
│  ├─ services/          # AI & tool integration services
│  ├─ utils/             # Helpers, validators, middleware
│  └─ app.js             # Express app entry
├─ config/               # Env configuration
├─ tests/                # Unit & integration tests
├─ Dockerfile
├─ package.json
└─ README.md

````

---

## ⚡ API Endpoints (Sample)

- `POST /api/auth/register` → User signup  
- `POST /api/auth/login` → User login  
- `POST /api/uploads/resume` → Upload resume  
- `POST /api/ai/parse-resume` → Parse resume to structured JSON  
- `POST /api/ai/generate-summary` → Generate AI-powered summary  
- `POST /api/ai/generate-project` → Rewrite project descriptions  
- `POST /api/ai/suggest-template` → Suggest templates based on skills/role  
- `POST /api/portfolio` → Create portfolio  
- `GET /api/portfolio/:id` → Get portfolio by ID  
- `PUT /api/portfolio/:id` → Update portfolio  

---

## 📌 Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/yourusername/ai-portfolio-backend.git
   cd ai-portfolio-backend
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file with:

   ```env
   PORT=8080
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret

   ```

4. **Run the server**

   ```bash
   npm run dev
   ```


---

## 🔒 Security & Best Practices

* Passwords are hashed with bcrypt
* JWT for secure session management
* Input validation using Joi
* AI outputs are sanitized and validated before storing

---





## For cloudinary setup nodejs

```
npm install cloudinary multer multer-storage-cloudinary


```