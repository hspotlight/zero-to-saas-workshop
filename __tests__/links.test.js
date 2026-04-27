// Tests for the links module

const fs = require('fs');
const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../public/links.js'), 'utf8'));

const USER_ID = 'test-user-123';

describe('addLink', () => {
  let mockAdd;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd = jest.fn().mockResolvedValue({ id: 'new-link-id' });
    const mockLinksCollection = {
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] }),
      add: mockAdd,
    };
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue(mockLinksCollection),
        }),
      }),
    };
  });

  test('creates a link with required fields', async () => {
    const link = await addLink(USER_ID, { title: 'My Blog', url: 'https://blog.com' });
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My Blog',
      url: 'https://blog.com',
      enabled: true,
      clickCount: 0,
    }));
    expect(link.id).toBe('new-link-id');
  });

  test('assigns order equal to the current number of links', async () => {
    // Simulate 2 existing links
    const mockLinksCollection = {
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          { id: 'a', data: () => ({ order: 0 }) },
          { id: 'b', data: () => ({ order: 1 }) },
        ],
      }),
      add: mockAdd,
    };
    global.db.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockLinksCollection),
      }),
    });
    await addLink(USER_ID, { title: 'Third', url: 'https://third.com' });
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ order: 2 }));
  });

  test('throws if title is missing', async () => {
    await expect(addLink(USER_ID, { title: '', url: 'https://a.com' }))
      .rejects.toThrow('title is required');
  });

  test('throws if URL is missing', async () => {
    await expect(addLink(USER_ID, { title: 'A', url: '' }))
      .rejects.toThrow('URL is required');
  });

  test('trims whitespace from title and url', async () => {
    await addLink(USER_ID, { title: '  Blog  ', url: '  https://blog.com  ' });
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Blog',
      url: 'https://blog.com',
    }));
  });
});

describe('reorderLinks', () => {
  let mockBatch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch = {
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(),
    };
    const mockDocRef = jest.fn().mockReturnValue({ id: 'doc' });
    global.db = {
      batch: jest.fn().mockReturnValue(mockBatch),
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({ doc: mockDocRef }),
        }),
      }),
    };
  });

  test('calls batch.update for each link with its new index as order', async () => {
    await reorderLinks(USER_ID, ['link-c', 'link-a', 'link-b']);
    expect(mockBatch.update).toHaveBeenCalledTimes(3);
    // Each call sets order to its position in the array
    expect(mockBatch.update).toHaveBeenNthCalledWith(1, expect.anything(), { order: 0 });
    expect(mockBatch.update).toHaveBeenNthCalledWith(2, expect.anything(), { order: 1 });
    expect(mockBatch.update).toHaveBeenNthCalledWith(3, expect.anything(), { order: 2 });
  });

  test('commits the batch', async () => {
    await reorderLinks(USER_ID, ['a', 'b']);
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});

describe('deleteLink', () => {
  test('calls delete on the correct document', async () => {
    const mockDelete = jest.fn().mockResolvedValue();
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue({ delete: mockDelete }),
          }),
        }),
      }),
    };
    await deleteLink(USER_ID, 'link-xyz');
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe('getLinks', () => {
  test('returns links sorted by order from Firestore', async () => {
    const mockDocs = [
      { id: 'link-1', data: () => ({ title: 'First', order: 0, enabled: true }) },
      { id: 'link-2', data: () => ({ title: 'Second', order: 1, enabled: true }) },
    ];
    global.db = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ docs: mockDocs }),
          }),
        }),
      }),
    };
    const links = await getLinks(USER_ID);
    expect(links).toHaveLength(2);
    expect(links[0].id).toBe('link-1');
    expect(links[0].title).toBe('First');
  });
});
