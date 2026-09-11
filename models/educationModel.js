const { pool } = require('../config/db');
const { computeAttendanceRate } = require('../utils/calculations');

async function createConnection(parentProfileId, studentProfileId) {
  const { rows } = await pool.query(
    `INSERT INTO parent_student_connections (parent_profile_id, student_profile_id)
     VALUES ($1, $2) ON CONFLICT (parent_profile_id, student_profile_id) DO NOTHING
     RETURNING *`,
    [parentProfileId, studentProfileId]
  );
  return rows[0] || null;
}

async function listChildrenForParent(parentProfileId) {
  const { rows } = await pool.query(
    `SELECT p.* FROM parent_student_connections c
     JOIN profiles p ON p.id = c.student_profile_id
     WHERE c.parent_profile_id = $1 AND c.status = 'active'`,
    [parentProfileId]
  );
  return rows;
}

async function isParentOfStudent(parentProfileId, studentProfileId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM parent_student_connections
     WHERE parent_profile_id = $1 AND student_profile_id = $2 AND status = 'active'`,
    [parentProfileId, studentProfileId]
  );
  return rows.length > 0;
}

async function addResult(studentProfileId, { subject, score, maxScore, term }) {
  const { rows } = await pool.query(
    `INSERT INTO academic_results (student_profile_id, subject, score, max_score, term)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [studentProfileId, subject, score, maxScore || 100, term]
  );
  return rows[0];
}

async function listResults(studentProfileId) {
  const { rows } = await pool.query(
    'SELECT * FROM academic_results WHERE student_profile_id = $1 ORDER BY recorded_at DESC',
    [studentProfileId]
  );
  return rows;
}

async function recordAttendance(studentProfileId, date, present) {
  const { rows } = await pool.query(
    `INSERT INTO attendance (student_profile_id, date, present)
     VALUES ($1, $2, $3)
     ON CONFLICT (student_profile_id, date) DO UPDATE SET present = EXCLUDED.present
     RETURNING *`,
    [studentProfileId, date, present]
  );
  return rows[0];
}

async function getAttendanceRate(studentProfileId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE present) AS present_days,
       COUNT(*) AS total_days
     FROM attendance WHERE student_profile_id = $1`,
    [studentProfileId]
  );
  const { present_days, total_days } = rows[0];
  return { presentDays: Number(present_days), totalDays: Number(total_days), rate: computeAttendanceRate(present_days, total_days) };
}

async function addGoal(studentProfileId, { title, targetDate }) {
  const { rows } = await pool.query(
    'INSERT INTO academic_goals (student_profile_id, title, target_date) VALUES ($1, $2, $3) RETURNING *',
    [studentProfileId, title, targetDate]
  );
  return rows[0];
}

async function listGoals(studentProfileId) {
  const { rows } = await pool.query('SELECT * FROM academic_goals WHERE student_profile_id = $1', [studentProfileId]);
  return rows;
}

module.exports = {
  createConnection, listChildrenForParent, isParentOfStudent,
  addResult, listResults, recordAttendance, getAttendanceRate, addGoal, listGoals,
};
