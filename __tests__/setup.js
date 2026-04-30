// Global Firebase mock for Jest

const mockDoc = {
  exists: true,
  data: jest.fn(() => ({})),
  id: 'mock-doc-id',
};

const mockSnapshot = {
  docs: [],
  empty: true,
};

const mockDocRef = {
  get: jest.fn(() => Promise.resolve(mockDoc)),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => mockCollectionRef),
  id: 'mock-doc-id',
};

const mockCollectionRef = {
  doc: jest.fn(() => mockDocRef),
  add: jest.fn(() => Promise.resolve(mockDocRef)),
  get: jest.fn(() => Promise.resolve(mockSnapshot)),
  orderBy: jest.fn(function() { return this; }),
  where: jest.fn(function() { return this; }),
};

const mockBatch = {
  update: jest.fn(),
  commit: jest.fn(() => Promise.resolve()),
};

const mockAuthInstance = {
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com' } })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@test.com' } })),
  signOut: jest.fn(() => Promise.resolve()),
  currentUser: null,
};

const mockFirestoreInstance = {
  collection: jest.fn(() => mockCollectionRef),
  batch: jest.fn(() => mockBatch),
};

const mockAnalyticsInstance = {
  logEvent: jest.fn(),
};

global.firebase = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => mockAuthInstance),
  firestore: Object.assign(
    jest.fn(() => mockFirestoreInstance),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
      },
    }
  ),
  analytics: jest.fn(() => mockAnalyticsInstance),
};

global.window.firebaseConfig = {
  apiKey: 'test-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test.firebasestorage.app',
  messagingSenderId: '123',
  appId: '1:123:web:abc',
  measurementId: 'G-TEST',
};

// Export mocks for test access
global.__mocks__ = {
  mockDoc,
  mockSnapshot,
  mockDocRef,
  mockCollectionRef,
  mockBatch,
  mockAuthInstance,
  mockFirestoreInstance,
  mockAnalyticsInstance,
};
