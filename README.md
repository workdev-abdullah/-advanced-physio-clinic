# Advanced Physiotherapy Clinic

A full-stack physiotherapy clinic appointment and management platform built with the MERN stack, Firebase Phone Authentication, Razorpay, and automated PDF appointment receipts.

## Live Application

**Patient Website:**  
https://advanced-physio-frontend.onrender.com

**Backend API:**  
https://advanced-physio-clinic.onrender.com

**GitHub Repository:**  
https://github.com/workdev-abdullah/-advanced-physio-clinic

**Backend Health Check:**  
https://advanced-physio-clinic.onrender.com/health

---

## Overview

Advanced Physiotherapy Clinic is a production-oriented web application for managing physiotherapy appointments.

The platform supports:

- Patient phone authentication using Firebase OTP
- Clinic appointment scheduling
- Slot availability and temporary slot locking
- Home visit booking
- GPS-based distance calculation
- Home visit price calculation
- Razorpay online payments
- Razorpay webhook verification
- Patient appointment history
- Admin dashboard and booking management
- Automated PDF appointment receipts
- Responsive frontend for desktop and mobile devices

The project is structured as a separate React frontend and Node.js/Express backend with MongoDB Atlas as the production database.

---

---

## 🧪 Demo & Test Credentials

The application can be tested using the following demo configuration.

### 🔐 Admin Demo Access

For testing the administrative dashboard:

```text
Phone Number: 6297116747
OTP: 000000

Open Live Website
      ↓
Login with Demo/Test Account
      ↓
Select Clinic or Home Visit
      ↓
Choose an Available Slot
      ↓
Enter Patient Details
      ↓
Proceed to Razorpay Test Checkout
      ↓
Use the Razorpay Test Card
      ↓
Complete Test Payment
      ↓
Razorpay Webhook Verification
      ↓
Booking Confirmation
      ↓
PDF Receipt Generation
      ↓
View Booking in Profile

## Core Booking Workflow

### Clinic Appointment

```text
User Login
    ↓
Firebase Phone OTP
    ↓
View Available Slots
    ↓
Select Date
    ↓
Select Appointment Slot
    ↓
Lock Slot
    ↓
Enter Patient Details
    ↓
Create Razorpay Order
    ↓
Razorpay Checkout
    ↓
Payment Captured
    ↓
Razorpay Webhook
    ↓
Webhook Signature Verification
    ↓
Booking Creation
    ↓
PDF Receipt Generation
    ↓
Success Page
    ↓
Patient Profile
```

### Home Visit

```text
User Login
    ↓
Select Home Visit
    ↓
GPS Location Permission
    ↓
Location Accuracy Validation
    ↓
Distance Calculation
    ↓
Home Visit Price Calculation
    ↓
Patient & Address Details
    ↓
Create Razorpay Order
    ↓
Razorpay Checkout
    ↓
Payment Captured
    ↓
Razorpay Webhook
    ↓
Webhook Signature Verification
    ↓
Home Visit Booking Creation
    ↓
PDF Receipt Generation
    ↓
Success Page
    ↓
Patient Profile
```

---

## Authentication Flow

The application uses Firebase Phone Authentication for OTP-based login.

```text
Phone Number
    ↓
reCAPTCHA
    ↓
Firebase OTP
    ↓
OTP Verification
    ↓
Firebase ID Token
    ↓
Axios Request
    ↓
Express Backend
    ↓
Firebase Admin verifyIdToken()
    ↓
MongoDB User
    ↓
Authenticated Request
```

Private API requests send the Firebase ID token using the `Authorization: Bearer <token>` header.

The backend resolves the authenticated phone number to the application's MongoDB `User` record and uses that user's MongoDB `_id` for protected application data.

---

## Payment Flow

Razorpay handles online appointment payments.

```text
Frontend
    ↓
Backend creates order
    ↓
Razorpay Checkout
    ↓
