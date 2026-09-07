// Section 18-20: Progress Engine turns raw academic data into stats.
const educationModel = require('../models/educationModel');
const profileService = require('../services/profileService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function connectToStudent(userId, studentProfileId) {
  const parentProfile = await profileService.requireOwnedProfile(userId, 'parent');
  const connection = await educationModel.createConnection(parentProfile.id, studentProfileId);
  if (!connection) throw httpError(409, 'Already connected to this student.');
  return connection;
}

async function listMyChildren(userId) {
  const parentProfile = await profileService.requireOwnedProfile(userId, 'parent');
  return educationModel.listChildrenForParent(parentProfile.id);
}

// Section 19: Raw Academic Data -> Progress Engine -> Statistics.
async function getProgress(userId, studentProfileId) {
  const isStudent = await tryGetOwnStudentProfile(userId, studentProfileId);
  if (!isStudent) {
    // Otherwise the requester must be the connected parent (Section 20).
    const parentProfile = await profileService.requireOwnedProfile(userId, 'parent');
    const allowed = await educationModel.isParentOfStudent(parentProfile.id, studentProfileId);
    if (!allowed) throw httpError(403, 'You are not connected to this student.');
  }

  const [results, attendance, goals] = await Promise.all([
    educationModel.listResults(studentProfileId),
    educationModel.getAttendanceRate(studentProfileId),
    educationModel.listGoals(studentProfileId),
  ]);

  const bySubject = {};
  for (const r of results) {
    if (!bySubject[r.subject]) bySubject[r.subject] = [];
    bySubject[r.subject].push({ score: Number(r.score), maxScore: Number(r.max_score), term: r.term, recordedAt: r.recorded_at });
  }

  const overallAverage = results.length
    ? results.reduce((sum, r) => sum + Number(r.score) / Number(r.max_score), 0) / results.length
    : null;

  return { subjectPerformance: bySubject, attendance, goals, overallAverage };
}

async function tryGetOwnStudentProfile(userId, studentProfileId) {
  try {
    const studentProfile = await profileService.requireOwnedProfile(userId, 'student');
    return studentProfile.id === studentProfileId;
  } catch (err) {
    return false;
  }
}

async function addResult(userId, body) {
  const studentProfile = await profileService.requireOwnedProfile(userId, 'student');
  return educationModel.addResult(studentProfile.id, body);
}

async function recordAttendance(userId, { date, present }) {
  const studentProfile = await profileService.requireOwnedProfile(userId, 'student');
  return educationModel.recordAttendance(studentProfile.id, date, present);
}

async function addGoal(userId, body) {
  const studentProfile = await profileService.requireOwnedProfile(userId, 'student');
  return educationModel.addGoal(studentProfile.id, body);
}

module.exports = { connectToStudent, listMyChildren, getProgress, addResult, recordAttendance, addGoal };

