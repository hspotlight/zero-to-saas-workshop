// Links module
// CRUD + reorder for a creator's links

async function getLinks(userId) {
  const snapshot = await db
    .collection('users').doc(userId)
    .collection('links')
    .orderBy('order', 'asc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addLink(userId, data) {
  const title = (data.title || '').trim();
  const url = (data.url || '').trim();
  if (!title) throw new Error('Link title is required.');
  if (!url) throw new Error('Link URL is required.');

  // Determine next order value
  const existing = await getLinks(userId);
  const order = existing.length;

  const docRef = await db
    .collection('users').doc(userId)
    .collection('links')
    .add({
      title,
      url,
      icon: (data.icon || '').trim(),
      enabled: true,
      order,
      clickCount: 0,
      createdAt: new Date(),
    });
  return { id: docRef.id, title, url, icon: data.icon || '', enabled: true, order, clickCount: 0 };
}

async function updateLink(userId, linkId, data) {
  const updates = {};
  if (typeof data.title === 'string') updates.title = data.title.trim();
  if (typeof data.url === 'string') updates.url = data.url.trim();
  if (typeof data.icon === 'string') updates.icon = data.icon.trim();
  if (typeof data.enabled === 'boolean') updates.enabled = data.enabled;
  if (Object.keys(updates).length === 0) return;
  await db
    .collection('users').doc(userId)
    .collection('links').doc(linkId)
    .update(updates);
}

async function deleteLink(userId, linkId) {
  await db
    .collection('users').doc(userId)
    .collection('links').doc(linkId)
    .delete();
}

// Accepts an ordered array of link IDs and batch-writes updated `order` values.
async function reorderLinks(userId, orderedIds) {
  const batch = db.batch();
  orderedIds.forEach((linkId, index) => {
    const ref = db
      .collection('users').doc(userId)
      .collection('links').doc(linkId);
    batch.update(ref, { order: index });
  });
  await batch.commit();
}
