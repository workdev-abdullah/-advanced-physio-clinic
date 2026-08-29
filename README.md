# Advanced Physiotherapy Clinic

A production-oriented full-stack physiotherapy clinic appointment and management platform built with the **MERN stack**, **Firebase Phone Authentication**, **Razorpay**, and automated **PDF appointment receipts**.

The platform is designed to handle the complete appointment lifecycle, from patient authentication and slot selection to payment verification, booking creation, receipt generation, and appointment history.

---

## 🌐 Live Application

### Patient Website
https://advanced-physio-frontend.onrender.com

### Backend API
https://advanced-physio-clinic.onrender.com

### Backend Health Check
https://advanced-physio-clinic.onrender.com/health

### GitHub Repository
https://github.com/workdev-abdullah/-advanced-physio-clinic

---

# 📌 Overview

Advanced Physiotherapy Clinic is a full-stack web application for managing physiotherapy appointments and related clinic operations.

The application provides separate patient and administrative workflows and integrates external services for authentication, payments, database management, and appointment receipts.

### Core capabilities

- Firebase phone-number authentication with OTP
- Secure authenticated API requests
- Clinic appointment scheduling
- Automatic slot generation
- Temporary slot locking
- Double-booking protection
- Friday clinic closure
- Sunday evening closure rules
- Home visit booking
- GPS-based distance calculation
- Location accuracy validation
- Home visit pricing
- Razorpay online payments
- Razorpay webhook signature verification
- Appointment creation after payment confirmation
- Automated PDF receipt generation
- Patient appointment history
- Receipt access from the patient profile
- Administrative dashboard
- Responsive desktop and mobile interface

---

# 🧪 Demo & Test Credentials

The following information is provided strictly for testing the deployed application.

## 🔐 Admin Test Account

```text
Phone Number: 6297116747
OTP: 000000
```

> **Demo/Test Account Only:** The OTP `000000` is intended only for the configured Firebase test phone number. Real users authenticate through Firebase Phone Authentication and receive OTPs through the configured authentication flow.

## 💳 Razorpay Test Payment

Use **Razorpay Test Mode** when testing payments.

| Network | Test Card Number | CVV | Expiry |
|---|---|---|---|
| Visa | `4100 2800 0000 1007` | Any random CVV | Any future date |

> **Important:** The card above is a Razorpay sandbox/test card and should only be used in Test Mode. It is not a real payment card.

## 🌐 Recommended Test Flow

```text
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
```

---

# 🔄 Core Booking Workflows

## 🏥 Clinic Appointment Workflow

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
Payment Record Updated
    ↓
Booking Creation
    ↓
PDF Receipt Generation
    ↓
Success Page
    ↓
Patient Profile
```

## 🏠 Home Visit Workflow

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
Payment Record Updated
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

# 🔐 Authentication Architecture

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
Axios API Request
      ↓
Express Backend
      ↓
Firebase Admin verifyIdToken()
      ↓
MongoDB User Lookup / Creation
      ↓
Authenticated Request
```

Private API requests send the Firebase ID token using:

```text
Authorization: Bearer <token>
```

The backend uses the authenticated Firebase phone number to identify the corresponding MongoDB user.

The MongoDB user's `_id` is then used to associate protected application data such as bookings and payments with the authenticated patient.

---

# 🛡️ API Authentication & Authorization

Protected application operations use backend authentication middleware.

The authenticated user identity is used for operations such as:

- Creating protected payment orders
- Locking appointment slots
- Creating home visit payment orders
- Retrieving patient bookings
- Accessing protected profile information
- Administrative access according to the application's role logic

The application avoids relying solely on user-supplied identifiers for protected patient data.

---

# 💳 Payment Architecture

Razorpay is used for online appointment payments.

