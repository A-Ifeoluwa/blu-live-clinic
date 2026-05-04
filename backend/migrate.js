const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const mongoURI = process.env.MONGO_URI;

// 🔐 same config as your app
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  if (!text) return "";
  if (text.includes(':')) return text; // already encrypted

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// schema (same as your app)
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function migrate() {
  await mongoose.connect(mongoURI, {
    dbName: "blulive-db",
    tls: true,
    retryWrites: false
  });

  console.log("Connected...");

  const users = await User.find();

  for (let user of users) {
    let updated = false;

    // 🔐 HASH PASSWORD (only if not hashed)
    if (user.password && !user.password.startsWith('$2b$')) {
      user.password = await bcrypt.hash(user.password, 10);
      updated = true;
    }

    // 🔐 ENCRYPT FIELDS
    const fields = ['phone', 'symptoms', 'location', 'diagnosis', 'prescription'];

    for (let field of fields) {
      if (user[field] && !user[field].includes(':')) {
        user[field] = encrypt(user[field]);
        updated = true;
      }
    }

    if (updated) {
      await user.save();
      console.log(`Updated user: ${user._id}`);
    }
  }

  console.log("Migration complete ✅");
  process.exit();
}

migrate();
