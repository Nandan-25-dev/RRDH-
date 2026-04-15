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
const Medicine = require('./models/Medicine');
const Invoice = require('./models/Invoice');
const MedicineOrder = require('./models/MedicineOrder');

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
    const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    // Send email notification to patient based on status
    if (appointment.patientEmail) {
      const doctor = await Doctor.findById(req.session.doctorId);
      const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor';

      if (status === 'Confirmed') {
        await emailService.sendEmail(
          appointment.patientEmail,
          '✅ Your Appointment has been Confirmed',
          `<h2>Good News!</h2>
           <p>Your appointment scheduled for <strong>${new Date(appointment.date).toLocaleDateString()}</strong> at <strong>${appointment.time}</strong> has been <strong>CONFIRMED</strong> by ${doctorName}.</p>
           <p><strong>Department:</strong> ${appointment.department}</p>
           <p><strong>Service:</strong> ${appointment.service || 'Consultation'}</p>
           <p>Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible.</p>
           <p>Appointment ID: ${appointment._id}</p>`
        );
      } else if (status === 'Rejected' || status === 'Cancelled') {
        await emailService.sendEmail(
          appointment.patientEmail,
          '❌ Your Appointment has been ' + status,
          `<h2>Appointment ${status}</h2>
           <p>Unfortunately, your appointment scheduled for <strong>${new Date(appointment.date).toLocaleDateString()}</strong> has been <strong>${status}</strong> by the doctor.</p>
           <p><strong>Reason:</strong> Please contact us for more details.</p>
           <p>You can book another appointment at your convenience.</p>
           <p>Appointment ID: ${appointment._id}</p>`
        );
      }
    }

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

      // Send confirmation email to patient
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

      // Send notification email to doctor about new appointment
      if (doctor && doctor.email) {
        await emailService.sendEmail(
          doctor.email,
          '📅 New Appointment Booking',
          `<h2>New Appointment Request</h2>
           <p><strong>Patient Name:</strong> ${patient.firstName} ${patient.lastName}</p>
           <p><strong>Contact:</strong> ${patient.phone}</p>
           <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
           <p><strong>Time:</strong> ${time}</p>
           <p><strong>Service:</strong> ${service.name}</p>
           <p><strong>Department:</strong> ${service.category || 'General'}</p>
           <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
           <p>Please log in to your dashboard to confirm or reject this appointment.</p>
           <p>Appointment ID: ${appointment._id}</p>`
        );
      }

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

    // Send email notification to patient if status changes
    if (appointment.patientEmail && (status === 'Confirmed' || status === 'Cancelled')) {
      const message = status === 'Confirmed' 
        ? `<h2>✅ Appointment Confirmed</h2>
           <p>Your appointment scheduled for <strong>${new Date(appointment.date).toLocaleDateString()}</strong> at <strong>${appointment.time}</strong> has been <strong>CONFIRMED</strong>.</p>`
        : `<h2>❌ Appointment Cancelled</h2>
           <p>Your appointment scheduled for <strong>${new Date(appointment.date).toLocaleDateString()}</strong> has been <strong>CANCELLED</strong>.</p>`;

      await emailService.sendEmail(
        appointment.patientEmail,
        `Appointment ${status === 'Confirmed' ? 'Confirmed ✅' : 'Cancelled ❌'}`,
        message + `<p><strong>Department:</strong> ${appointment.department}</p>
                  <p><strong>Service:</strong> ${appointment.service || 'Consultation'}</p>
                  <p>Appointment ID: ${appointment._id}</p>`
      );
    }

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

/* ============================================================
   DASHBOARDS
   ============================================================ */