Payment Captured
    ↓
Razorpay Webhook
    ↓
HMAC Signature Verification
    ↓
Payment Record Updated
    ↓
Booking Created
    ↓
PDF Receipt Generated
```

### Production Webhook

```text
https://advanced-physio-clinic.onrender.com/api/payment/webhook
```

The webhook is intentionally not protected by application authentication because it is called by Razorpay.

---

## Appointment Scheduling

The scheduling system includes:

- Automatic slot generation
- 45-minute appointment sessions
- Buffer time between appointments
- Morning and evening clinic sessions
- Break interval protection
- Past-slot filtering
- Temporary slot locking
- Booked-slot protection
- Friday clinic closure
- Sunday evening closure rules

### Slot Lifecycle

```text
AVAILABLE
    ↓
LOCKED
    ↓
Payment Successful
    ↓
BOOKED
```

If a lock expires before completion:

```text
LOCKED
    ↓
Lock Expired
    ↓
AVAILABLE
```

---

## Home Visit System

Home visits use the patient's GPS location and the clinic's configured coordinates.

The workflow validates:

- Latitude and longitude
- Location accuracy
- Distance from the clinic
- Maximum supported distance
- Calculated visit price
- Patient address

The clinic configuration also stores home visit pricing parameters.

---

## PDF Receipt System

After successful payment and webhook verification, the backend creates an appointment receipt using PDFKit.

The receipt includes the available booking information such as:

- Booking ID
- Patient name
- Phone number
- Visit type
- Pain area
- Duration
- Appointment date
- Appointment time
- Payment status
- Home visit address when applicable
- Home visit distance when applicable
- Home visit pricing information when applicable

Appointment dates and times are formatted for the `Asia/Kolkata` timezone.

---

## Patient Profile

Authenticated patients can view their appointment history.

The profile uses the authenticated MongoDB user ID to retrieve that user's bookings.

For each booking, the profile can display appointment details and the available receipt link.

---

## Admin Dashboard

The admin area provides visibility into clinic operations, including:

- Appointment bookings
- Patient details
- Booking status
- Payment status
- Slot information
- Home visit bookings

Access to protected administrative functionality is controlled by the application's authentication and role logic.

---

## Architecture

```text
                    ┌─────────────────────────┐
                    │     React Frontend      │
                    │       Render            │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS / REST API
                                 ▼
                    ┌─────────────────────────┐
                    │ Node.js + Express API   │
                    │        Render           │
                    └──────┬──────┬───────────┘
                           │      │
                 ┌─────────┘      └─────────────┐
                 ▼                              ▼
        ┌──────────────────┐          ┌──────────────────┐
        │  MongoDB Atlas   │          │     Razorpay     │
        │   Application DB │          │ Payment Gateway  │
        └──────────────────┘          └────────┬─────────┘
                                               │
                                               │ Webhook
                                               ▼
                                      ┌──────────────────┐
                                      │ Express Webhook  │
                                      │ Signature Check   │
                                      └──────────────────┘

        ┌──────────────────┐
        │ Firebase Auth    │
        │ Phone OTP        │
        └──────────────────┘
```

---

## Technology Stack

### Frontend

- React.js
- React Router
- Axios
- Tailwind CSS
- Firebase Authentication
- Vite

### Backend

- Node.js
- Express.js
- Mongoose
- Firebase Admin SDK
- Razorpay
- PDFKit
- Axios
- CORS
- Cookie Parser
- dotenv

### Database

- MongoDB Atlas

### Deployment

- Render Static Site
- Render Web Service
- MongoDB Atlas

---

## Project Structure

```text
-advanced-physio-clinic/
│
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── jobs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utlis/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── Frontend/
│   └── advanced-physio-frontend/
│       ├── public/
│       ├── src/
│       ├── package.json
│       └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Database Collections

The application uses MongoDB collections associated with the Mongoose models used by the backend.

