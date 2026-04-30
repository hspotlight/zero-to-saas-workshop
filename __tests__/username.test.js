// Tests for the username module
// These test validateFormat (pure), isAvailable (Firestore read), and reserveUsername (transaction)

// Load the module under test
const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../public/username.js'), 'utf8'));

describe('validateFormat', () => {
  test('accepts valid lowercase slugs', () => {
    expect(validateFormat('alice').valid).toBe(true);
    expect(validateFormat('my-handle').valid).toBe(true);
    expect(validateFormat('user123').valid).toBe(true);
  });

  test('rejects slugs shorter than 3 characters', () => {
    const result = validateFormat('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least 3/);
  });

  test('rejects slugs longer than 30 characters', () => {
    const result = validateFormat('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at most 30/);
  });

  test('rejects slugs with uppercase letters', () => {
    const result = validateFormat('Alice');
    expect(result.valid).toBe(false);
  });

  test('rejects slugs with spaces', () => {
    const result = validateFormat('my handle');
    expect(result.valid).toBe(false);
  });

  test('rejects slugs with special characters', () => {
    expect(validateFormat('my_handle').valid).toBe(false);
    expect(validateFormat('my@handle').valid).toBe(false);
  });

  test('rejects slugs starting or ending with a hyphen', () => {
    expect(validateFormat('-myhandle').valid).toBe(false);
    expect(validateFormat('myhandle-').valid).toBe(false);
  });

  test('accepts slugs at exactly min and max length', () => {
    expect(validateFormat('abc').valid).toBe(true);
    expect(validateFormat('a'.repeat(30)).valid).toBe(true);
  });

  test('rejects non-string input', () => {
    expect(validateFormat(null).valid).toBe(false);
    expect(validateFormat(123).valid).toBe(false);
  });
});

describe('isAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up db mock
    global.db = firebase.firestore();
  });

  test('returns true when the username doc does not exist', async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      }),
    });
    const result = await isAvailable('newuser');
    expect(result).toBe(true);
  });

  test('returns false when the username doc exists', async () => {
    db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: true }),
      }),
    });
    const result = await isAvailable('takenuser');
    expect(result).toBe(false);
  });

  test('queries the usernames collection with lowercase slug', async () => {
    const mockDoc = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ exists: false }),
    });
    db.collection.mockReturnValue({ doc: mockDoc });
    await isAvailable('Alice');
    expect(db.collection).toHaveBeenCalledWith('usernames');
    expect(mockDoc).toHaveBeenCalledWith('alice');
  });
});

describe('reserveUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.db = firebase.firestore();
  });

  test('throws if the username is already taken', async () => {
    _mockTransaction.get.mockResolvedValue({ exists: true });
    await expect(reserveUsername('user-1', 'taken', { displayName: 'Test' }))
      .rejects.toThrow('already taken');
  });

  test('writes usernames/{slug} and users/{userId}/profile/data in a transaction', async () => {
    _mockTransaction.get.mockResolvedValue({ exists: false });
    await reserveUsername('user-1', 'newslug', { displayName: 'Test User' });
    expect(_mockTransaction.set).toHaveBeenCalledTimes(2);
  });

  test('stores the slug in lowercase', async () => {
    _mockTransaction.get.mockResolvedValue({ exists: false });
    const mockDoc = jest.fn().mockReturnValue({ id: 'mock' });
    db.collection.mockReturnValue({ doc: mockDoc });
    await reserveUsername('user-1', 'UPPERCASE', { displayName: 'Test' }).catch(() => {});
    expect(mockDoc).toHaveBeenCalledWith('uppercase');
  });
});
