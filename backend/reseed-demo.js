// backend/reseed-demo.js
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const db = new sqlite3.Database('./reports.db');

const DEPARTMENTS = ['legal', 'task', 'support', 'happy2help'];
const INCIDENT_TYPES = {
  legal: ['harassment', 'discrimination', 'workplace', 'cyberbullying', 'legal_rights', 'policy_violation'],
  task: ['assault', 'domestic', 'stalking', 'violence', 'threats', 'safety_concern'],
  support: ['housing', 'financial', 'support', 'other', 'emergency_assistance', 'resource_access'],
  happy2help: ['mental', 'counseling', 'therapy', 'wellness', 'crisis_support', 'emotional_distress']
};
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['submitted', 'under_review', 'in_progress', 'resolved'];
const SAFETY = ['safe', 'unsafe', 'unsure'];
const LOCATIONS = [
  'Corporate Office - 5th Floor', 'Downtown Metro Station', 'University Campus', 'Shopping Mall - Food Court',
  'Apartment Complex', 'Workplace Parking Lot', 'Public Library', 'Community Center',
  'Hospital Emergency Room', 'School Cafeteria', 'Online Platform', 'Public Park', 'Bus Station', 'Restaurant'
];
const AGENTS = [
  'Agent Sarah Martinez', 'Detective Mike Chen', 'Agent Jennifer Wong', 'Dr. Lisa Rodriguez',
  'Agent David Kim', 'Counselor Maria Gonzalez', 'Detective James Wilson', 'Agent Rachel Thompson',
  'Dr. Michael Brown', 'Agent Amanda Davis'
];

function reportIdFor(n) {
  return `SAFE${String(12345000 + n).padStart(9, '0')}`;
}

function randomOf(list) { return list[Math.floor(Math.random() * list.length)]; }

function descriptionFor(type, n) {
  return `Case ${n}: ${type.replace('_',' ')} incident reported. Detailed narrative with context, actors, and impact unique to case ${n}.`;
}

function witnessFor(type) {
  const map = {
    harassment: ['Coworkers witnessed behavior', 'Security cams captured incident'],
    assault: ['Bystanders called for help', 'Police report available'],
    housing: ['Neighbors verified conditions', 'Housing authority documentation'],
    mental: ['Family concerned about wellbeing', 'Counselor initial assessment'],
    financial: ['Bank statements show fraud', 'Identity theft report filed'],
    discrimination: ['HR complaint on file', 'Colleagues witnessed bias'],
    stalking: ['Neighbors saw suspect', 'Screenshots of messages'],
    cyberbullying: ['Online harassment screenshots', 'Platform report IDs'],
    workplace: ['Supervisor emails', 'Peer statements'],
    domestic: ['Medical records and photos', 'Neighbor noise complaints'],
    legal_rights: ['Policy documents', 'Legal correspondence'],
    policy_violation: ['Policy excerpts', 'Enforcement emails'],
    threats: ['Text messages with threats', 'Voicemail recordings'],
    safety_concern: ['Safety inspection notes', 'Photos of hazard'],
    emergency_assistance: ['Emergency visit records', 'Service provider notes'],
    resource_access: ['Denial letters', 'Community advocate notes'],
    crisis_support: ['Crisis hotline records', 'Mental health assessment'],
    emotional_distress: ['Therapist notes', 'Journal entries']
  };
  const arr = map[type] || ['Witness statements available'];
  return randomOf(arr);
}

