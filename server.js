/**
 * RRDC&H Complete Backend
 * MongoDB + Express + Full Features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./utils/emailService');

// Models
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Service = require('./models/Service');
const Payment = require('./models/Payment');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');
const Prescription = require('./models/Prescription');
const BlogPost = require('./models/BlogPost');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rrdc-hospital';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

/* ============================================================
   DATABASE CONNECTION
   ============================================================ */
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    // Seed sample services if they don't exist
    await seedServices();
  })
  .catch(err => { console.error('❌ MongoDB Error:', err); process.exit(1); });

/* Seed sample services */
async function seedServices() {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      const services = [
        {
          name: 'General Consultation',
          description: 'General dental consultation and examination',
          category: 'Consultation',
          price: 500,
          duration: 30,
          icon: '🔍',
          isActive: true
        },
        {
          name: 'Teeth Cleaning',
          description: 'Professional teeth cleaning and scaling',
          category: 'Cleaning',
          price: 1500,
          duration: 45,
          icon: '🧹',
          isActive: true
        },
        {
          name: 'Root Canal Treatment',
          description: 'Complete root canal therapy',
          category: 'Treatment',
          price: 3000,
          duration: 90,
          icon: '🦷',
          isActive: true
        },
        {
          name: 'Teeth Filling',
          description: 'Cavity filling with composite resin',
          category: 'Treatment',
          price: 1000,
          duration: 30,
          icon: '⚕️',
          isActive: true
        },
        {
          name: 'Teeth Whitening',
          description: 'Professional teeth whitening service',
          category: 'Cosmetic',
          price: 2000,
          duration: 60,
          icon: '✨',
          isActive: true
        },
        {
          name: 'Extraction',
          description: 'Tooth extraction procedure',
          category: 'Treatment',
          price: 1200,
          duration: 45,
          icon: '🔨',
          isActive: true
        },
        {
          name: 'Orthodontic Consultation',
          description: 'Consultation for braces and aligners',
          category: 'Consultation',
          price: 800,
          duration: 30,
          icon: '📐',
          isActive: true
        },
        {
          name: 'Implant Consultation',
          description: 'Dental implant assessment and planning',
          category: 'Consultation',
          price: 1000,
          duration: 45,
          icon: '🦷',
          isActive: true
        }
      ];
      await Service.insertMany(services);
      console.log('✅ Sample services created');
    }
  } catch (error) {
    console.error('Service seeding error:', error.message);
  }
}

/* Test email service */
emailService.testConnection();

/* ============================================================
   MIDDLEWARE
   ============================================================ */
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', '*'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'rrdc-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 4 }
}));

