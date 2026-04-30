// Admin page logic — protected by auth

(function() {
  initializeFirebase();

  var currentUser = null;
  var allLinks = [];

  // DOM elements
  var userEmailEl = document.getElementById('user-email');
  var logoutBtn = document.getElementById('logout-btn');
  var profileNameInput = document.getElementById('profile-name-input');
  var profileBioInput = document.getElementById('profile-bio-input');
  var profileForm = document.getElementById('profile-form');
  var profileMsg = document.getElementById('profile-msg');
  var addForm = document.getElementById('add-link-form');
  var addTitleInput = document.getElementById('add-title');
  var addUrlInput = document.getElementById('add-url');
  var linksList = document.getElementById('admin-links-list');
  var addError = document.getElementById('add-error');
  var editModal = document.getElementById('edit-modal');
  var editForm = document.getElementById('edit-form');
  var editTitleInput = document.getElementById('edit-title');
  var editUrlInput = document.getElementById('edit-url');
  var editIdInput = document.getElementById('edit-id');
  var editError = document.getElementById('edit-error');
  var cancelEditBtn = document.getElementById('cancel-edit');
  var previewBtn = document.getElementById('preview-btn');
  var previewPanel = document.getElementById('preview-panel');

  // Auth guard
  onAuthStateChanged(function(user) {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    currentUser = user;
    userEmailEl.textContent = user.email;
    loadProfile();
    loadLinks();
  });

  // Logout
  logoutBtn.addEventListener('click', function() {
    signOut().then(function() {
      window.location.href = '/login';
    });
  });

  // --- Profile ---

  function loadProfile() {
    getProfile(currentUser.uid).then(function(profile) {
      profileNameInput.value = profile.name || '';
      profileBioInput.value = profile.bio || '';
    });
  }

  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    profileMsg.textContent = '';

    var name = profileNameInput.value.trim();
    var bio = profileBioInput.value.trim();

    if (!name) {
      profileMsg.textContent = 'Name is required.';
      return;
    }
    if (name.length > 100) {
      profileMsg.textContent = 'Name must be 100 characters or fewer.';
      return;
    }
    if (bio.length > 300) {
      profileMsg.textContent = 'Bio must be 300 characters or fewer.';
      return;
    }

    updateProfile(currentUser.uid, name, bio).then(function() {
      profileMsg.textContent = 'Profile saved.';
      setTimeout(function() { profileMsg.textContent = ''; }, 2000);
    }).catch(function(err) {
      profileMsg.textContent = err.message;
    });
  });

  // --- Links CRUD ---

  function loadLinks() {
    getLinks(currentUser.uid).then(function(links) {
      allLinks = links;
      renderAdminLinks();
    });
  }

  function renderAdminLinks() {
    linksList.innerHTML = '';

    allLinks.forEach(function(link, index) {
      var li = document.createElement('li');
      li.className = 'admin-link-item' + (link.visible ? '' : ' hidden-link');
      li.draggable = true;
      li.dataset.id = link.id;
      li.dataset.index = index;

      li.innerHTML =
        '<span class="link-drag-handle">&#9776;</span>' +
        '<span class="link-title">' + escapeHtml(link.title) + '</span>' +
        '<span class="link-url">' + escapeHtml(link.url) + '</span>' +
        '<div class="link-actions">' +
          '<button class="toggle-btn" data-id="' + link.id + '" data-visible="' + link.visible + '">' +
            (link.visible ? 'Hide' : 'Show') +
          '</button>' +
          '<button class="edit-btn" data-id="' + link.id + '">Edit</button>' +
          '<button class="delete-btn" data-id="' + link.id + '">Delete</button>' +
        '</div>';

      // Drag events
      li.addEventListener('dragstart', handleDragStart);
      li.addEventListener('dragover', handleDragOver);
      li.addEventListener('drop', handleDrop);
      li.addEventListener('dragend', handleDragEnd);

      linksList.appendChild(li);
    });

    // Event delegation for buttons
    linksList.querySelectorAll('.toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        var currentlyVisible = btn.dataset.visible === 'true';
        setLinkVisibility(currentUser.uid, id, !currentlyVisible).then(loadLinks);
      });
    });

    linksList.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        var link = allLinks.find(function(l) { return l.id === id; });
        if (link) openEditModal(link);
      });
    });

    linksList.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.dataset.id;
        if (confirm('Delete this link?')) {
          deleteLink(currentUser.uid, id).then(loadLinks);
        }
      });
    });
  }

  // --- Add link ---

  addForm.addEventListener('submit', function(e) {
    e.preventDefault();
    addError.textContent = '';

    var title = addTitleInput.value.trim();
    var url = addUrlInput.value.trim();

    if (!title) { addError.textContent = 'Title is required.'; return; }
    if (title.length > 100) { addError.textContent = 'Title must be 100 characters or fewer.'; return; }
    if (!url) { addError.textContent = 'URL is required.'; return; }
    if (!url.startsWith('https://')) { addError.textContent = 'URL must start with https://'; return; }
    if (url.length > 500) { addError.textContent = 'URL must be 500 characters or fewer.'; return; }

    addLink(currentUser.uid, title, url)
      .then(function() {
        addTitleInput.value = '';
        addUrlInput.value = '';
        loadLinks();
      })
      .catch(function(err) {
        addError.textContent = err.message;
      });
  });

  // --- Edit modal ---

  function openEditModal(link) {
    editIdInput.value = link.id;
    editTitleInput.value = link.title;
    editUrlInput.value = link.url;
    editError.textContent = '';
    editModal.style.display = 'flex';
  }

  cancelEditBtn.addEventListener('click', function() {
    editModal.style.display = 'none';
  });

  editForm.addEventListener('submit', function(e) {
    e.preventDefault();
    editError.textContent = '';

    var id = editIdInput.value;
    var title = editTitleInput.value.trim();
    var url = editUrlInput.value.trim();

    if (!title) { editError.textContent = 'Title is required.'; return; }
    if (title.length > 100) { editError.textContent = 'Title must be 100 characters or fewer.'; return; }
    if (!url) { editError.textContent = 'URL is required.'; return; }
    if (!url.startsWith('https://')) { editError.textContent = 'URL must start with https://'; return; }
    if (url.length > 500) { editError.textContent = 'URL must be 500 characters or fewer.'; return; }

    updateLink(currentUser.uid, id, { title: title, url: url })
      .then(function() {
        editModal.style.display = 'none';
        loadLinks();
      })
      .catch(function(err) {
        editError.textContent = err.message;
      });
  });

  // --- Drag and drop reorder ---

  var dragSrcIndex = null;

  function handleDragStart(e) {
    dragSrcIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e) {
    e.preventDefault();
    var dropIndex = parseInt(this.dataset.index);
    if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

    // Reorder in memory
    var moved = allLinks.splice(dragSrcIndex, 1)[0];
    allLinks.splice(dropIndex, 0, moved);

    var orderedIds = allLinks.map(function(l) { return l.id; });
    reorderLinks(currentUser.uid, orderedIds).then(loadLinks);
  }

  function handleDragEnd() {
    dragSrcIndex = null;
    document.querySelectorAll('.admin-link-item').forEach(function(el) {
      el.classList.remove('dragging');
    });
  }

  // --- Preview ---

  previewBtn.addEventListener('click', function() {
    if (previewPanel.style.display === 'block') {
      previewPanel.style.display = 'none';
      previewBtn.textContent = 'Preview';
      return;
    }

    var previewName = document.getElementById('preview-name');
    var previewBio = document.getElementById('preview-bio');
    var previewLinks = document.getElementById('preview-links');

    previewName.textContent = profileNameInput.value.trim();
    previewBio.textContent = profileBioInput.value.trim();
    previewLinks.innerHTML = '';

    allLinks.filter(function(l) { return l.visible; }).forEach(function(link) {
      var a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-item';
      a.textContent = escapeHtml(link.title);
      previewLinks.appendChild(a);
    });

    previewPanel.style.display = 'block';
    previewBtn.textContent = 'Close Preview';
  });
})();
