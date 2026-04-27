// Profile module
// Reads and writes the creator's profile data (display name, bio, photo URL)

async function getProfile(userId) {
  const doc = await db
    .collection('users').doc(userId)
    .collection('profile').doc('data')
    .get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function updateProfile(userId, fields) {
  const allowed = {};
  if (typeof fields.displayName === 'string') {
    allowed.displayName = fields.displayName.trim().slice(0, 100);
  }
  if (typeof fields.bio === 'string') {
    allowed.bio = fields.bio.trim().slice(0, 160);
  }
  if (typeof fields.photoURL === 'string') {
    allowed.photoURL = fields.photoURL.trim();
  }
  if (Object.keys(allowed).length === 0) return;
  await db
    .collection('users').doc(userId)
    .collection('profile').doc('data')
    .update(allowed);
}
