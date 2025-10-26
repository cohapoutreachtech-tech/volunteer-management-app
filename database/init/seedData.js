const bcrypt = require('bcrypt');

const users = [
  {
    name: 'COHAP Admin',
    email: 'admin@cohap.org',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    organization: 'COHAP'
  },
  {
    name: 'John Volunteer',
    email: 'volunteer@cohap.org',
    password: bcrypt.hashSync('volunteer123', 10),
    role: 'volunteer',
    organization: 'Community Helper'
  }
];

const events = [
  {
    title: 'COHAP Community Cleanup',
    date: new Date('2024-03-15'),
    location: 'Central Park',
    description: 'COHAP organized community park cleanup',
    maxVolunteers: 20,
    organization: 'COHAP'
  },
  {
    title: 'COHAP Food Drive',
    date: new Date('2024-03-20'),
    location: 'COHAP Community Center',
    description: 'Monthly food donation drive',
    maxVolunteers: 15,
    organization: 'COHAP'
  }
];

module.exports = { users, events };
