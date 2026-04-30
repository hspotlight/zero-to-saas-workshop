const fs = require('fs');
const path = require('path');

// Load utils.js into jsdom
const utilsCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'utils.js'), 'utf8');
eval(utilsCode);

describe('escapeHtml', () => {
  test('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('does not escape quotes (safe inside text nodes)', () => {
    expect(escapeHtml('"hello"')).toBe('"hello"');
  });

  test('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('passes through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('initializeFirebase', () => {
  test('calls firebase.initializeApp with window config', () => {
    initializeFirebase();
    expect(firebase.initializeApp).toHaveBeenCalledWith(window.firebaseConfig);
  });

  test('sets auth and db globals', () => {
    initializeFirebase();
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
  });
});

describe('signIn', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('calls signInWithEmailAndPassword with email and password', () => {
    signIn('test@example.com', 'password123');
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});

describe('signOut', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('calls auth.signOut', () => {
    signOut();
    expect(auth.signOut).toHaveBeenCalled();
  });
});

describe('trackLinkClick', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('calls logEvent with link_click event and parameters', () => {
    trackLinkClick('My Blog', 'https://example.com');
    const analyticsInstance = firebase.analytics();
    expect(analyticsInstance.logEvent).toHaveBeenCalledWith('link_click', {
      link_title: 'My Blog',
      link_url: 'https://example.com',
    });
  });
});

describe('addLink validation', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('throws if title is empty', () => {
    expect(() => addLink('uid', '', 'https://example.com')).toThrow('Title is required');
  });

  test('throws if title is whitespace only', () => {
    expect(() => addLink('uid', '   ', 'https://example.com')).toThrow('Title is required');
  });

  test('throws if url does not start with https://', () => {
    expect(() => addLink('uid', 'Test', 'http://example.com')).toThrow('URL must start with https://');
  });
});

describe('updateLink validation', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('throws if title is empty string', () => {
    expect(() => updateLink('uid', 'link1', { title: '' })).toThrow('Title is required');
  });

  test('throws if url does not start with https://', () => {
    expect(() => updateLink('uid', 'link1', { url: 'http://bad.com' })).toThrow('URL must start with https://');
  });
});

describe('reorderLinks', () => {
  beforeEach(() => {
    initializeFirebase();
  });

  test('batch updates each link with its new order index', async () => {
    const { mockBatch } = global.__mocks__;
    mockBatch.update.mockClear();
    mockBatch.commit.mockClear();

    await reorderLinks('uid', ['id-a', 'id-b', 'id-c']);

    expect(mockBatch.update).toHaveBeenCalledTimes(3);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});