function evidenceFor(type) {
  const map = {
    harassment: ['Screenshots, emails', 'CCTV snippets'],
    assault: ['Photos of injuries', 'Police report #'],
    housing: ['Eviction notice', 'Unsafe photos'],
    mental: ['Assessment summary', 'Medication records'],
    financial: ['Fraud statements', 'Bank dispute case #'],
    discrimination: ['Email trail', 'Comparative performance docs'],
    stalking: ['Screenshots, call logs', 'Doorcam captures'],
    cyberbullying: ['Profile URLs', 'Report IDs'],
    workplace: ['HR notes', 'Supervisor memo'],
    domestic: ['Medical records', 'Text threats'],
    legal_rights: ['Policy pages', 'Lawyer letter'],
    policy_violation: ['Policy PDF excerpts', 'Internal memo'],
    threats: ['Audio files', 'Screenshots'],
    safety_concern: ['Hazard photos', 'Inspector notes'],
    emergency_assistance: ['Bills', 'Aid application'],
    resource_access: ['Denial letter', 'Email thread'],
    crisis_support: ['Hotline ticket', 'Counselor note'],
    emotional_distress: ['Therapy notes', 'Journal excerpts']
  };
  const arr = map[type] || ['Supporting files available'];
  return randomOf(arr);
}

function hashIP(ip) {
  const salt = 'demo-seed-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

async function run() {
  await exec(`PRAGMA foreign_keys = ON;`);

  // Wipe related tables
  await exec(`DELETE FROM messages`);
  await exec(`DELETE FROM case_updates`);
  await exec(`DELETE FROM reports`);
  await exec(`DELETE FROM users`);

  let caseNum = 0;
  for (const dept of DEPARTMENTS) {
    for (let i = 1; i <= 25; i++) {
      caseNum++;
      const reportId = reportIdFor(caseNum);
      const type = randomOf(INCIDENT_TYPES[dept]);
      const priority = randomOf(PRIORITIES);
      const status = randomOf(STATUSES);
      const safety = randomOf(SAFETY);
      const location = `${randomOf(LOCATIONS)} - Case ${caseNum}`;
      const daysAgo = Math.floor(Math.random() * 90);
      const date = new Date(Date.now() - daysAgo * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = `${String(Math.floor(Math.random()*24)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`;
      const agent = randomOf(AGENTS);
      const anonymous = Math.random() > 0.6 ? 1 : 0;
      const contactEmail = anonymous ? null : `user${caseNum}@example.com`;
      const contactMethod = anonymous ? null : 'email';
      const pin = String(100000 + caseNum).slice(0,6);

      const userId = await insert(`INSERT INTO users (anonymous_id, ip_hash, email, security_pin) VALUES (?,?,?,?)`, [
        `ANON_RESEED_${caseNum}`,
        hashIP(`seed_ip_${caseNum}`),
        contactEmail,
        pin
      ]);

      await insert(`INSERT INTO reports (
        report_id, user_id, incident_type, incident_date, incident_time, location,
        description, current_safety, witnesses, evidence, contact_method, contact_info, anonymous,
        assigned_department, assignment_confidence, assignment_reasoning,
        status, priority, assigned_agent, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
        reportId,
        userId,
        type,
        dateStr,
        timeStr,
        location,
        descriptionFor(type, caseNum),
        safety,
        witnessFor(type),
        evidenceFor(type),
        contactMethod,
        contactEmail,
        anonymous,
        dept,
        Math.floor(80 + Math.random()*20),
        JSON.stringify([`Type matched ${dept} specialization`, 'Keywords and context alignment', 'Confidence based on multiple signals']),
        status,
        priority,
        agent,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      await insert(`INSERT INTO messages (report_id, sender_type, sender_name, sender_department, message, encrypted, read_by_user, timestamp)
        VALUES (?,?,?,?,?,?,?, CURRENT_TIMESTAMP)`, [
        reportId,
        'department',
        dept.charAt(0).toUpperCase()+dept.slice(1)+ ' Team',
        dept,
        `Welcome. Your case ${reportId} has been assigned to our ${dept} team. We will respond soon.`,
        1,
        0
      ]);
    }
  }

  console.log('✅ Reseeded 100 unique reports (25 per department).');
  db.close();
}

function exec(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(err){ if (err) reject(err); else resolve(); }));
}

function insert(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(err){ if (err) reject(err); else resolve(this.lastID); }));
}

run().catch(err => { console.error('❌ Reseed error:', err); process.exit(1); });
