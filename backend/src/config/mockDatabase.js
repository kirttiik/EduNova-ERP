/**
 * In-Memory Mock Database
 * 
 * Provides a fully functional mock database for local development
 * without needing Firebase credentials. Data persists in memory
 * during server runtime.
 * 
 * Pre-seeded with demo data for 40+ schools, teachers, and staff.
 */

const crypto = require('crypto');

// ============================================
// HELPER: Generate unique IDs
// ============================================
const generateId = () => crypto.randomUUID();

// ============================================
// DEMO DATA: Pre-seeded schools
// ============================================
const schoolNames = [
  'Adani Vidyalaya Mundra', 'Adani Public School Ahmedabad', 'Adani DAV Public School Dhamra',
  'Adani Vidyamandir Bhadreshwar', 'Navchetan Vidyalaya Mundra', 'Adani Foundation School Hazira',
  'Gyanodaya Vidyalaya Tiroda', 'Adani School Kawai', 'Adani Vidya Niketan Surguja',
  'Adani Foundation School Godda', 'Adani School Dahej', 'Pragnya Vidyalaya Mundra',
  'Adani Vidyalaya Udupi', 'Adani Public School Vizhinjam', 'Adani Foundation School Goa',
  'Adani School Dhamra Port', 'Adani Vidyalaya Chhindwara', 'Navjyoti Vidyalaya Mundra',
  'Adani Foundation School Morbi', 'Adani School Mihan', 'Gyandeep Vidyalaya Mundra',
  'Adani Public School Lucknow', 'Adani Foundation School Raipur', 'Adani Vidyalaya Bhopal',
  'Adani School Jaipur', 'Adani Foundation School Patna', 'Adani Vidyalaya Ranchi',
  'Adani Public School Kolkata', 'Adani Foundation School Chandigarh', 'Adani School Dehradun',
  'Adani Vidyalaya Shimla', 'Adani Foundation School Jammu', 'Adani Public School Srinagar',
  'Adani School Gangtok', 'Adani Vidyalaya Imphal', 'Adani Foundation School Agartala',
  'Adani School Aizawl', 'Adani Vidyalaya Kohima', 'Adani Foundation School Itanagar',
  'Adani Public School Shillong', 'Adani School Bhubaneswar', 'Adani Vidyalaya Raigarh'
];

const locations = [
  'Mundra, Gujarat', 'Ahmedabad, Gujarat', 'Dhamra, Odisha',
  'Bhadreshwar, Gujarat', 'Mundra, Gujarat', 'Hazira, Gujarat',
  'Tiroda, Maharashtra', 'Kawai, Rajasthan', 'Surguja, Chhattisgarh',
  'Godda, Jharkhand', 'Dahej, Gujarat', 'Mundra, Gujarat',
  'Udupi, Karnataka', 'Vizhinjam, Kerala', 'Goa',
  'Dhamra Port, Odisha', 'Chhindwara, MP', 'Mundra, Gujarat',
  'Morbi, Gujarat', 'Mihan, Maharashtra', 'Mundra, Gujarat',
  'Lucknow, UP', 'Raipur, Chhattisgarh', 'Bhopal, MP',
  'Jaipur, Rajasthan', 'Patna, Bihar', 'Ranchi, Jharkhand',
  'Kolkata, West Bengal', 'Chandigarh', 'Dehradun, Uttarakhand',
  'Shimla, HP', 'Jammu, J&K', 'Srinagar, J&K',
  'Gangtok, Sikkim', 'Imphal, Manipur', 'Agartala, Tripura',
  'Aizawl, Mizoram', 'Kohima, Nagaland', 'Itanagar, Arunachal Pradesh',
  'Shillong, Meghalaya', 'Bhubaneswar, Odisha', 'Raigarh, Chhattisgarh'
];