```text
Frontend
    ↓
Backend Creates Razorpay Order
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

## Production Webhook

```text
https://advanced-physio-clinic.onrender.com/api/payment/webhook
```

The webhook endpoint is intentionally not protected by application authentication because the request originates from Razorpay.

---

# 🔔 Razorpay Webhook Verification

The backend validates webhook authenticity using:

```text
RAZORPAY_WEBHOOK_SECRET
```

The webhook route receives the raw request body so the HMAC signature can be calculated against the original payload.

The payment-capture event is then used to complete the payment and booking workflow.

```text
Razorpay Event
      ↓
Raw Request Body
      ↓
HMAC-SHA256 Verification
      ↓
Valid Signature
      ↓
Process Payment
      ↓
Create Booking
```

---

# 📅 Appointment Scheduling

The scheduling system supports:

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

## Slot Lifecycle

```text
AVAILABLE
    ↓
LOCKED
    ↓
Payment Successful
    ↓
BOOKED
```

If a slot lock expires before completion:

```text
LOCKED
    ↓
Lock Expired
    ↓
AVAILABLE
```

---

# 🔒 Slot Locking & Double-Booking Protection

The application temporarily locks an available slot before the patient completes the payment process.

```text
Patient A
    ↓
Select Slot
    ↓
Slot LOCKED
    ↓
Payment
    ↓
BOOKED
```

At the same time:

```text
Patient B
    ↓
Attempts Same Slot
    ↓
Slot Already Locked
    ↓
