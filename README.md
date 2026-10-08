# 🛡️ HireShield — AI-Powered Smart Recruitment Platform

> **Hire Smarter. Screen Faster. Build Better Teams.**

HireShield is an intelligent recruitment system that reduces hiring team workload by automatically screening applicants, validating mandatory requirements, detecting suspicious content, and providing transparent, explainable match scores.

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, React Router, Axios |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (stateless) + BCrypt |
| **File Storage** | Cloudinary |
| **Deployment** | Frontend: Vercel, Backend: Render |

## 🚀 Features

### Core AI Screening
- **Intelligent Resume Analysis** — Matches resumes against job requirements (skills, experience, qualifications)
- **Mandatory Requirement Validation** — Auto-validates must-have criteria before reaching hiring dashboard
- **AI Content Detection** — Confidence-based detection of AI-generated/fabricated resume content
- **Screening Answer Evaluation** — Checks answer relevance and authenticity
- **Explainable Match Scores** — Transparent scoring broken into skills, experience, qualification, and relevance

### Hiring Team
- Multi-step registration with organization setup
- Job creation with screening criteria (Mandatory/Preferred)
- Custom screening questions
- Applicant management dashboard with filters
- Internal notes and status management
- Analytics dashboard

### Applicant
- Professional profile with resume upload
- Job marketplace with search and filters
- Application tracking pipeline
- Clear rejection reasons
- Match score visibility

## 📁 Project Structure

```
├── backend/                    # Spring Boot Java Backend
│   ├── src/main/java/com/hireshield/
│   │   ├── config/            # Security, Cloudinary, MongoDB configs
│   │   ├── controller/        # REST API controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── exception/         # Global error handling
│   │   ├── model/             # MongoDB document models
│   │   ├── repository/        # MongoDB repositories
│   │   ├── security/          # JWT provider, filter, user details
│   │   └── service/           # Business logic + AI screening engine
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context
│   │   ├── pages/             # All page components
│   │   └── services/          # API service layer
│   └── vercel.json
└── render.yaml                # Render deployment config
```

## ⚡ Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MongoDB Atlas cluster
- Cloudinary account

### Backend
```bash
cd backend
# Set environment variables (copy .env.example)
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing (min 256 bits) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## 🚀 Deployment

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Set `VITE_API_URL` environment variable

### Backend → Render
1. Connect GitHub repo to Render
2. Use Docker deployment with `backend/Dockerfile`
3. Set all environment variables

## 📊 Application Workflow

```
Hiring Team: Register → Profile → Org Setup → Create Job → Define Criteria → Publish
Applicant:   Register → Profile → Resume → Browse → Apply → Auto Screen → Result

Eligible:  Apply → Screen → Eligible → Shortlist → Interview → Selected
Rejected:  Apply → Screen → Rejected (with clear explanation)
```

## ⚖️ AI Ethics

- AI **assists** screening — never replaces human judgment
- All detection uses **confidence levels**, never claims certainty
- Every automated decision includes **explainable reasoning**
- **Flagged** applications go to manual review, not auto-reject
- Full **audit trail** of all status changes

---

Built with ❤️ for smarter, fairer recruitment.
