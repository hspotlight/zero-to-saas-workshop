// Public profile module
// Fetches a creator's profile + enabled links by username slug (no auth required)

async function getPublicProfile(slug) {
  const lower = slug.toLowerCase();

  // Resolve slug → userId
  const usernameDoc = await db.collection('usernames').doc(lower).get();
  if (!usernameDoc.exists) return null;
  const { userId } = usernameDoc.data();

  // Fetch profile and enabled links in parallel
  const [profileDoc, linksSnapshot] = await Promise.all([
    db.collection('users').doc(userId).collection('profile').doc('data').get(),
    db.collection('users').doc(userId).collection('links')
      .where('enabled', '==', true)
      .orderBy('order', 'asc')
      .get(),
  ]);

  if (!profileDoc.exists) return null;

  const profile = { userId, ...profileDoc.data() };
  const links = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { profile, links };
}
