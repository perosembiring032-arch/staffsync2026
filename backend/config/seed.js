require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./database');
const Staff = require('../models/Staff');

const seedDatabase = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await Staff.deleteMany({});

  const staffMembers = [];

  // Create master admin
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  staffMembers.push({
    name: 'Master Admin',
    username: 'admin',
    password: adminPassword,
    role: 'admin',
    employeeId: 'ADM001',
  });

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

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: username=admin, password=Admin@123456');
  console.log('👥 Staff: username=staff001~047, password=Staff@123456');

  process.exit(0);
};

seedDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