app.use('/frontend', express.static(path.join(__dirname, 'frontend')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/patient', express.static(path.join(__dirname, 'patient')));
app.use('/doctor', express.static(path.join(__dirname, 'doctor')));

/* Root route - redirect to login */
app.get('/', (req, res) => {
  res.redirect('/admin/login.html');
});

/* Auth Guards */
const requireAdmin = (req, res, next) => {
  if (req.session?.isAdmin) return next();
  res.status(401).json({ error: 'Admin authorization required' });
};

const requirePatientLogin = (req, res, next) => {
  if (req.session?.patientId) return next();
  res.status(401).json({ error: 'Patient login required' });
};

const requireDoctorLogin = (req, res, next) => {
  if (req.session?.doctorId) return next();
  res.status(401).json({ error: 'Doctor login required' });
};

/* ============================================================
   PATIENT AUTHENTICATION
   ============================================================ */

app.post('/api/patient/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, dateOfBirth, gender } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await Patient.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ error: 'Patient exists' });

    const patient = new Patient({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender
    });

    await patient.save();
    
    // Send welcome email
    await emailService.sendWelcomeEmail(`${firstName} ${lastName}`, email);
    
    res.status(201).json({ success: true, patientId: patient._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patient/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const patient = await Patient.findOne({ username });

    if (!patient || !await bcrypt.compare(password, patient.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.patientId = patient._id;
    req.session.patientName = patient.firstName;
    res.json({ success: true, patientId: patient._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    // Redirect to login page
    res.redirect('/admin/login.html');
  });
});

app.get('/api/patient/session', (req, res) => {
  if (req.session?.patientId) {
    res.json({ authenticated: true, patientId: req.session.patientId, patientName: req.session.patientName });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

/* ============================================================
   DOCTOR AUTHENTICATION
   ============================================================ */

app.post('/api/doctor/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, specialization, licenseNumber, experience, consultationFee, bio } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
    if (existing) return res.status(400).json({ error: 'Doctor already registered with this email or license' });

    const doctor = new Doctor({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      phone,
      specialization,
      licenseNumber,
      experience: parseInt(experience),
      consultationFee: parseFloat(consultationFee),
      bio,
      isActive: true
    });

    await doctor.save();
    
    // Send welcome email
    await emailService.sendAdminWelcomeEmail(email, `${firstName} ${lastName}`, 'Doctor');
    
    res.status(201).json({ success: true, doctorId: doctor._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ email });

    if (!doctor || !await bcrypt.compare(password, doctor.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Your account is not active' });
    }

    req.session.doctorId = doctor._id;
    req.session.doctorName = doctor.firstName;
    await Doctor.findByIdAndUpdate(doctor._id, { lastLogin: new Date() });
    
    res.json({ success: true, redirect: '/doctor/dashboard' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctor/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

/* ============================================================
   PATIENT PROFILE
   ============================================================ */

app.get('/api/patient/profile', requirePatientLogin, async (req, res) => {
  try {
    const patient = await Patient.findById(req.session.patientId).select('-password');
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/patient/profile', requirePatientLogin, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.session.patientId,
      req.body,
      { new: true }
    ).select('-password');
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctor/profile', requireDoctorLogin, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.session.doctorId).select('-password');
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/doctor/profile', requireDoctorLogin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.session.doctorId,
      req.body,
      { new: true }
    ).select('-password');
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctor/appointments', requireDoctorLogin, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.session.doctorId }).sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/doctor/appointments/:id/status', requireDoctorLogin, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctor/statistics', requireDoctorLogin, async (req, res) => {
  try {
    const doctorId = req.session.doctorId;
    const stats = {
      totalAppointments: await Appointment.countDocuments({ doctorId }),
      completedAppointments: await Appointment.countDocuments({ doctorId, status: 'Completed' }),
      pendingAppointments: await Appointment.countDocuments({ doctorId, status: 'Pending' }),
      confirmedAppointments: await Appointment.countDocuments({ doctorId, status: 'Confirmed' })
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   APPOINTMENTS
   ============================================================ */

app.post('/api/appointments', async (req, res) => {
  try {
    // Check if logged in patient
    if (req.session.patientId) {
      const { doctorId, serviceId, date, time, reason, medications } = req.body;
      
      if (!doctorId || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get patient and service details
      const patient = await Patient.findById(req.session.patientId);
      const service = await Service.findById(serviceId);
      const doctor = await Doctor.findById(doctorId);

      if (!patient || !service) {
        return res.status(404).json({ error: 'Patient or Service not found' });
      }

      const appointment = new Appointment({
        appointmentId: uuidv4(),
        patientId: req.session.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        doctorId,
        date: new Date(date),
        time,
        department: service.category || 'General',
        service: service.name,
        reason,
        status: 'Pending',
        medications: medications || ''
      });

      await appointment.save();

      // Send confirmation email
      const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor';
      await emailService.sendAppointmentConfirmation(
        patient.email,
        patient.firstName,
        {
          date: new Date(date).toLocaleDateString(),
          time,
          doctor: doctorName,
          service: service.name,
          appointmentId: appointment._id
        }
      );

      res.status(201).json({ success: true, appointmentId: appointment._id, message: 'Appointment booked successfully!' });
    } else {
      // Guest appointment booking
      const { patientName, patientPhone, date, department, service, reason, patientEmail } = req.body;
      if (!patientName || !patientPhone || !date || !department) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const appointment = new Appointment({
        appointmentId: uuidv4(),
        patientName,
        patientPhone,
        patientEmail,
        date: new Date(date),
        department,
        service,
        reason,
        status: 'Pending'
      });

      await appointment.save();
      
      // Send confirmation to guest
      if (patientEmail) {
        await emailService.sendAppointmentConfirmation(
          patientEmail,
          patientName.split(' ')[0],
          {
            date: new Date(date).toLocaleDateString(),
            time: '10:00 AM',
            doctor: 'Doctor',
            service: service || 'Service',
            appointmentId: appointment._id
          }
        );
      }

      res.status(201).json({ success: true, appointmentId: appointment._id, message: 'Appointment booked successfully!' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/appointments', requirePatientLogin, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.session.patientId })
      .sort({ date: -1 })
      .limit(50)
      .lean();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/appointments/:id', requirePatientLogin, async (req, res) => {
  try {
    const { date, time, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.patientId.toString() !== req.session.patientId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (reason) appointment.reason = reason;
    appointment.updatedAt = new Date();

    await appointment.save();
    
    // Send update notification email
    const patient = await Patient.findById(req.session.patientId);
    await emailService.sendEmail(
      patient.email,
      'Appointment Updated',
      `<p>Your appointment has been updated:</p>
       <p><strong>New Date:</strong> ${new Date(date).toLocaleDateString()}</p>
       <p><strong>New Time:</strong> ${time}</p>`
    );

    res.json({ success: true, message: 'Appointment updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', requirePatientLogin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (appointment.patientId.toString() !== req.session.patientId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();
    
    // Send cancellation email
    const patient = await Patient.findById(req.session.patientId);
    await emailService.sendEmail(
      patient.email,
      'Appointment Cancelled',
      `<p>Your appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been cancelled.</p>
       <p>If you have any questions, please contact us.</p>`
    );

    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   ADMIN AUTHENTICATION
   ============================================================ */

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check database first
    const admin = await Admin.findOne({ username });
    
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.isAdmin = true;
      req.session.adminId = admin._id;
      req.session.username = admin.username;
      req.session.role = admin.role;
      
      // Update last login
      await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });
      
      return res.json({ success: true, redirect: '/admin' });
    }
    
    // Fallback to hardcoded credentials for initial setup
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      req.session.isAdmin = true;
      req.session.username = username;
      req.session.role = 'SuperAdmin';
      return res.json({ success: true, redirect: '/admin' });
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* POST /api/admin/setup - Create first admin */
app.post('/api/admin/setup', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: 'SuperAdmin'
    });

    await admin.save();
    res.status(201).json({ success: true, message: 'Admin created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* POST /api/admin/create-staff - Create new admin user */
app.post('/api/admin/create-staff', requireAdmin, async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'Admin'
    });

    await admin.save();
    res.status(201).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* GET /api/admin/staff */
app.get('/api/admin/staff', requireAdmin, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* DELETE /api/admin/staff/:id */
app.delete('/api/admin/staff/:id', requireAdmin, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* POST /api/admin/register - Admin Self-Registration */
app.post('/api/admin/register', async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin account already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'Admin',
      isActive: true
    });

    await admin.save();
    
    // Send welcome email to new admin
    await emailService.sendAdminWelcomeEmail(email, fullName, role || 'Admin');
    
    res.status(201).json({ success: true, message: 'Admin account created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

app.get('/api/admin/appointments', requireAdmin, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/feedback', requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/patients', requireAdmin, async (req, res) => {
  try {
    const patients = await Patient.find().select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/doctors', requireAdmin, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/payments', requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];

    const stats = {
      totalAppointments: await Appointment.countDocuments(),
      todayAppointments: await Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      pendingAppointments: await Appointment.countDocuments({ status: 'Pending' }),
      confirmedAppointments: await Appointment.countDocuments({ status: 'Confirmed' }),
      completedAppointments: await Appointment.countDocuments({ status: 'Completed' }),
      totalPatients: await Patient.countDocuments(),
      totalDoctors: await Doctor.countDocuments(),
      totalFeedback: await Feedback.countDocuments(),
      totalServices: await Service.countDocuments()
    };

    const avgRatingData = await Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);
    stats.avgRating = avgRatingData[0]?.avg?.toFixed(1) || 0;

    const revenueData = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    stats.totalRevenue = revenueData[0]?.total || 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   APPOINTMENTS MANAGEMENT
   ============================================================ */

app.patch('/api/admin/appointments/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
    
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/appointments/:id', requireAdmin, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   DOCTORS MANAGEMENT
   ============================================================ */

app.post('/api/admin/doctors', requireAdmin, async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/doctors/:id', requireAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/doctors/:id', requireAdmin, async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   SERVICES
   ============================================================ */

app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/services', requireAdmin, async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/services/:id', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   FEEDBACK
   ============================================================ */

app.post('/api/feedback', async (req, res) => {
  try {
    const { patientName, email, type, rating, subject, message } = req.body;
    if (!patientName || !message) return res.status(400).json({ error: 'Missing fields' });

    const feedback = new Feedback({
      patientName,
      email,
      type,
      rating,
      subject,
      message,
      status: 'New'
    });

    await feedback.save();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/feedback/:id', requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { ...req.body, respondedAt: new Date() },
      { new: true }
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/feedback/:id', requireAdmin, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   PAYMENTS
   ============================================================ */

app.post('/api/payments', requirePatientLogin, async (req, res) => {
  try {
    const { appointmentId, amount, description, paymentMethod } = req.body;
    const payment = new Payment({
      invoiceNumber: `INV-${Date.now()}`,
      appointmentId,
      patientId: req.session.patientId,
      amount,
      description,
      paymentMethod,
      status: 'Pending'
    });

    await payment.save();
    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/payments', requirePatientLogin, async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.session.patientId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/payments/:id', requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   PRESCRIPTIONS
   ============================================================ */

app.post('/api/admin/prescriptions', requireAdmin, async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/patient/prescriptions', requirePatientLogin, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.session.patientId })
      .sort({ issuedAt: -1 })
      .limit(50)
      .lean();
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

app.get('/api/notifications', requirePatientLogin, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.session.patientId })
      .sort({ sentAt: -1 })
      .limit(50)
      .lean();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/notifications/:id/read', requirePatientLogin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   BLOG
   ============================================================ */

app.get('/api/blog', async (req, res) => {
  try {
    const posts = await BlogPost.find({ published: true }).sort({ publishedAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/blog', requireAdmin, async (req, res) => {
  try {
    const post = new BlogPost({
      ...req.body,
      slug: req.body.title.toLowerCase().replace(/\s+/g, '-'),
      publishedAt: new Date()
    });
    await post.save();
    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/blog/:id', requireAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   HTML PAGES
   ============================================================ */

app.get('/admin/login', (req, res) => {
  if (req.session?.isAdmin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'signup.html'));
});

app.get('/admin/admin-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin-signup.html'));
});

app.get('/admin/doctor-signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'doctor-signup.html'));
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/patient/dashboard', requirePatientLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'patient', 'dashboard.html'));
});

app.get('/doctor/dashboard', requireDoctorLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'doctor', 'dashboard.html'));
});

/* ============================================================
   EMAIL ENDPOINTS
   ============================================================ */

/* Send custom email endpoint */
app.post('/api/email/send', requireAdmin, async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const success = await emailService.sendEmail(to, subject, message);
    if (success) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Resend welcome email */
app.post('/api/email/resend-welcome/:patientId', requireAdmin, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await emailService.sendWelcomeEmail(`${patient.firstName} ${patient.lastName}`, patient.email);
    res.json({ success: true, message: 'Welcome email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Send appointment confirmation email */
app.post('/api/email/appointment-confirmation/:appointmentId', requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    await emailService.sendAppointmentConfirmation(
      appointment.patientEmail,
      appointment.patientName,
      {
        date: appointment.date,
        time: appointment.time,
        doctor: appointment.doctorName || 'TBA',
        department: appointment.department,
        service: appointment.service
      }
    );
    res.json({ success: true, message: 'Appointment confirmation email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Send appointment reminder */
app.post('/api/email/appointment-reminder/:appointmentId', requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    await emailService.sendAppointmentReminder(
      appointment.patientEmail,
      appointment.patientName,
      {
        date: appointment.date,
        time: appointment.time,
        doctor: appointment.doctorName || 'TBA',
        department: appointment.department
      }
    );
    res.json({ success: true, message: 'Appointment reminder email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Send payment invoice email */
app.post('/api/email/payment-invoice/:paymentId', requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const patient = await Patient.findById(payment.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await emailService.sendPaymentInvoice(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      {
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        appointmentService: payment.description,
        dueDate: payment.dueDate,
        paymentMethod: payment.paymentMethod
      }
    );
    res.json({ success: true, message: 'Payment invoice email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Send prescription email */
app.post('/api/email/prescription/:prescriptionId', requireAdmin, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    const patient = await Patient.findById(prescription.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const doctor = await Doctor.findById(prescription.doctorId);

    await emailService.sendPrescriptionEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      {
        medicines: prescription.medicines,
        doctor: doctor?.firstName || 'Dr. Unknown',
        notes: prescription.notes
      }
    );
    res.json({ success: true, message: 'Prescription email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Send feedback response email */
app.post('/api/email/feedback-response/:feedbackId', requireAdmin, async (req, res) => {
  try {
    const { responseMessage } = req.body;
    if (!responseMessage) {
      return res.status(400).json({ error: 'Response message required' });
    }

    const feedback = await Feedback.findById(req.params.feedbackId);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    await emailService.sendFeedbackResponse(
      feedback.email,
      feedback.patientName,
      {
        feedbackType: feedback.type,
        responseMessage: responseMessage
      }
    );

    // Update feedback as responded
    await Feedback.findByIdAndUpdate(
      req.params.feedbackId,
      { status: 'Reviewed', response: responseMessage, respondedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, message: 'Feedback response email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(PORT, () => {
  console.log(`\n🦷  RRDC&H Backend running at http://localhost:${PORT}`);
  console.log(`📋  Admin Dashboard : http://localhost:${PORT}/admin`);
  console.log(`🌐  Frontend        : http://localhost:${PORT}/frontend`);
  console.log(`🔑  Admin Creds     : ${ADMIN_USER} / ${ADMIN_PASS}`);
  console.log(`💾  Database        : ${MONGODB_URI}\n`);
});
