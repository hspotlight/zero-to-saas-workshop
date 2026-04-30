// Username module
// Handles slug validation, availability checks, and atomic reservation

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_REGEX = /^[a-z0-9-]+$/;

function validateFormat(slug) {
  if (typeof slug !== 'string') return { valid: false, error: 'Username must be a string.' };
  const lower = slug.toLowerCase();
  if (lower.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.` };
  }
  if (lower.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters.` };
  }
  if (!USERNAME_REGEX.test(lower)) {
    return { valid: false, error: 'Username may only contain lowercase letters, numbers, and hyphens.' };
  }
  if (lower.startsWith('-') || lower.endsWith('-')) {
    return { valid: false, error: 'Username cannot start or end with a hyphen.' };
  }
  return { valid: true, error: null };
}

async function isAvailable(slug) {
  const lower = slug.toLowerCase();
  const doc = await db.collection('usernames').doc(lower).get();
  return !doc.exists;
}

// Atomically reserves a username and creates the user's profile document.
// Throws if the username is already taken.
async function reserveUsername(userId, slug, profileData) {
  const lower = slug.toLowerCase();
  const usernameRef = db.collection('usernames').doc(lower);
  const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists) {
      throw new Error('Username is already taken.');
    }
    tx.set(usernameRef, { userId });
    tx.set(profileRef, {
      displayName: profileData.displayName || '',
      bio: '',
      photoURL: '',
      username: lower,
      createdAt: new Date(),
    });
  });
}