### Users

Stores application user information and role data.

### Bookings

Stores:

- User reference
- Booking ID
- Slot reference
- Patient information
- Visit type
- Booking status
- Payment status
- Home visit information
- Receipt URL

### Payments

Stores:

- Razorpay order ID
- Payment ID
- Amount
- Payment status
- User reference
- Booking reference

### Slots

Stores appointment availability and slot locking information.

### Clinic Config

Stores clinic scheduling and home visit configuration such as:

- Working hours
- Clinic details
- Clinic coordinates
- Home visit base price
- Free distance
- Per-kilometre rate
- Maximum home visit distance
- Weekly closing configuration

---

## Environment Variables

Environment variables are intentionally not included in the repository.

### Backend

Create:

```text
Backend/.env
```

Example structure:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### Frontend

Create:

```text
Frontend/advanced-physio-frontend/.env
```

Local example:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

Production example:

```env
VITE_API_URL=https://advanced-physio-clinic.onrender.com/api
VITE_BACKEND_URL=https://advanced-physio-clinic.onrender.com
```

Never commit actual `.env` files or secret credentials.

---

## Local Development

### Backend

```bash
cd Backend
npm install
npm run dev
```

Local backend:

```text
http://localhost:5000
```

Health endpoint:

```text
http://localhost:5000/health
```

### Frontend

Open another terminal:

```bash
cd Frontend/advanced-physio-frontend
npm install
npm run dev
```

Local frontend:

```text
http://localhost:5173
```

---

## Production Deployment

### Frontend on Render

```text
Root Directory:
Frontend/advanced-physio-frontend
```

```text
Build Command:
npm install && npm run build
```

```text
Publish Directory:
dist
```

Production environment variables:

```text
VITE_API_URL=https://advanced-physio-clinic.onrender.com/api
VITE_BACKEND_URL=https://advanced-physio-clinic.onrender.com
```

### SPA Rewrite

The frontend uses a rewrite so React Router routes work on direct navigation:

```text
Source:
 /*

Destination:
 /index.html

Action:
 Rewrite
```

This supports routes such as:

```text
/success
/profile
/patient-details
/admin
```

---

## Backend Deployment on Render

```text
Root Directory:
Backend
```

```text
Build Command:
npm install
```

```text
Start Command:
npm start
```

The backend connects to MongoDB Atlas using `MONGO_URI`.

---

## Production Configuration Checklist

Before considering the deployment complete, verify:

```text
[ ] Frontend production API URL is configured
[ ] Backend environment variables are configured
[ ] Firebase production domain is authorized
[ ] MongoDB Atlas network access allows the backend
[ ] Razorpay production/test keys match the selected mode
[ ] Razorpay webhook URL is configured
[ ] Razorpay webhook secret matches RAZORPAY_WEBHOOK_SECRET
[ ] Frontend CORS origin is allowed by the backend
[ ] React Router rewrite is configured
[ ] Backend /health endpoint responds successfully
```

---

## Health Check

The backend exposes:

```text
GET /health
```

Production:

```text
https://advanced-physio-clinic.onrender.com/health
```

This endpoint can be used for monitoring and service health checks.

---

## Render Free Tier Considerations

The current backend can run on Render's Free web service tier.

Free web services can spin down after a period of inactivity, which may make the first request after an idle period slower.

To improve resilience, the frontend/backend implementation includes:

- API request timeouts
- Retry handling
- Slot loading error handling
- Backend health endpoint

An external monitoring service may periodically call:

```text
https://advanced-physio-clinic.onrender.com/health
```

However, this is not a guaranteed always-on architecture. A continuously available paid service is more appropriate for a production system with time-sensitive background processing.

---

## Git Workflow

Recommended development workflow:

```text
Feature / Bug
      ↓
Create Branch
      ↓
Develop Locally
      ↓
Test
      ↓
Commit
      ↓
Push Branch
      ↓
Pull Request
      ↓
Review
      ↓
Merge to main
      ↓
Render Deployment
      ↓
Production Verification
```

