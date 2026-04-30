// Global Firebase mock for Jest
// All tests use this mock — no real Firebase calls are made

const mockIncrement = jest.fn((n) => ({ _type: 'increment', n }));
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
};
const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
};

global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
  })),
  firestore: Object.assign(
    jest.fn(() => ({
      collection: jest.fn(() => collectionRef()),
      batch: jest.fn(() => mockBatch),
      runTransaction: jest.fn(async (fn) => fn(mockTransaction)),
    })),
    {
      FieldValue: {
        increment: mockIncrement,
        serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
      },
    }
  ),
};

// Chainable collection/doc mock factory
function collectionRef() {
  const ref = {
    doc: jest.fn(() => docRef()),
    add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
    where: jest.fn(() => ref),
    orderBy: jest.fn(() => ref),
    get: jest.fn().mockResolvedValue({ docs: [] }),
  };
  return ref;
}

function docRef() {
  return {
    collection: jest.fn(() => collectionRef()),
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: jest.fn().mockResolvedValue(),
    update: jest.fn().mockResolvedValue(),
    delete: jest.fn().mockResolvedValue(),
    id: 'mock-doc-id',
  };
}

// Make mockBatch and mockTransaction accessible in tests
global._mockBatch = mockBatch;
global._mockTransaction = mockTransaction;
