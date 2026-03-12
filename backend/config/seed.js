require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./database');
const Staff = require('../models/Staff');
const IpWhitelist = require('../models/IpWhitelist');

const seedDatabase = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await Staff.deleteMany({});

  const staffMembers = [];

  // Create 5 master admin
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admins = [
    { name: 'Master Admin 1', username: 'admin',  employeeId: 'ADM001' },
    { name: 'Master Admin 2', username: 'admin2', employeeId: 'ADM002' },
    { name: 'Master Admin 3', username: 'admin3', employeeId: 'ADM003' },
    { name: 'Master Admin 4', username: 'admin4', employeeId: 'ADM004' },
    { name: 'Master Admin 5', username: 'admin5', employeeId: 'ADM005' },
  ];
  for (const a of admins) {
    staffMembers.push({ ...a, password: adminPassword, role: 'admin' });
  }

  // Create 47 staff members
  const staffNames = [
    'Budi Santoso', 'Andi Prasetyo', 'Citra Dewi', 'Dian Kusuma', 'Eka Putri',
    'Fajar Nugroho', 'Gita Sari', 'Hendra Wijaya', 'Indah Lestari', 'Joko Susilo',
    'Kartika Sari', 'Lukman Hakim', 'Maya Anggraini', 'Nanda Rizky', 'Oktavia Wulan',
    'Pandu Setiawan', 'Qorina Hasanah', 'Rudi Hartono', 'Sinta Melani', 'Taufiq Rahman',
    'Umar Firmansyah', 'Vina Rahayu', 'Wahyu Hidayat', 'Xena Permata', 'Yusuf Abidin',
    'Zara Novita', 'Agus Supriadi', 'Bagas Kurniawan', 'Cahya Fitriani', 'Deni Setiawan',
    'Elisa Pertiwi', 'Firman Saputra', 'Grace Situmorang', 'Hadi Prasetyo', 'Ira Safitri',
    'Johan Budianto', 'Kiki Andriani', 'Leni Marlina', 'Miko Saputra', 'Nina Kusumawati',
    'Oscar Wibowo', 'Putri Handayani', 'Qori Damayanti', 'Reza Fauzan', 'Sari Utami',
    'Teguh Santosa', 'Uci Rahmawati'
  ];

  for (let i = 0; i < 47; i++) {
    const password = await bcrypt.hash('Staff@123456', 12);
    const empId = String(i + 1).padStart(3, '0');
    staffMembers.push({
      name: staffNames[i],
      username: `staff${empId}`,
      password: password,
      role: 'staff',
      employeeId: `EMP${empId}`,
    });
  }

  await Staff.insertMany(staffMembers);

  // Seed default IP whitelist
  await IpWhitelist.deleteMany({});
  await IpWhitelist.insertMany([
    { ip: '127.0.0.1', label: 'Localhost (default)', isActive: true },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: username=admin, password=Admin@123456');
  console.log('👥 Staff: username=staff001~047, password=Staff@123456');

  process.exit(0);
};

seedDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
