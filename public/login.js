// Auth module + login page logic

// ---- Auth module ----

function onAuthChange(callback) {
  auth.onAuthStateChanged(callback);
}

async function register(email, password, username) {
  const validation = validateFormat(username);
  if (!validation.valid) throw new Error(validation.error);

  const available = await isAvailable(username);
  if (!available) throw new Error('That username is already taken. Please choose another.');

  const credential = await auth.createUserWithEmailAndPassword(email, password);
  const userId = credential.user.uid;

  await reserveUsername(userId, username, { displayName: username });
  return credential.user;
}

async function login(email, password) {
  const credential = await auth.signInWithEmailAndPassword(email, password);
  return credential.user;
}

async function logout() {
  await auth.signOut();
}

// ---- Login page UI ----

document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();

  // Only run login page UI when the login form is present
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const registerForm = document.getElementById('register-form');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');

  // Redirect to dashboard if already logged in
  onAuthChange((user) => {
    if (user) {
      window.location.href = '/dashboard.html';
    }
  });

  // Toggle between login and register
  showRegisterBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    hideError('login-error');
  });

  showLoginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
    hideError('register-error');
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await login(email, password);
    } catch (err) {
      showError('login-error', friendlyAuthError(err));
      btn.disabled = false;
    }
  });

  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const username = document.getElementById('register-username').value.trim().toLowerCase();
    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await register(email, password, username);
    } catch (err) {
      showError('register-error', friendlyAuthError(err));
      btn.disabled = false;
    }
  });

  // Live username availability check
  const usernameInput = document.getElementById('register-username');
  const usernameStatus = document.getElementById('username-status');
  let debounceTimer;
  usernameInput.addEventListener('input', () => {
    const slug = usernameInput.value.trim().toLowerCase();
    usernameStatus.textContent = '';
    clearTimeout(debounceTimer);
    const validation = validateFormat(slug);
    if (!validation.valid) {
      usernameStatus.textContent = validation.error;
      usernameStatus.className = 'status-error';
      return;
    }
    usernameStatus.textContent = 'Checking…';
    usernameStatus.className = '';
    debounceTimer = setTimeout(async () => {
      try {
        const available = await isAvailable(slug);
        if (available) {
          usernameStatus.textContent = `✓ ${slug} is available`;
          usernameStatus.className = 'status-ok';
        } else {
          usernameStatus.textContent = `✗ ${slug} is already taken`;
          usernameStatus.className = 'status-error';
        }
      } catch (err) {
        usernameStatus.textContent = 'Could not check availability. Please try again.';
        usernameStatus.className = 'status-error';
      }
    }, 400);
  });
});

function friendlyAuthError(err) {
  const code = err.code || '';
  if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }
  return err.message || 'Something went wrong. Please try again.';
}