Booking Prevented
```

This helps protect appointment availability when multiple users attempt to book the same slot.

---

# 🏠 Home Visit System

The home visit workflow uses the patient's GPS location and the clinic's configured coordinates.

The system validates:

- Latitude
- Longitude
- Location accuracy
- Distance from the clinic
- Maximum supported distance
- Calculated visit price
- Patient address

The home visit configuration is stored in the clinic configuration data.

---

# 📍 Distance & Home Visit Pricing

The system calculates the distance between the configured clinic location and the patient's current GPS coordinates.

Current configured pricing:

```text
Base Charge: ₹500
Free Distance: 4 km
Additional Rate: ₹20/km
Maximum Home Visit Distance: 300 km
```

The server validates the distance and calculated payment amount before creating a Razorpay order.

---

# 🧾 PDF Receipt System

After successful payment and webhook verification, the backend generates an appointment receipt using PDFKit.

The receipt can include:

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
- Home visit pricing details when applicable

Appointment dates and times are formatted for:

```text
Asia/Kolkata
```

The generated receipt path is associated with the booking so it can be accessed from the patient's profile.

---

# 👤 Patient Profile

Authenticated patients can view their appointment history.

The profile uses the authenticated MongoDB user ID to retrieve bookings belonging to that patient.

Booking information may include:

- Appointment date
- Appointment time
- Visit type
- Patient details
- Booking status
- Payment status
- Home visit information
- Receipt access

---

# 👨‍💼 Admin Dashboard

The administrative area provides visibility into clinic operations.

Administrative functionality includes:

- Admin authentication
- Appointment bookings
- Patient information
- Booking status
- Payment status
- Slot information
- Home visit bookings

Administrative features are protected using the application's authentication and role logic.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────────┐
                         │      React Frontend      │
                         │    Render Static Site    │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTPS / REST API
                                      ▼
                         ┌──────────────────────────┐
                         │   Node.js + Express API  │
                         │      Render Web Service  │
                         └───────┬─────────┬────────┘
                                 │         │
                    ┌────────────┘         └──────────────┐
                    ▼                                     ▼
          ┌──────────────────┐                  ┌──────────────────┐
          │  MongoDB Atlas   │                  │     Razorpay     │
          │   Application DB │                  │ Payment Gateway  │
          └──────────────────┘                  └────────┬─────────┘
                                                         │
                                                         │ Webhook
                                                         ▼
                                               ┌────────────────────┐
                                               │ Express Webhook API│
                                               │ Signature Validation│
                                               └────────────────────┘

          ┌──────────────────┐
          │  Firebase Auth   │
          │   Phone OTP      │
          └──────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- React.js
- React Router
- Axios
- Tailwind CSS
- Firebase Authentication
- Vite

## Backend

- Node.js
- Express.js
- Mongoose
- Firebase Admin SDK
- Razorpay
- PDFKit
- CORS
- Cookie Parser
- dotenv

## Database

- MongoDB Atlas

## Authentication

- Firebase Phone Authentication
- Firebase Admin SDK

## Payment Gateway

- Razorpay

## Deployment

- Render Static Site
- Render Web Service
- MongoDB Atlas

---

# 📁 Project Structure

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

# 🗃️ Database Collections

The application uses MongoDB collections associated with the backend Mongoose models.

## Users

Stores application user information and role data.

## Bookings

Stores information such as:

- User reference
- Booking ID
- Slot reference
- Patient information
- Visit type
- Booking status
- Payment status
- Home visit information
- Receipt URL

## Payments

Stores information such as:

- Razorpay order ID
- Payment ID
- Amount
- Payment status
- User reference
- Booking reference

## Slots

Stores:

- Appointment availability
- Slot status
- Lock information
- Appointment time information

## Clinic Config

Stores configuration such as:

- Working hours
- Clinic details
- Clinic coordinates
- Home visit base price
- Free distance
- Per-kilometre rate
- Maximum home visit distance
- Weekly closure configuration

---

# 🔑 Environment Variables

Environment files containing secrets are intentionally excluded from the repository.

## Backend

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
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## Frontend

Create:

```text
Frontend/advanced-physio-frontend/.env
```

Local:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

Production:

```env
VITE_API_URL=https://advanced-physio-clinic.onrender.com/api
VITE_BACKEND_URL=https://advanced-physio-clinic.onrender.com
```

> Never commit actual `.env` files or production secrets to GitHub.

---

# 💻 Local Development

## Backend

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

## Frontend

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

# 🚀 Production Deployment

## Frontend — Render Static Site

### Root Directory

```text
Frontend/advanced-physio-frontend
```

### Build Command

```text
npm install && npm run build
```

### Publish Directory

```text
dist
```

### Production Environment Variables

```text
VITE_API_URL=https://advanced-physio-clinic.onrender.com/api
VITE_BACKEND_URL=https://advanced-physio-clinic.onrender.com
```

---

# 🔗 React Router Deployment

The frontend uses React Router.

The Render Static Site requires an SPA rewrite:

```text
Source:
 /*

Destination:
 /index.html

Action:
 Rewrite
```

This allows direct navigation to routes such as:

```text
/success
/profile
/patient-details
/admin
```

---

# ⚙️ Backend — Render Web Service

### Root Directory

```text
Backend
```

### Build Command

```text
npm install
```

### Start Command

```text
npm start
```

The backend connects to MongoDB Atlas using the configured `MONGO_URI`.

---

# 🌐 Production Configuration Checklist

Before using the deployed application, verify:

```text
[ ] Frontend production API URL configured
[ ] Backend environment variables configured
[ ] Firebase production domain authorized
[ ] MongoDB Atlas network access configured
[ ] Razorpay key mode matches the selected environment
[ ] Razorpay webhook URL configured
[ ] Razorpay webhook secret configured
[ ] Backend CORS allows the production frontend
[ ] React Router rewrite configured
[ ] Backend /health endpoint responds successfully
[ ] ClinicConfig data exists in production MongoDB
```

---

# 🩺 Backend Health Check

The backend exposes:

```text
GET /health
```

Production:

```text
https://advanced-physio-clinic.onrender.com/health
```

The endpoint can be used for:

- Service health checks
- Monitoring
- Backend availability testing

---

# ⚡ Render Free Tier Considerations

The backend can run on Render's Free web service tier.

Free services may spin down after inactivity, which can make the first request after an idle period slower.

The application reduces the impact through:

- API request timeouts
- Retry handling
- Slot loading error handling
- Backend health checks
- External health monitoring when configured

An external monitoring service may periodically request:

```text
https://advanced-physio-clinic.onrender.com/health
```

However, external polling should not be considered a guaranteed always-on architecture.

For a continuously available production system with time-sensitive background processing, an always-on backend is more reliable.

---

# 🧪 Testing Checklist

## Authentication

```text
[ ] Phone number validation
[ ] reCAPTCHA
[ ] OTP delivery
[ ] OTP verification
[ ] Firebase ID token generation
[ ] Backend authentication
```

## Clinic Booking

```text
[ ] Slot loading
[ ] Date selection
[ ] Friday closure
[ ] Past slot handling
[ ] Slot locking
[ ] Patient details
[ ] Razorpay order creation
[ ] Test payment
[ ] Webhook delivery
[ ] Webhook signature verification
[ ] Booking creation
[ ] PDF generation
[ ] Profile booking visibility
[ ] Receipt access
```

## Home Visit

```text
[ ] GPS permission
[ ] Location accuracy validation
[ ] Distance calculation
[ ] Home visit price calculation
[ ] Clinic configuration
[ ] Address handling
[ ] Razorpay order creation
[ ] Test payment
[ ] Webhook delivery
[ ] Webhook signature verification
[ ] Booking creation
[ ] Profile visibility
[ ] Receipt generation
```

## Admin

```text
[ ] Admin authentication
[ ] Dashboard access
[ ] Booking visibility
[ ] Payment visibility
[ ] Slot visibility
[ ] Home visit visibility
```

---

# 🔐 Security Practices

The application uses:

- Firebase ID token verification
- Protected private routes
- MongoDB user references for application identity
- Server-controlled payment amounts
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

Also avoid logging sensitive authentication tokens or private credentials in production.

---

# 💾 Receipt Storage

The current receipt generation flow creates PDF files under:

```text
Backend/uploads/receipts/
```

The current application flow can serve those generated receipts through the backend.

For long-term production use, generated receipts should be moved to persistent object storage and the resulting permanent HTTPS URL should be saved in:

```text
Booking.pdfUrl
```

---

# 🔀 Recommended Git Workflow

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

After development:

```bash
git add .
git commit -m "feat: improve home visit booking"
git push origin feat/home-visit-improvements
```

Then create a Pull Request and merge into `main` after review.

---

# 📝 Commit Convention

Recommended commit prefixes:

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
docs: improve project README
chore: configure production environment
```

---

# 📈 Project Highlights

This project demonstrates practical implementation of:

```text
React Frontend
      ↓
REST API Development
      ↓
Authentication
      ↓
Database Management
      ↓
Appointment Scheduling
      ↓
Slot Locking
      ↓
GPS-Based Home Visit
      ↓
Dynamic Pricing
      ↓
Payment Processing
      ↓
Webhook Security
      ↓
PDF Receipt Generation
      ↓
Cloud Deployment
```

The application goes beyond basic CRUD functionality by implementing a complete appointment, payment, home visit, and receipt workflow.

---

# 🚧 Future Improvements

Potential future improvements include:

- Persistent cloud receipt storage
- Email appointment confirmations
- SMS notifications
- Appointment reminders
- Cancellation and refund workflows
- Doctor availability management
- Advanced analytics
- Automated backups
- Swagger/OpenAPI documentation
- Automated unit and integration testing
- CI/CD pipeline
- Improved audit logging

---

# 👨‍💻 Developer

**Abdullah**  
MERN Stack Developer

**GitHub:**  
https://github.com/workdev-abdullah

**LinkedIn:**  
https://linkedin.com/in/abdullah-workdev

**Email:**  
workdev.abdullah@gmail.com

---

# 📄 Project Purpose

This project demonstrates the practical development and deployment of a real-world full-stack business application involving:

```text
Authentication
      ↓
REST APIs
      ↓
Database Management
      ↓
Appointment Scheduling
      ↓
Concurrency / Slot Locking
      ↓
Location-Based Home Visits
      ↓
Payment Processing
      ↓
Webhook Security
      ↓
PDF Generation
      ↓
Cloud Deployment
```

The architecture separates responsibilities across the frontend, backend, authentication provider, database, and payment gateway to keep the application maintainable and extensible.
