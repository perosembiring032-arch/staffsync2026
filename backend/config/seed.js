const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');

const seedAdmins = async () => {
  const admins = [
    { username: 'admin',  password: 'Admin@123456', role: 'admin', employeeId: 'ADM001', fullName: 'Admin Master 1' },
    { username: 'admin2', password: 'Admin@123456', role: 'admin', employeeId: 'ADM002', fullName: 'Admin Master 2' },
    { username: 'admin3', password: 'Admin@123456', role: 'admin', employeeId: 'ADM003', fullName: 'Admin Master 3' },
    { username: 'admin4', password: 'Admin@123456', role: 'admin', employeeId: 'ADM004', fullName: 'Admin Master 4' },
    { username: 'admin5', password: 'Admin@123456', role: 'admin', employeeId: 'ADM005', fullName: 'Admin Master 5' },
  ];
  for (const a of admins) {
    const exists = await Staff.findOne({ username: a.username });
    if (!exists) {
      const hash = await bcrypt.hash(a.password, 10);
      await Staff.create({ ...a, password: hash, isActive: true });
      console.log(`Seeded: ${a.username}`);
    }
  }
};

module.exports = { seedAdmins };
