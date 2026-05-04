const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ✅ ADDED
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;

// 🔍 Debug check
console.log("MONGO_URI:", mongoURI ? "SET" : "NOT SET");

// =========================
// 🔐 ENCRYPTION CONFIG
// =========================
const algorithm = 'aes-256-cbc';

// ⚠️ MUST be set in Azure App Settings
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// Encrypt function
function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text) {
  if (!text) return "";

  const parts = text.split(':');
  if (parts.length !== 2) return text; // fallback for old data

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =========================
// 📦 SCHEMA
// =========================
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  role: { type: String, enum: ['patient', 'doctor', 'admin'] },
  symptoms: { type: String, default: "" },
  age: String,
  location: String,
  diagnosis: { type: String, default: "" },
  prescription: { type: String, default: "" },
  assignedDoctor: { type: String, default: null },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// =========================
// ❤️ HEALTH CHECK
// =========================
app.get('/', (req, res) => {
  res.send("API is running");
});

// =========================
// 🚀 ROUTES
// =========================

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, phone, symptoms, age, location } = req.body;

    // ✅ hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ encrypt sensitive fields
    const encPhone = encrypt(phone);
    const encSymptoms = encrypt(symptoms);
    const encLocation = encrypt(location);

    const newUser = new User({
      username,
      password: hashedPassword,
      phone: encPhone,
      symptoms: encSymptoms,
      age,
      location: encLocation,
      role: 'patient'
    });

    await newUser.save();
    res.status(201).json(newUser);

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET PATIENTS (WITH DECRYPTION)
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });

    const decryptedPatients = patients.map(p => ({
      ...p._doc,
      phone: decrypt(p.phone),
      symptoms: decrypt(p.symptoms),
      location: decrypt(p.location),
      diagnosis: decrypt(p.diagnosis),
      prescription: decrypt(p.prescription)
    }));

    res.json(decryptedPatients);

  } catch (err) {
    console.error("PATIENT FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ASSIGN DOCTOR
app.put('/api/assign', async (req, res) => {
  try {
    const { patientId, doctorName } = req.body;

    await User.findByIdAndUpdate(patientId, {
      assignedDoctor: doctorName,
      status: 'Assigned'
    });

    res.json({ msg: 'Assigned' });

  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// RESET PASSWORD
app.put('/api/reset-password', async (req, res) => {
  try {
    const { patientId, newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await User.findByIdAndUpdate(
      patientId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ msg: 'Password Reset Successful' });

  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// DIAGNOSIS (WITH ENCRYPTION)
app.put('/api/diagnose', async (req, res) => {
  try {
    const { patientId, diagnosis, prescription } = req.body;

    const encDiagnosis = encrypt(diagnosis);
    const encPrescription = encrypt(prescription);

    await User.findByIdAndUpdate(patientId, {
      diagnosis: encDiagnosis,
      prescription: encPrescription,
      status: 'Completed'
    });

    res.json({ msg: 'Finalized' });

  } catch (err) {
    console.error("DIAGNOSIS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE PATIENT
app.delete('/api/patients/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// =========================
// 🚀 START SERVER
// =========================
mongoose.connect(mongoURI, {
  dbName: "blulive-db",
  tls: true,
  retryWrites: false
})
.then(() => {
  console.log("✅ Connected to Cosmos DB");

  app.listen(PORT, () => {
    console.log(`📡 Server active on ${PORT}`);
  });

})
.catch(err => {
  console.error("❌ Cosmos DB connection error:", err);
});
