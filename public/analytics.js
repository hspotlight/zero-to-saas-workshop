// Analytics module
// Records profile views and link clicks; reads aggregated stats

const TOTALS_DOC = 'totals';

async function recordProfileView(userId) {
  const ref = db
    .collection('users').doc(userId)
    .collection('analytics').doc(TOTALS_DOC);
  await ref.set(
    { profileViews: firebase.firestore.FieldValue.increment(1) },
    { merge: true }
  );
}

async function recordLinkClick(userId, linkId) {
  const totalsRef = db
    .collection('users').doc(userId)
    .collection('analytics').doc(TOTALS_DOC);
  const linkRef = db
    .collection('users').doc(userId)
    .collection('links').doc(linkId);

  const batch = db.batch();
  batch.set(
    totalsRef,
    { linkClicks: { [linkId]: firebase.firestore.FieldValue.increment(1) } },
    { merge: true }
  );
  batch.update(linkRef, { clickCount: firebase.firestore.FieldValue.increment(1) });
  await batch.commit();
}

async function getStats(userId) {
  const doc = await db
    .collection('users').doc(userId)
    .collection('analytics').doc(TOTALS_DOC)
    .get();
  if (!doc.exists) return { profileViews: 0, linkClicks: {} };
  const data = doc.data();
  return {
    profileViews: data.profileViews || 0,
    linkClicks: data.linkClicks || {},
  };
}