Example:

```bash
git checkout -b feat/home-visit-improvements
```

Then:

```bash
git add .
git commit -m "feat: improve home visit booking"
git push origin feat/home-visit-improvements
```

After review, merge the branch into `main`.

---

## Commit Convention

Recommended prefixes:

```text
feat:
fix:
refactor:
docs:
chore:
```

Examples:

```text
feat: add automatic receipt download
feat: improve home visit booking
fix: resolve production CORS issue
fix: correct receipt timezone
fix: associate home visit with patient
fix: improve slot loading retry
feat: add Razorpay webhook verification
docs: update project documentation
chore: configure production environment
```

---

## Security Practices

The project uses several security measures:

- Firebase ID token verification
- Protected private routes
- MongoDB user references for application identity
- Server-controlled payment amount
- Razorpay webhook signature verification
- Environment variables for secrets
- CORS configuration
- Server-side validation
- Role-based administrative access

Never commit:

```text
.env
serviceAccountKey.json
Firebase private keys
MongoDB credentials
JWT secrets
Razorpay API secrets
Razorpay webhook secrets
```

---

## Current Receipt Storage

The current receipt generation flow creates PDF files under:

```text
Backend/uploads/receipts/
```

This works with the current application flow, but standard Render filesystem storage is not intended to be permanent file storage.

A future production improvement is to move generated receipts to persistent object storage and save the resulting HTTPS URL in `Booking.pdfUrl`.

---

## Testing Checklist

### Authentication

```text
[ ] Phone number validation
[ ] reCAPTCHA
[ ] OTP delivery
[ ] OTP verification
[ ] Firebase ID token generation
[ ] Backend authentication
```

### Clinic Booking

```text
[ ] Slot loading
[ ] Date selection
[ ] Friday closure
[ ] Past slot handling
[ ] Slot locking
[ ] Patient details
[ ] Razorpay order creation
[ ] Payment
[ ] Webhook delivery
[ ] Webhook signature verification
[ ] Booking creation
[ ] PDF generation
[ ] Profile booking visibility
[ ] Receipt access
```

### Home Visit

```text
[ ] GPS permission
[ ] Location accuracy validation
[ ] Distance calculation
[ ] Home visit price calculation
[ ] Clinic configuration
[ ] Address handling
[ ] Razorpay order creation
[ ] Payment
[ ] Webhook delivery
[ ] Booking creation
[ ] Profile visibility
[ ] Receipt generation
```

### Admin

```text
[ ] Admin authentication
[ ] Dashboard access
[ ] Booking visibility
[ ] Payment visibility
[ ] Slot visibility
[ ] Home visit visibility
```

---

## Future Improvements

Planned or potential improvements include:

- Persistent cloud receipt storage
- Email appointment confirmations
- SMS notifications
- Appointment reminders
- Cancellation and refund workflows
- Doctor availability management
- Advanced analytics
- Automated backups
- API documentation with Swagger/OpenAPI
- Automated unit and integration tests
- CI/CD workflow
- Improved audit logging

---

## Developer

**Abdullah**  
MERN Stack Developer

GitHub:  
https://github.com/workdev-abdullah

LinkedIn:  
https://linkedin.com/in/abdullah-workdev

Email:  
workdev.abdullah@gmail.com

---

## Project Purpose

This project demonstrates the practical implementation of a real-world full-stack business workflow involving:

```text
React Frontend
      ↓
REST APIs
      ↓
Authentication
      ↓
Database Management
      ↓
Appointment Scheduling
      ↓
Concurrency / Slot Locking
      ↓
Payment Processing
      ↓
Webhook Security
      ↓
PDF Generation
      ↓
Cloud Deployment
```

It is designed as a complete clinic appointment platform rather than a basic CRUD application.
