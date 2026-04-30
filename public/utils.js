// Firebase initialization and Firestore helpers

var auth;
var db;

function initializeFirebase() {
  firebase.initializeApp(window.firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// --- Auth helpers ---

function signIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function signOut() {
  return auth.signOut();
}

function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback);
}

// --- Profile helpers ---

function getProfile(userId) {
  return db.collection('users').doc(userId).collection('profile').doc('main').get()
    .then(function(doc) {
      if (!doc.exists) return { name: '', bio: '' };
      return doc.data();
    });
}

function updateProfile(userId, name, bio) {
  return db.collection('users').doc(userId).collection('profile').doc('main').set({
    name: name,
    bio: bio,
  });
}

// --- Links helpers ---

function getLinks(userId) {
  return db.collection('users').doc(userId).collection('links')
    .orderBy('order', 'asc')
    .get()
    .then(function(snapshot) {
      return snapshot.docs.map(function(doc) {
        return { id: doc.id, ...doc.data() };
      });
    });
}

function addLink(userId, title, url) {
  var trimmedTitle = title.trim();
  var trimmedUrl = url.trim();
  if (!trimmedTitle) throw new Error('Title is required');
  if (!trimmedUrl.startsWith('https://')) throw new Error('URL must start with https://');

  return getLinks(userId).then(function(links) {
    var nextOrder = links.length > 0 ? Math.max(...links.map(function(l) { return l.order; })) + 1 : 0;
    return db.collection('users').doc(userId).collection('links').add({
      title: trimmedTitle,
      url: trimmedUrl,
      visible: true,
      order: nextOrder,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
}

function updateLink(userId, linkId, data) {
  var updates = {};
  if (data.title !== undefined) {
    var trimmedTitle = data.title.trim();
    if (!trimmedTitle) throw new Error('Title is required');
    updates.title = trimmedTitle;
  }
  if (data.url !== undefined) {
    var trimmedUrl = data.url.trim();
    if (!trimmedUrl.startsWith('https://')) throw new Error('URL must start with https://');
    updates.url = trimmedUrl;
  }
  if (data.visible !== undefined) updates.visible = data.visible;
  if (data.order !== undefined) updates.order = data.order;

  return db.collection('users').doc(userId).collection('links').doc(linkId).update(updates);
}

function deleteLink(userId, linkId) {
  return db.collection('users').doc(userId).collection('links').doc(linkId).delete();
}

function setLinkVisibility(userId, linkId, visible) {
  return db.collection('users').doc(userId).collection('links').doc(linkId).update({
    visible: visible,
  });
}

function reorderLinks(userId, orderedIds) {
  var batch = db.batch();
  orderedIds.forEach(function(id, index) {
    var ref = db.collection('users').doc(userId).collection('links').doc(id);
    batch.update(ref, { order: index });
  });
  return batch.commit();
}

// --- Analytics helpers ---

function trackLinkClick(title, url) {
  if (typeof firebase.analytics === 'function') {
    firebase.analytics().logEvent('link_click', {
      link_title: title,
      link_url: url,
    });
  }
}
