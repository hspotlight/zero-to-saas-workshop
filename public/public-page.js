// Public profile page logic
// Reads the username slug from the URL path and renders the creator's profile

document.addEventListener('DOMContentLoaded', async () => {
  initializeFirebase();

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('u') || window.location.pathname.replace(/^\//, '').split('/')[0];

  if (!slug || slug === 'profile.html') {
    showNotFound();
    return;
  }

  try {
    const result = await getPublicProfile(slug);
    if (!result) {
      showNotFound();
      return;
    }
    const { profile, links } = result;
    renderProfile(profile, links, result.profile.userId);
  } catch (err) {
    showNotFound();
  }
});

function renderProfile(profile, links, userId) {
  document.title = `${escapeHtml(profile.displayName || profile.username)} — Link in Bio`;

  const photoEl = document.getElementById('profile-photo');
  if (profile.photoURL) {
    photoEl.src = profile.photoURL;
    photoEl.style.display = 'block';
  }

  document.getElementById('profile-display-name').textContent = profile.displayName || profile.username;
  document.getElementById('profile-bio').textContent = profile.bio || '';

  const list = document.getElementById('links-list');
  if (links.length === 0) {
    list.innerHTML = '<p class="empty-state">No links yet.</p>';
    return;
  }

  list.innerHTML = links.map(link => `
    <a class="link-card"
       href="${escapeHtml(link.url)}"
       target="_blank"
       rel="noopener noreferrer"
       data-link-id="${escapeHtml(link.id)}"
       data-user-id="${escapeHtml(userId)}">
      <span class="link-icon">
        ${isUrl(link.icon)
          ? `<img src="${escapeHtml(link.icon)}" alt="" />`
          : escapeHtml(link.icon || '🔗')}
      </span>
      <span class="link-title">${escapeHtml(link.title)}</span>
    </a>
  `).join('');

  // Record profile view
  recordProfileView(userId).catch(() => {});

  // Record link clicks
  list.querySelectorAll('.link-card').forEach(card => {
    card.addEventListener('click', () => {
      const linkId = card.dataset.linkId;
      const uid = card.dataset.userId;
      recordLinkClick(uid, linkId).catch(() => {});
    });
  });
}

function showNotFound() {
  document.getElementById('profile-container').style.display = 'none';
  document.getElementById('not-found').style.display = 'block';
  document.title = 'Profile not found';
}

function isUrl(str) {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
}