/* PATIENT DASHBOARD */
app.get('/api/patient/dashboard', requirePatientLogin, async (req, res) => {
  try {
    const patientId = req.session.patientId;
    const dashboardData = {
      upcomingAppointments: await Appointment.find({ patientId, status: { $in: ['Pending', 'Confirmed'] } }).sort({ date: 1 }).limit(5).lean(),
      pastAppointments: await Appointment.find({ patientId, status: 'Completed' }).sort({ date: -1 }).limit(5).lean(),
      prescriptions: await Prescription.find({ patientId }).sort({ issuedAt: -1 }).limit(5).lean(),
      payments: await Payment.find({ patientId }).sort({ createdAt: -1 }).limit(5).lean(),
      notifications: await Notification.find({ recipientId: patientId }).sort({ sentAt: -1 }).limit(10).lean(),
      stats: {
        totalAppointments: await Appointment.countDocuments({ patientId }),
        completedAppointments: await Appointment.countDocuments({ patientId, status: 'Completed' }),
        pendingAppointments: await Appointment.countDocuments({ patientId, status: 'Pending' }),
        totalPrescriptions: await Prescription.countDocuments({ patientId })
      }
    };
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* DOCTOR DASHBOARD */
app.get('/api/doctor/dashboard', requireDoctorLogin, async (req, res) => {
  try {
    const doctorId = req.session.doctorId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dashboardData = {
      todayAppointments: await Appointment.find({ doctorId, date: { $gte: today, $lt: tomorrow } }).sort({ time: 1 }).lean(),
      upcomingAppointments: await Appointment.find({ doctorId, status: { $in: ['Pending', 'Confirmed'] }, date: { $gte: today } }).sort({ date: 1 }).limit(10).lean(),
      completedAppointments: await Appointment.find({ doctorId, status: 'Completed' }).sort({ date: -1 }).limit(5).lean(),
      doctorInfo: await Doctor.findById(doctorId).select('-password').lean(),
      stats: {
        totalAppointments: await Appointment.countDocuments({ doctorId }),
        todayAppointments: await Appointment.countDocuments({ doctorId, date: { $gte: today, $lt: tomorrow } }),
        completedAppointments: await Appointment.countDocuments({ doctorId, status: 'Completed' }),
        pendingAppointments: await Appointment.countDocuments({ doctorId, status: 'Pending' }),
        confirmedAppointments: await Appointment.countDocuments({ doctorId, status: 'Confirmed' })
      }
    };
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* STUDENT DASHBOARD */
app.get('/api/student/dashboard', requirePatientLogin, async (req, res) => {
  try {
    const studentId = req.session.patientId;
    
    // Assuming student data is stored in Patient model with studentInfo
    const studentData = await Patient.findById(studentId).lean();
    
    const dashboardData = {
      studentInfo: {
        name: studentData.firstName + ' ' + studentData.lastName,
        email: studentData.email,
        studentId: studentData.studentId || 'Not Set'
      },
      academicStats: {
        attendance: 85,
        internalMarks: 72,
        clinicalQuota: 45,
        totalProcedures: 100
      },
      upcomingRotations: [],
      simulationLabBookings: [],
      certificates: [],
      feedbackFromFaculty: [],
      stats: {
        totalClinicalHours: 240,
        completedProcedures: 45,
        pendingAssignments: 3,
        courses: 8
      }
    };
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   MEDICINE & PHARMACY
   ============================================================ */

/* ADMIN - Seed demo medicines */
app.post('/api/admin/seed-medicines', requireAdmin, async (req, res) => {
  try {
    const count = await Medicine.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Medicines already exist', count });
    }

    const sampleMedicines = [
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin Trihydrate',
        manufacturer: 'Cipla Ltd',
        price: 180,
        quantity: 500,
        dosage: '500mg',
        type: 'Antibiotic',
        description: 'Broad-spectrum antibiotic for bacterial infections and dental procedures',
        sideEffects: 'Allergic reactions, upset stomach, nausea',
        warnings: 'Not for patients with penicillin allergy',
        expiryDate: new Date('2026-12-31'),
        batchNumber: 'LOT2026001',
        stockAlert: 20,
        isActive: true
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        manufacturer: 'Lupin Limited',
        price: 120,
        quantity: 300,
        dosage: '400mg',
        type: 'Analgesic',
        description: 'Pain reliever and anti-inflammatory for dental pain',
        sideEffects: 'Stomach upset, dizziness, headache',
        warnings: 'Not recommended for patients with stomach ulcers',
        expiryDate: new Date('2026-11-30'),
        batchNumber: 'LOT2026002',
        stockAlert: 15,
        isActive: true
      },
      {
        name: 'Metronidazole',
        genericName: 'Metronidazole',
        manufacturer: 'Ranbaxy Laboratories',
        price: 200,
        quantity: 250,
        dosage: '400mg',
        type: 'Antibiotic',
        description: 'Effective against anaerobic bacteria and protozoal infections',
        sideEffects: 'Metallic taste, nausea, dark urine',
        warnings: 'Avoid alcohol consumption during treatment',
        expiryDate: new Date('2026-10-31'),
        batchNumber: 'LOT2026003',
        stockAlert: 15,
        isActive: true
      },
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine Hydrochloride',
        manufacturer: 'Torrent Pharmaceuticals',
        price: 150,
        quantity: 400,
        dosage: '10mg',
        type: 'Antihistamine',
        description: 'Antihistamine for allergic reactions and oral allergy relief',
        sideEffects: 'Drowsiness, headache, dry mouth',
        warnings: 'Avoid operating machinery',
        expiryDate: new Date('2027-06-30'),
        batchNumber: 'LOT2026004',
        stockAlert: 20,
        isActive: true
      },
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        manufacturer: 'GlaxoSmithKline',
        price: 100,
        quantity: 600,
        dosage: '500mg',
        type: 'Analgesic',
        description: 'Fever reducer and mild pain reliever',
        sideEffects: 'Rare allergic reactions, liver damage in overdose',
        warnings: 'Do not exceed recommended dosage',
        expiryDate: new Date('2027-03-31'),
        batchNumber: 'LOT2026005',
        stockAlert: 25,
        isActive: true
      },
      {
        name: 'Chlorhexidine',
        genericName: 'Chlorhexidine Gluconate',
        manufacturer: 'Colgate Palmolive',
        price: 250,
        quantity: 150,
        dosage: '0.12%',
        type: 'Antimicrobial',
        description: 'Oral rinse for gingivitis and periodontal disease prevention',
        sideEffects: 'Staining of teeth and tongue, altered taste',
        warnings: 'Not for long-term daily use beyond 2 weeks',
        expiryDate: new Date('2027-09-30'),
        batchNumber: 'LOT2026006',
        stockAlert: 10,
        isActive: true
      },
      {
        name: 'Tetracycline',
        genericName: 'Tetracycline Hydrochloride',
        manufacturer: 'Sun Pharmaceutical',
        price: 220,
        quantity: 200,
        dosage: '250mg',
        type: 'Antibiotic',
        description: 'Broad-spectrum antibiotic for severe dental infections',
        sideEffects: 'Photosensitivity, nausea, discoloration',
        warnings: 'Avoid in pregnancy and children under 12',
        expiryDate: new Date('2026-08-31'),
        batchNumber: 'LOT2026007',
        stockAlert: 12,
        isActive: true
      },
      {
        name: 'Dexamethasone',
        genericName: 'Dexamethasone',
        manufacturer: 'Merck',
        price: 180,
        quantity: 100,
        dosage: '0.5mg',
        type: 'Corticosteroid',
        description: 'Anti-inflammatory corticosteroid for severe swelling',
        sideEffects: 'Increased appetite, insomnia, mood changes',
        warnings: 'Short-term use only, consult doctor before use',
        expiryDate: new Date('2026-12-31'),
        batchNumber: 'LOT2026008',
        stockAlert: 8,
        isActive: true
      }
    ];

    const created = await Medicine.insertMany(sampleMedicines);
    res.json({ success: true, message: 'Medicines seeded successfully', count: created.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* GET all medicines */
app.get('/api/medicines', async (req, res) => {
  try {
    const medicines = await Medicine.find({ isActive: true }).lean();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* GET medicine by ID */
app.get('/api/medicines/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).lean();
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ADMIN - Create medicine */
app.post('/api/admin/medicines', requireAdmin, async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ADMIN - Update medicine */
app.patch('/api/admin/medicines/:id', requireAdmin, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* PATIENT - Place medicine order */
app.post('/api/medicine-order', requirePatientLogin, async (req, res) => {
  try {
    const { medicines, paymentMethod, deliveryAddress } = req.body;
    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ error: 'No medicines selected' });
    }

    const patient = await Patient.findById(req.session.patientId);
    let totalAmount = 0;
    const orderMedicines = [];

    for (const item of medicines) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ error: `Medicine ${item.medicineId} not found` });
      }

      const itemTotal = medicine.price * item.quantity;
      totalAmount += itemTotal;
      orderMedicines.push({
        medicineId: medicine._id,
        name: medicine.name,
        quantity: item.quantity,
        dosage: medicine.dosage,
        price: medicine.price,
        subtotal: itemTotal
      });
    }

    const medicineOrder = new MedicineOrder({
      orderNumber: `MED-${Date.now()}`,
      patientId: req.session.patientId,
      medicines: orderMedicines,
      totalAmount,
      paymentMethod,
      deliveryAddress: deliveryAddress || patient.address,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    await medicineOrder.save();

    // Send confirmation email
    await emailService.sendEmail(
      patient.email,
      '💊 Medicine Order Placed Successfully',
      `<h2>Order Confirmation</h2>
       <p>Your medicine order has been placed successfully.</p>
       <p><strong>Order Number:</strong> ${medicineOrder.orderNumber}</p>
       <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
       <p><strong>Estimated Delivery:</strong> ${medicineOrder.estimatedDelivery.toLocaleDateString()}</p>
       <p><strong>Payment Method:</strong> ${paymentMethod}</p>
       <p>You will receive updates on your order status.</p>`
    );

    res.status(201).json({ success: true, order: medicineOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* PATIENT - Get medicine orders */
app.get('/api/patient/medicine-orders', requirePatientLogin, async (req, res) => {
  try {
    const orders = await MedicineOrder.find({ patientId: req.session.patientId })
      .sort({ createdAt: -1 })
      .populate('medicines.medicineId')
      .lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   INVOICES
   ============================================================ */

/* ADMIN - Create invoice */
app.post('/api/admin/invoices', requireAdmin, async (req, res) => {
  try {
    const { patientId, appointmentId, items, paymentMethod, notes } = req.body;
    
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.amount;
    });

    const tax = Math.round(subtotal * 0.05); // 5% tax
    const totalAmount = subtotal + tax;

    const invoice = new Invoice({
      invoiceNumber: `INV-${Date.now()}`,
      patientId,
      appointmentId,
      items,
      subtotal,
      tax,
      totalAmount,
      paymentMethod,
      paymentStatus: 'Pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes,
      issuedBy: req.session.adminId
    });

    await invoice.save();

    // Send invoice email
    const patient = await Patient.findById(patientId);
    if (patient) {
      await emailService.sendEmail(
        patient.email,
        '📄 Invoice Generated',
        `<h2>Your Invoice</h2>
         <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
         <p><strong>Subtotal:</strong> ₹${subtotal}</p>
         <p><strong>Tax (5%):</strong> ₹${tax}</p>
         <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
         <p><strong>Payment Status:</strong> ${invoice.paymentStatus}</p>
         <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
         <p>Please log in to your dashboard to make payment.</p>`
      );
    }

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* GET patient invoices */
app.get('/api/patient/invoices', requirePatientLogin, async (req, res) => {
  try {
    const invoices = await Invoice.find({ patientId: req.session.patientId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* GET invoice by ID */
app.get('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* UPDATE invoice payment status */
app.patch('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, paidDate: paymentStatus === 'Paid' ? new Date() : null },
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ============================================================
   SEND FEEDBACK RESPONSE EMAIL */
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
