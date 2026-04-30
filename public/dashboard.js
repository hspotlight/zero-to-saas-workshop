// Dashboard page logic
// Manages links, profile settings, and displays analytics

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    currentUser = user;
    document.getElementById('user-email').textContent = escapeHtml(user.email);
    await Promise.all([loadProfile(), loadLinks(), loadAnalytics()]);
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await logout();
    window.location.href = '/login.html';
  });

  document.getElementById('profile-form').addEventListener('submit', handleProfileSave);
  document.getElementById('add-link-form').addEventListener('submit', handleAddLink);
});

// ---- Profile ----

async function loadProfile() {
  const data = await getProfile(currentUser.uid);
  if (!data) return;
  document.getElementById('profile-username').value = data.username || '';
  document.getElementById('profile-display-name').value = data.displayName || '';
  document.getElementById('profile-bio').value = data.bio || '';
  document.getElementById('profile-photo-url').value = data.photoURL || '';
  const slug = data.username || '';
  const profileLink = document.getElementById('profile-link');
  profileLink.href = `/profile.html?u=${encodeURIComponent(slug)}`;
  profileLink.textContent = `/${slug}`;
}

async function handleProfileSave(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await updateProfile(currentUser.uid, {
      displayName: document.getElementById('profile-display-name').value,
      bio: document.getElementById('profile-bio').value,
      photoURL: document.getElementById('profile-photo-url').value,
    });
    btn.textContent = 'Saved!';
    setTimeout(() => { btn.textContent = 'Save Profile'; btn.disabled = false; }, 1500);
  } catch (err) {
    showError('profile-error', err.message);
    btn.disabled = false;
  }
}

// ---- Links ----

let linksData = [];

async function loadLinks() {
  linksData = await getLinks(currentUser.uid);
  renderLinks();
}

function renderLinks() {
  const stats = window._stats || {};
  const list = document.getElementById('links-list');
  if (linksData.length === 0) {
    list.innerHTML = '<p class="empty-state">No links yet. Add your first link below.</p>';
    return;
  }
  list.innerHTML = linksData.map((link, index) => `
    <div class="link-item ${link.enabled ? '' : 'disabled'}"
         data-id="${escapeHtml(link.id)}"
         data-index="${index}"
         draggable="true">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="link-icon">${isUrl(link.icon)
        ? `<img src="${escapeHtml(link.icon)}" alt="" />`
        : `<span>${escapeHtml(link.icon || '🔗')}</span>`}
      </div>
      <div class="link-info">
        <strong>${escapeHtml(link.title)}</strong>
        <small>${escapeHtml(link.url)}</small>
      </div>
      <div class="link-clicks" title="Total clicks">
        ${stats.linkClicks ? (stats.linkClicks[link.id] || 0) : link.clickCount} clicks
      </div>
      <div class="link-actions">
        <button class="btn-icon" onclick="toggleLink('${escapeHtml(link.id)}', ${!link.enabled})"
                title="${link.enabled ? 'Disable' : 'Enable'}">
          ${link.enabled ? '👁' : '🙈'}
        </button>
        <button class="btn-icon" onclick="openEditLink('${escapeHtml(link.id)}')" title="Edit">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteLink_('${escapeHtml(link.id)}')" title="Delete">🗑</button>
      </div>
    </div>
  `).join('');

  attachDragHandlers();
}

async function handleAddLink(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await addLink(currentUser.uid, {
      title: document.getElementById('new-link-title').value,
      url: document.getElementById('new-link-url').value,
      icon: document.getElementById('new-link-icon').value,
    });
    e.target.reset();
    await loadLinks();
  } catch (err) {
    showError('links-error', err.message);
  } finally {
    btn.disabled = false;
  }
}

async function toggleLink(linkId, enabled) {
  try {
    await updateLink(currentUser.uid, linkId, { enabled });
    linksData = linksData.map(l => l.id === linkId ? { ...l, enabled } : l);
    renderLinks();
  } catch (err) {
    showError('links-error', err.message);
  }
}

async function deleteLink_(linkId) {
  if (!confirm('Delete this link?')) return;
  try {
    await deleteLink(currentUser.uid, linkId);
    linksData = linksData.filter(l => l.id !== linkId);
    renderLinks();
  } catch (err) {
    showError('links-error', err.message);
  }
}

function openEditLink(linkId) {
  const link = linksData.find(l => l.id === linkId);
  if (!link) return;
  const modal = document.getElementById('edit-modal');
  document.getElementById('edit-link-id').value = link.id;
  document.getElementById('edit-link-title').value = link.title;
  document.getElementById('edit-link-url').value = link.url;
  document.getElementById('edit-link-icon').value = link.icon || '';
  modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const linkId = document.getElementById('edit-link-id').value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await updateLink(currentUser.uid, linkId, {
        title: document.getElementById('edit-link-title').value,
        url: document.getElementById('edit-link-url').value,
        icon: document.getElementById('edit-link-icon').value,
      });
      document.getElementById('edit-modal').style.display = 'none';
      await loadLinks();
    } catch (err) {
      showError('links-error', err.message);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById('edit-cancel').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
  });
});

// ---- Drag-to-reorder ----

let dragSrcIndex = null;

function attachDragHandlers() {
  const items = document.querySelectorAll('.link-item');
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      dragSrcIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('drop', async (e) => {
      e.preventDefault();
      const destIndex = parseInt(item.dataset.index);
      if (dragSrcIndex === null || dragSrcIndex === destIndex) return;

      // Reorder local array
      const moved = linksData.splice(dragSrcIndex, 1)[0];
      linksData.splice(destIndex, 0, moved);
      dragSrcIndex = null;
      renderLinks();

      try {
        await reorderLinks(currentUser.uid, linksData.map(l => l.id));
      } catch (err) {
        showError('links-error', 'Failed to save order. Please try again.');
        await loadLinks();
      }
    });
  });
}

// ---- Analytics ----

async function loadAnalytics() {
  const stats = await getStats(currentUser.uid);
  window._stats = stats;
  document.getElementById('stat-profile-views').textContent = stats.profileViews.toLocaleString();
  const totalClicks = Object.values(stats.linkClicks).reduce((sum, n) => sum + n, 0);
  document.getElementById('stat-total-clicks').textContent = totalClicks.toLocaleString();
}

// ---- Helpers ----

function isUrl(str) {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
}
