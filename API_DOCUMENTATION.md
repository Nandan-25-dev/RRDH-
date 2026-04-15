# RRDC&H Hospital Backend - MongoDB Complete Version

## Setup Instructions

### 1. Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Configuration
Create `.env` file in root:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rrdc-hospital
ADMIN_USER=admin
ADMIN_PASS=admin123
SESSION_SECRET=rrdc-secret-2026-super-secure
```

### 4. Start Server
```bash
npm start          # Production
npm run dev        # Development (with nodemon)
```

Server runs at: `http://localhost:3000`

---

## Database Models

### 1. **Patient** (User Accounts)
- Username & Email (unique)
- Hashed Password
- Personal details (name, phone, DOB, gender)
- Medical history & allergies
- Emergency contact

### 2. **Doctor** (Staff Management)
- Specialization & credentials
- Availability schedule (per day)
- Consultation fee
- Profile information

### 3. **Appointment** (Booking & Management)
- Patient & doctor info
- Date, time & department
- Status (Pending/Confirmed/Completed/Cancelled/No-show)
- Reminders & notes

### 4. **Service** (Treatments Offered)
- Name & description
- Category & price
- Duration
- Active/inactive toggle

### 5. **Payment** (Invoicing & Billing)
- Invoice number (auto-generated)
- Amount, discount, tax
- Status (Pending/Completed/Failed/Refunded)
- Payment method (Cash/Card/UPI/Stripe)
- Transaction ID & due date

### 6. **Feedback** (Reviews & Complaints)
- Patient rating (1-5 stars)
- Type (Service/Doctor/Facility/Staff/General)
- Status (New/Reviewed/Resolved/Closed)
- Admin response & timestamp

### 7. **Prescription** (Medical Records)
- Doctor & patient reference
- Medicines (name, dosage, frequency, duration)
- Follow-up date
- Attachments/notes

### 8. **Notification** (Patient Alerts)
- Type (Appointment/Payment/Message/Reminder/System)
- Read status & timestamps
- Expiry date

### 9. **BlogPost** (Content Management)
- Title, content, excerpt
- Category & tags
- View counter
- Publish status

---

## API Endpoints

### PATIENT AUTHENTICATION
```
POST   /api/patient/register          — Register new patient
POST   /api/patient/login             — Login patient
GET    /api/patient/logout            — Logout
```

### PATIENT PROFILE
```
GET    /api/patient/profile           — Get profile
PATCH  /api/patient/profile           — Update profile
```

### APPOINTMENTS
```
POST   /api/appointments              — Book appointment (public)
GET    /api/appointments/:id          — Get appointment details
GET    /api/patient/appointments      — Get my appointments
```

### FEEDBACK
```
POST   /api/feedback                  — Submit feedback (public)
GET    /api/admin/feedback            — List all feedback
PATCH  /api/admin/feedback/:id        — Respond to feedback
DELETE /api/admin/feedback/:id        — Delete feedback
```

### SERVICES
```
GET    /api/services                  — List all services
POST   /api/admin/services            — Create service
PATCH  /api/admin/services/:id        — Update service
```

### PAYMENTS
```
POST   /api/payments                  — Create payment
GET    /api/patient/payments          — Get my payments
PATCH  /api/admin/payments/:id        — Update payment status
```

### PRESCRIPTIONS
```
POST   /api/admin/prescriptions       — Issue prescription
GET    /api/patient/prescriptions     — Get my prescriptions
```

### NOTIFICATIONS
```
GET    /api/notifications             — Get notifications
PATCH  /api/notifications/:id/read    — Mark as read
```

### BLOG
```
GET    /api/blog                      — List all posts
GET    /api/blog/:slug                — Get single post
POST   /api/admin/blog                — Create post
PATCH  /api/admin/blog/:id            — Update post
```

### ADMIN AUTHENTICATION
```
POST   /api/admin/login               — Admin login
GET    /api/admin/logout              — Admin logout
```

### ADMIN DASHBOARD
```
GET    /api/admin/appointments        — List all appointments
GET    /api/admin/patients            — List all patients
GET    /api/admin/doctors             — List all doctors
GET    /api/admin/payments            — List all payments
GET    /api/admin/stats               — Dashboard statistics
```

### ADMIN MANAGEMENT
```
PATCH  /api/admin/appointments/:id    — Update appointment status
DELETE /api/admin/appointments/:id    — Delete appointment
POST   /api/admin/doctors             — Add doctor
PATCH  /api/admin/doctors/:id         — Update doctor
DELETE /api/admin/doctors/:id         — Delete doctor
```

---

## Features Implemented

✅ **Patient Management**
- User registration & login with password hashing
- Profile management
- Medical history tracking

✅ **Appointment System**
- Online booking (public)
- Status management (Pending/Confirmed/Completed/Cancelled/No-show)
- Doctor assignment
- Appointment reminders

✅ **Doctor Management**
- Doctor profiles & specializations
- Availability scheduling
- Consultation fees

✅ **Billing & Payments**
- Invoice generation
- Multiple payment methods
- Payment status tracking
- Revenue analytics

✅ **Feedback & Analytics**
- Patient feedback with ratings
- Admin response system
- Average rating calculation
- Feedback analytics

✅ **Prescriptions**
- Issue digital prescriptions
- Medicine tracking
- Dosage instructions
- Follow-up scheduling

✅ **Notifications**
- Real-time notifications
- Read/unread status
- Appointment reminders
- Payment alerts

✅ **Blog/Content**
- Blog post management
- View counter
- SEO-friendly slugs
- Publishing controls

✅ **Dashboard Analytics**
- Total appointments
- Today's appointments
- Appointment statuses
- Patient count
- Revenue reports
- Average ratings

---

## Testing API

### Using cURL

**Patient Registration:**
```bash
curl -X POST http://localhost:3000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@email.com","password":"123456","firstName":"John","lastName":"Doe"}'
```

**Book Appointment:**
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientName":"John","patientPhone":"9876543210","date":"2026-04-20","department":"General","service":"Cleaning"}'
```

**Admin Login:**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Dashboard Stats:**
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

---

## Frontend Files

Place your frontend files in `/frontend` folder:
- `index.html` - Landing page
- CSS & JavaScript files
- Images & assets

Access at: `http://localhost:3000/frontend`

---

## Admin Panel

**URL:** `http://localhost:3000/admin`  
**Default Credentials:**
- Username: `admin`
- Password: `admin123`

---

## Security Notes

⚠️ **Production Checklist:**
1. Change default admin credentials
2. Use strong SESSION_SECRET
3. Enable HTTPS
4. Configure MongoDB authentication
5. Use environment variables for secrets
6. Implement rate limiting
7. Add input validation
8. Enable CORS restrictions
9. Set secure cookie flags
10. Add API authentication tokens (JWT)

---

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- Verify network connectivity

**Port Already in Use:**
```bash
lsof -i :3000      # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

**Missing Dependencies:**
```bash
npm install
npm install mongoose dotenv bcryptjs nodemailer stripe
```

---

## Future Enhancements

- Email notifications (nodemailer integration)  
- SMS reminders
- Payment gateway (Stripe/Razorpay)
- Video consultations
- Prescription printing
- Insurance integration
- Multi-language support
- Mobile app
- Analytics reports

---

**Last Updated:** April 2026  
**Version:** 1.0.0 Complete
