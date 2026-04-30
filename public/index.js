// Public profile page logic

(function() {
  initializeFirebase();

  var nameEl = document.getElementById('profile-name');
  var bioEl = document.getElementById('profile-bio');
  var linksEl = document.getElementById('links-list');
  var loadingEl = document.getElementById('loading');

  // The owner's userId — set this to the UID of the registered account
  var OWNER_UID = window.OWNER_UID || 'REPLACE_WITH_OWNER_UID';

  function renderProfile(profile) {
    nameEl.textContent = profile.name || '';
    bioEl.textContent = profile.bio || '';
  }

  function renderLinks(links) {
    linksEl.innerHTML = '';
    var visibleLinks = links.filter(function(link) {
      return link.visible;
    });

    visibleLinks.forEach(function(link) {
      var a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-item';
      a.textContent = escapeHtml(link.title);

      a.addEventListener('click', function() {
        trackLinkClick(link.title, link.url);
      });

      linksEl.appendChild(a);
    });
  }

  Promise.all([
    getProfile(OWNER_UID),
    getLinks(OWNER_UID),
  ]).then(function(results) {
    if (loadingEl) loadingEl.style.display = 'none';
    renderProfile(results[0]);
    renderLinks(results[1]);
  }).catch(function(err) {
    if (loadingEl) loadingEl.style.display = 'none';
    console.error('Failed to load profile:', err);
  });
})();