const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Physical Education', 'Art & Craft', 'Music', 'Sanskrit'];
const designations = ['PGT', 'TGT', 'PRT', 'Headmaster', 'Vice Principal', 'Lab Assistant', 'Librarian', 'Clerk', 'Peon', 'Security Guard'];
const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const timeSlots = ['08:00-08:45', '08:45-09:30', '09:30-10:15', '10:30-11:15', '11:15-12:00', '12:00-12:45', '13:30-14:15', '14:15-15:00'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Anita', 'Rahul', 'Kavita', 'Suresh', 'Meena', 'Deepak', 'Nisha', 'Arun', 'Pooja', 'Manoj', 'Rekha', 'Sanjay', 'Geeta', 'Ravi', 'Seema'];
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Verma', 'Gupta', 'Joshi', 'Yadav', 'Mishra', 'Chauhan', 'Pandey', 'Agarwal', 'Reddy', 'Nair', 'Iyer', 'Das', 'Roy', 'Banerjee', 'Mehta', 'Shah'];

// ============================================
// GENERATE MOCK DATA
// ============================================

// Generate Schools
const schools = schoolNames.map((name, i) => ({
  id: `school_${i + 1}`,
  name,
  location: locations[i] || 'India',
  coordinatorId: `user_school_${i + 1}`,
  totalStaff: Math.floor(Math.random() * 30) + 15,
  totalTeachers: Math.floor(Math.random() * 20) + 10,
  totalStudents: Math.floor(Math.random() * 500) + 200,
  status: 'active',
  createdAt: new Date().toISOString()
}));

// Generate Users (Admin + School Coordinators)
const users = [
  {
    id: 'user_admin_1',
    email: 'admin@adanifoundation.org',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    name: 'Adani Foundation Admin',
    role: 'admin',
    schoolId: null,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  ...schools.map((school, i) => ({
    id: `user_school_${i + 1}`,
    email: `coordinator${i + 1}@edunova.in`,
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    role: 'school_coordinator',
    schoolId: school.id,
    schoolName: school.name,
    status: 'active',
    createdAt: new Date().toISOString()
  }))
];

// Generate Staff for each school
const staff = [];
schools.forEach((school) => {
  const numTeaching = Math.floor(Math.random() * 12) + 8;
  const numNonTeaching = Math.floor(Math.random() * 6) + 3;

  // Teaching staff
  for (let j = 0; j < numTeaching; j++) {
    staff.push({
      id: generateId(),
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      designation: designations[Math.floor(Math.random() * 3)], // PGT, TGT, PRT
      level: levels[Math.floor(Math.random() * levels.length)],
      type: 'teaching',
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      schoolId: school.id,
      schoolName: school.name,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }

  // Non-teaching staff
  for (let j = 0; j < numNonTeaching; j++) {
    staff.push({
      id: generateId(),
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      designation: designations[Math.floor(Math.random() * 5) + 5], // Non-teaching designations
      level: levels[Math.floor(Math.random() * levels.length)],
      type: 'non-teaching',
      subject: null,
      schoolId: school.id,
      schoolName: school.name,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }
});

// Generate Timetable entries
const timetable = [];
schools.forEach((school) => {
  const schoolStaff = staff.filter(s => s.schoolId === school.id && s.type === 'teaching');
  schoolStaff.forEach((teacher) => {
    // Each teacher teaches 3-5 periods per day
    days.forEach((day) => {
      const numPeriods = Math.floor(Math.random() * 3) + 3;
      const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numPeriods; i++) {
        timetable.push({
          id: generateId(),
          schoolId: school.id,
          schoolName: school.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          className: `Class ${classes[Math.floor(Math.random() * classes.length)]}`,
          section: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          subject: teacher.subject || subjects[Math.floor(Math.random() * subjects.length)],
          day,
          timeSlot: shuffledSlots[i],
          createdAt: new Date().toISOString()
        });
      }
    });
  });
});

// Generate Attendance records for last 7 days
const attendance = [];
const today = new Date();
for (let d = 0; d < 7; d++) {
  const date = new Date(today);
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().split('T')[0];

  staff.forEach((member) => {
    const isPresent = Math.random() > 0.15; // 85% attendance rate
    attendance.push({
      id: generateId(),
      staffId: member.id,
      staffName: member.name,
      schoolId: member.schoolId,
      schoolName: member.schoolName,
      designation: member.designation,
      level: member.level,
      type: member.type,
      date: dateStr,
      status: isPresent ? 'present' : 'absent',
      remarks: isPresent ? '' : ['Sick leave', 'Personal work', 'Official duty', 'Casual leave'][Math.floor(Math.random() * 4)],
      markedAt: new Date().toISOString()
    });
  });
}

// Notifications
const notifications = [
  { id: generateId(), title: 'System Update', message: 'EduNova v1.0 is now live!', type: 'info', read: false, createdAt: new Date().toISOString() },
  { id: generateId(), title: 'Low Attendance Alert', message: 'Adani Vidyalaya Mundra reported 72% attendance today', type: 'warning', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: generateId(), title: 'New School Added', message: 'Adani Vidyalaya Raigarh has been added to the system', type: 'success', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: generateId(), title: 'Timetable Conflict', message: 'Teacher Rajesh Sharma has overlapping schedules', type: 'error', read: false, createdAt: new Date(Date.now() - 10800000).toISOString() },
];

// ============================================
// MOCK DATABASE STORE
// ============================================
const mockDB = {
  users,
  schools,
  staff,
  timetable,
  attendance,
  notifications
};

// ============================================
// DATABASE ACCESS FUNCTIONS
// ============================================

/**
 * Get all items from a collection with optional filtering
 */
const getAll = (collection, filters = {}) => {
  let items = [...mockDB[collection]];
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== 'all') {
      items = items.filter(item => item[key] === filters[key]);
    }
  });

  return items;
};

/**
 * Get a single item by ID
 */
const getById = (collection, id) => {
  return mockDB[collection].find(item => item.id === id) || null;
};

/**
 * Get items matching a field value
 */
const getByField = (collection, field, value) => {
  return mockDB[collection].filter(item => item[field] === value);
};

/**
 * Add a new item to a collection
 */
const add = (collection, data) => {
  const item = { id: generateId(), ...data, createdAt: new Date().toISOString() };
  mockDB[collection].push(item);
  return item;
};

/**
 * Update an existing item
 */
const update = (collection, id, data) => {
  const index = mockDB[collection].findIndex(item => item.id === id);
  if (index === -1) return null;
  mockDB[collection][index] = { ...mockDB[collection][index], ...data, updatedAt: new Date().toISOString() };
  return mockDB[collection][index];
};

/**
 * Delete an item
 */
const remove = (collection, id) => {
  const index = mockDB[collection].findIndex(item => item.id === id);
  if (index === -1) return false;
  mockDB[collection].splice(index, 1);
  return true;
};

/**
 * Bulk upsert attendance records
 */
const bulkUpsertAttendance = (records) => {
  records.forEach(record => {
    const index = mockDB.attendance.findIndex(
      a => a.staffId === record.staffId && a.date === record.date
    );
    if (index !== -1) {
      mockDB.attendance[index] = { ...mockDB.attendance[index], ...record, markedAt: new Date().toISOString() };
    } else {
      mockDB.attendance.push({ id: generateId(), ...record, markedAt: new Date().toISOString() });
    }
  });
  return records.length;
};

module.exports = {
  mockDB,
  getAll,
  getById,
  getByField,
  add,
  update,
  remove,
  bulkUpsertAttendance
};
