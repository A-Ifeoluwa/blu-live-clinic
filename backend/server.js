const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Updated connection string for Cosmos DB (Mongo API)
const mongoURI = process.env.MONGO_URI;

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

const seedUsers = async () => {
  try {
    const doctors = ['Jonah Irande', 'Oluwatosin Daniel', 'Faith Bitrus'];
    for (let name of doctors) {
      await User.updateOne({ username: name }, { role: 'doctor', password: 'p@ssw0rd' }, { upsert: true });
    }
    await User.updateOne({ username: 'admin' }, { role: 'admin', password: 'p@ssw0rd' }, { upsert: true });
  } catch (err) { console.error('Seed error:', err); }
};

// ✅ Added connection options for Cosmos DB
mongoose.connect(mongoURI, { tls: true, retryWrites: false })
  .then(() => seedUsers())
  .catch(err => console.error("Cosmos DB connection error:", err));

// --- ROUTES ---

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, phone, symptoms, age, location } = req.body;
    const newUser = new User({ username, password, phone, symptoms, age, location, role: 'patient' });
    await newUser.save();
    res.status(201).send(newUser);
  } catch (err) { res.status(500).send({ error: "Register failed" }); }
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });
    res.json(patients);
  } catch (err) {
    console.error("PATIENT FETCH ERROR:", err);
    res.status(500).send({ error: err.message });
  }
});

app.put('/api/assign', async (req, res) => {
  try {
    const { patientId, doctorName } = req.body;
    await User.findByIdAndUpdate(patientId, { assignedDoctor: doctorName, status: 'Assigned' });
    res.send({ msg: 'Assigned' });
  } catch (err) { res.status(500).send({ error: "Assign failed" }); }
});

app.put('/api/reset-password', async (req, res) => {
  try {
    const { patientId, newPassword } = req.body;
    const updated = await User.findByIdAndUpdate(patientId, { password: newPassword }, { new: true });
    if (!updated) return res.status(404).send({ error: "Patient not found" });
    res.send({ msg: 'Password Reset Successful' });
  } catch (err) { res.status(500).send({ error: "Reset failed" }); }
});

app.put('/api/diagnose', async (req, res) => {
  try {
    const { patientId, diagnosis, prescription } = req.body;
    await User.findByIdAndUpdate(patientId, { diagnosis, prescription, status: 'Completed' });
    res.send({ msg: 'Finalized' });
  } catch (err) { res.status(500).send({ error: "Diagnosis failed" }); }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send({ msg: 'Deleted' });
  } catch (err) { res.status(500).send({ error: "Delete failed" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`📡 Server active on ${PORT}`));
