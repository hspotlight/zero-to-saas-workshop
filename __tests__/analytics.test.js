// Tests for the analytics module

const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../public/analytics.js'), 'utf8'));

const USER_ID = 'test-user-123';
const LINK_ID = 'link-abc';

describe('recordProfileView', () => {
  let mockSet;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSet = jest.fn().mockResolvedValue();
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({ set: mockSet }),
          }),
        }),
      }),
    };
    global.firebase = {
      firestore: { FieldValue: { increment: jest.fn((n) => ({ _type: 'increment', n })) } },
    };
  });

  test('increments profileViews by 1', async () => {
    await recordProfileView(USER_ID);
    expect(mockSet).toHaveBeenCalledWith(
      { profileViews: expect.objectContaining({ n: 1 }) },
      { merge: true }
    );
  });

  test('writes to the analytics/totals document', async () => {
    const mockDocFn = jest.fn().mockReturnValue({ set: mockSet });
    global.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({ doc: mockDocFn }),
      }),
    });
    await recordProfileView(USER_ID);
    expect(mockDocFn).toHaveBeenCalledWith('totals');
  });
});

describe('recordLinkClick', () => {
  let mockBatchSet, mockBatchUpdate, mockBatchCommit;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatchSet = jest.fn();
    mockBatchUpdate = jest.fn();
    mockBatchCommit = jest.fn().mockResolvedValue();
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({}),
          }),
        }),
      }),
      batch: jest.fn().mockReturnValue({
        set: mockBatchSet,
        update: mockBatchUpdate,
        commit: mockBatchCommit,
      }),
    };
    global.firebase = {
      firestore: { FieldValue: { increment: jest.fn((n) => ({ _type: 'increment', n })) } },
    };
  });

  test('increments analytics totals and link clickCount in a batch', async () => {
    await recordLinkClick(USER_ID, LINK_ID);
    expect(mockBatchCommit).toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ linkClicks: { [LINK_ID]: expect.objectContaining({ n: 1 }) } }),
      { merge: true }
    );
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { clickCount: expect.objectContaining({ n: 1 }) }
    );
  });
});

describe('getStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns zeros when the document does not exist', async () => {
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({ exists: false }),
            }),
          }),
        }),
      }),
    };
    const stats = await getStats(USER_ID);
    expect(stats).toEqual({ profileViews: 0, linkClicks: {} });
  });

  test('returns profileViews and linkClicks from Firestore', async () => {
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  profileViews: 42,
                  linkClicks: { 'link-1': 10, 'link-2': 5 },
                }),
              }),
            }),
          }),
        }),
      }),
    };
    const stats = await getStats(USER_ID);
    expect(stats.profileViews).toBe(42);
    expect(stats.linkClicks['link-1']).toBe(10);
  });

  test('defaults missing fields to zero', async () => {
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({}),
              }),
            }),
          }),
        }),
      }),
    };
    const stats = await getStats(USER_ID);
    expect(stats.profileViews).toBe(0);
    expect(stats.linkClicks).toEqual({});
  });
});
