/**
 * Seed script — creates initial admin, teachers, students, courses, marks, and attendance
 * Run: node config/seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student_management_system';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science'];
const CLASSES = ['Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 11B', 'Grade 12A'];
const EXAM_TYPES = ['Quiz', 'Midterm', 'Final', 'Assignment'];
const STATUSES = ['Present', 'Present', 'Present', 'Absent', 'Late']; // weighted toward present

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Marks.deleteMany({}),
      Attendance.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── 1. Create Admin ──────────────────────────────────────
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@edusync.com',
      password: 'admin123',
      role: 'administrator',
    });
    console.log('👤 Admin created: admin@edusync.com / admin123');

    // ── 2. Create Teachers ───────────────────────────────────
    const teacherData = [
      { name: 'Dr. Alice Mutesi', email: 'alice@edusync.com', password: 'teacher123' },
      { name: 'Prof. James Kalisa', email: 'james@edusync.com', password: 'teacher123' },
      { name: 'Ms. Grace Uwase', email: 'grace@edusync.com', password: 'teacher123' },
    ];
    const teachers = await User.insertMany(teacherData.map(t => ({ ...t, role: 'teacher' })));
    console.log(`👩‍🏫 ${teachers.length} teachers created`);

    // ── 3. Create Students ───────────────────────────────────
    const studentData = [
      { studentName: 'Emmanuel Nkurunziza', gender: 'Male', class: 'Grade 10A', address: 'Kigali, Gasabo', parentName: 'Jean Nkurunziza', phone: '+250788001001' },
      { studentName: 'Amina Habimana', gender: 'Female', class: 'Grade 10A', address: 'Kigali, Kicukiro', parentName: 'Marie Habimana', phone: '+250788001002' },
      { studentName: 'Patrick Mugabo', gender: 'Male', class: 'Grade 10B', address: 'Musanze', parentName: 'Pierre Mugabo', phone: '+250788001003' },
      { studentName: 'Diane Ingabire', gender: 'Female', class: 'Grade 10B', address: 'Huye', parentName: 'Paul Ingabire', phone: '+250788001004' },
      { studentName: 'Claude Ndayisaba', gender: 'Male', class: 'Grade 11A', address: 'Kigali, Nyarugenge', parentName: 'Rose Ndayisaba', phone: '+250788001005' },
      { studentName: 'Yvonne Mukamusoni', gender: 'Female', class: 'Grade 11A', address: 'Rubavu', parentName: 'Eric Mukamusoni', phone: '+250788001006' },
      { studentName: 'Thierry Bizimana', gender: 'Male', class: 'Grade 11B', address: 'Kigali, Gasabo', parentName: 'Alice Bizimana', phone: '+250788001007' },
      { studentName: 'Solange Uwineza', gender: 'Female', class: 'Grade 12A', address: 'Muhanga', parentName: 'Bernard Uwineza', phone: '+250788001008' },
      { studentName: 'Kevin Nzabonimpa', gender: 'Male', class: 'Grade 12A', address: 'Nyanza', parentName: 'Jacqueline Nzabonimpa', phone: '+250788001009' },
      { studentName: 'Liliane Mukamana', gender: 'Female', class: 'Grade 10A', address: 'Kigali, Kicukiro', parentName: 'Simon Mukamana', phone: '+250788001010' },
    ];
    const students = await Student.insertMany(studentData);
    console.log(`🎓 ${students.length} students created`);

    // ── 4. Create Student User Accounts ─────────────────────
    const studentUsers = await User.insertMany(
      students.slice(0, 3).map((s, i) => ({
        name: s.studentName,
        email: `student${i + 1}@edusync.com`,
        password: 'student123',
        role: 'student',
        studentId: s._id,
      }))
    );
    console.log(`🔑 ${studentUsers.length} student accounts created (student1@edusync.com … / student123)`);

    // ── 5. Create Courses ────────────────────────────────────
    const courseData = [
      { courseName: 'Advanced Mathematics', courseCode: 'MATH401', teacher: teachers[0]._id, class: 'Grade 11A', credits: 4, description: 'Calculus, algebra, and statistics' },
      { courseName: 'Physics Fundamentals', courseCode: 'PHY301', teacher: teachers[0]._id, class: 'Grade 10A', credits: 3, description: 'Mechanics, waves, and thermodynamics' },
      { courseName: 'English Literature', courseCode: 'ENG201', teacher: teachers[1]._id, class: 'Grade 10B', credits: 3, description: 'Prose, poetry and critical analysis' },
      { courseName: 'Chemistry Lab', courseCode: 'CHEM301', teacher: teachers[1]._id, class: 'Grade 11B', credits: 4, description: 'Organic and inorganic chemistry' },
      { courseName: 'Computer Science', courseCode: 'CS401', teacher: teachers[2]._id, class: 'Grade 12A', credits: 4, description: 'Algorithms, data structures, and programming' },
      { courseName: 'Biology', courseCode: 'BIO201', teacher: teachers[2]._id, class: 'Grade 10A', credits: 3, description: 'Cell biology, genetics, and ecology' },
    ];
    await Course.insertMany(courseData);
    console.log(`📚 ${courseData.length} courses created`);

    // ── 6. Create Marks ──────────────────────────────────────
    const marksData = [];
    for (const student of students) {
      const subjects = SUBJECTS.slice(0, 4 + Math.floor(Math.random() * 3));
      for (const subject of subjects) {
        for (const examType of ['Midterm', 'Final']) {
          marksData.push({
            studentId: student._id,
            subject,
            marks: Math.floor(40 + Math.random() * 60),
            maxMarks: 100,
            examType,
            term: 'Term 1',
            academicYear: '2024-2025',
            recordedBy: teachers[Math.floor(Math.random() * teachers.length)]._id,
          });
        }
      }
    }
    await Marks.insertMany(marksData);
    console.log(`📊 ${marksData.length} marks records created`);

    // ── 7. Create Attendance ─────────────────────────────────
    const attendanceData = [];
    const today = new Date();
    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

      for (const student of students) {
        for (const subject of SUBJECTS.slice(0, 3)) {
          attendanceData.push({
            studentId: student._id,
            date,
            status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
            subject,
            class: student.class,
            recordedBy: teachers[0]._id,
          });
        }
      }
    }

    // Insert in batches to avoid index conflicts
    const batchSize = 100;
    for (let i = 0; i < attendanceData.length; i += batchSize) {
      try {
        await Attendance.insertMany(attendanceData.slice(i, i + batchSize), { ordered: false });
      } catch (e) { /* ignore duplicates */ }
    }
    console.log(`📋 ~${attendanceData.length} attendance records created`);

    console.log('\n═══════════════════════════════════════════');
    console.log('✅  DATABASE SEEDED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════');
    console.log('\n🔐 Login credentials:');
    console.log('   ADMIN    → admin@edusync.com   / admin123');
    console.log('   TEACHER  → alice@edusync.com   / teacher123');
    console.log('   TEACHER  → james@edusync.com   / teacher123');
    console.log('   STUDENT  → student1@edusync.com / student123');
    console.log('   STUDENT  → student2@edusync.com / student123');
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
