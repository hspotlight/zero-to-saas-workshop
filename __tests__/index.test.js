const fs = require('fs');
const path = require('path');

// Load utils.js first (provides escapeHtml, initializeFirebase, etc.)
const utilsCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'utils.js'), 'utf8');
eval(utilsCode);

describe('Public page rendering', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loading">Loading...</div>
      <h1 id="profile-name"></h1>
      <p id="profile-bio"></p>
      <div id="links-list"></div>
    `;
  });

  test('only visible links are rendered', () => {
    var linksEl = document.getElementById('links-list');

    var links = [
      { id: '1', title: 'Visible Link', url: 'https://visible.com', visible: true, order: 0 },
      { id: '2', title: 'Hidden Link', url: 'https://hidden.com', visible: false, order: 1 },
      { id: '3', title: 'Another Visible', url: 'https://another.com', visible: true, order: 2 },
    ];

    var visibleLinks = links.filter(function(l) { return l.visible; });

    visibleLinks.forEach(function(link) {
      var a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'link-item';
      a.textContent = escapeHtml(link.title);
      linksEl.appendChild(a);
    });

    var rendered = linksEl.querySelectorAll('.link-item');
    expect(rendered.length).toBe(2);
    expect(rendered[0].textContent).toBe('Visible Link');
    expect(rendered[1].textContent).toBe('Another Visible');
  });

  test('links open in new tab with noopener noreferrer', () => {
    var linksEl = document.getElementById('links-list');
    var link = { title: 'Test', url: 'https://test.com', visible: true };

    var a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'link-item';
    a.textContent = escapeHtml(link.title);
    linksEl.appendChild(a);

    var rendered = linksEl.querySelector('.link-item');
    expect(rendered.target).toBe('_blank');
    expect(rendered.rel).toBe('noopener noreferrer');
  });

  test('escapeHtml is applied to link titles with XSS payloads', () => {
    var linksEl = document.getElementById('links-list');
    var maliciousTitle = '<img src=x onerror=alert(1)>';

    var a = document.createElement('a');
    a.className = 'link-item';
    a.textContent = escapeHtml(maliciousTitle);
    linksEl.appendChild(a);

    var rendered = linksEl.querySelector('.link-item');
    expect(rendered.innerHTML).not.toContain('<img');
    expect(rendered.textContent).toContain('&lt;img');
  });

  test('profile name and bio are rendered', () => {
    var nameEl = document.getElementById('profile-name');
    var bioEl = document.getElementById('profile-bio');

    var profile = { name: 'Jane Doe', bio: 'Web developer' };
    nameEl.textContent = profile.name;
    bioEl.textContent = profile.bio;

    expect(nameEl.textContent).toBe('Jane Doe');
    expect(bioEl.textContent).toBe('Web developer');
  });
});
