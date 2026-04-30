// Login page logic

(function() {
  initializeFirebase();

  var loginForm = document.getElementById('login-form');
  var emailInput = document.getElementById('login-email');
  var passwordInput = document.getElementById('login-password');
  var errorEl = document.getElementById('login-error');

  onAuthStateChanged(function(user) {
    if (user) {
      window.location.href = '/admin.html';
    }
  });

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    errorEl.textContent = '';

    var email = emailInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      errorEl.textContent = 'Email and password are required.';
      return;
    }

    signIn(email, password)
      .then(function() {
        window.location.href = '/admin.html';
      })
      .catch(function(err) {
        errorEl.textContent = err.message;
      });
  });
})();
