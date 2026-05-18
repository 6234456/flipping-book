import { describe, it, expect, beforeEach } from 'vitest';
import { createCommentStore } from '../commentStore';

describe('commentStore', () => {
  let store: ReturnType<typeof createCommentStore>;

  beforeEach(() => {
    localStorage.clear();
    store = createCommentStore('test-book');
  });

  it('starts empty', () => {
    const threads = store.getAll();
    expect(threads).toHaveLength(0);
  });

  it('creates a thread', () => {
    const thread = store.createThread({
      bookId: 'test-book',
      pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 50, y: 30 },
      category: 'question',
      createdBy: 'user-1',
    });
    expect(thread.threadId).toBeDefined();
    expect(thread.status).toBe('open');
    expect(thread.messages).toHaveLength(0);
  });

  it('retrieves threads by page', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    store.createThread({
      bookId: 'test-book', pageId: 'page-2',
      anchor: { kind: 'imagePoint', pageId: 'page-2', imageAssetId: 'img-2', imageVersion: 'v1', x: 20, y: 20 },
      category: 'correction', createdBy: 'user-2',
    });
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 30, y: 40 },
      category: 'design', createdBy: 'user-1',
    });

    const page1Threads = store.getByPage('page-1');
    expect(page1Threads).toHaveLength(2);
    const page2Threads = store.getByPage('page-2');
    expect(page2Threads).toHaveLength(1);
  });

  it('adds a message to a thread', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });

    store.addMessage(thread.threadId, {
      authorId: 'user-2',
      body: [{ type: 'text', value: '这条法规不对' }],
    });

    const updated = store.get(thread.threadId);
    expect(updated).toBeDefined();
    expect(updated!.messages).toHaveLength(1);
    expect(updated!.messages[0].body[0]).toMatchObject({ type: 'text', value: '这条法规不对' });
  });

  it('resolves and reopens a thread', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'correction', createdBy: 'user-1',
    });

    store.resolve(thread.threadId);
    expect(store.get(thread.threadId)!.status).toBe('resolved');

    store.reopen(thread.threadId);
    expect(store.get(thread.threadId)!.status).toBe('open');
  });

  it('persists to localStorage', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });

    // Create a new store — should load from localStorage
    const store2 = createCommentStore('test-book');
    expect(store2.getAll()).toHaveLength(1);
    expect(store2.getAll()[0].pageId).toBe('page-1');
  });

  it('scopes storage by bookId', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });

    const store2 = createCommentStore('other-book');
    expect(store2.getAll()).toHaveLength(0);
  });

  it('exports comments as JSON', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });

    const json = store.exportJSON();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].pageId).toBe('page-1');
  });

  it('imports comments and skips duplicates', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    const exported = store.exportJSON();

    const store2 = createCommentStore('test-book');
    const result = store2.importJSON(exported);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
    expect(store2.getAll()).toHaveLength(1);
  });

  it('imports new comments', () => {
    store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    const json = store.exportJSON();

    // Clear and re-import
    localStorage.clear();
    const store2 = createCommentStore('test-book');
    expect(store2.getAll()).toHaveLength(0);

    const result = store2.importJSON(json);
    expect(result.imported).toBe(1);
    expect(store2.getAll()).toHaveLength(1);
  });

  it('handles invalid JSON gracefully', () => {
    const result = store.importJSON('not-valid-json');
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it('deletes a thread', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    expect(store.getAll()).toHaveLength(1);
    store.deleteThread(thread.threadId);
    expect(store.getAll()).toHaveLength(0);
  });

  it('deleteThread returns false for unknown thread', () => {
    expect(store.deleteThread('nonexistent')).toBe(false);
  });

  it('edits a message body', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    store.addMessage(thread.threadId, {
      authorId: 'user-2',
      body: [{ type: 'text', value: '原始内容' }],
    });
    const msgId = store.get(thread.threadId)!.messages[0].messageId;

    const ok = store.editMessage(thread.threadId, msgId, [{ type: 'text', value: '修改后' }]);
    expect(ok).toBe(true);
    expect(store.get(thread.threadId)!.messages[0].body[0]).toMatchObject({ type: 'text', value: '修改后' });
  });

  it('deletes a message from a thread', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    store.addMessage(thread.threadId, {
      authorId: 'user-2',
      body: [{ type: 'text', value: '内容' }],
    });
    const msgId = store.get(thread.threadId)!.messages[0].messageId;

    const ok = store.deleteMessage(thread.threadId, msgId);
    expect(ok).toBe(true);
    expect(store.get(thread.threadId)!.messages).toHaveLength(0);
  });

  it('deleteMessage returns false for unknown message', () => {
    const thread = store.createThread({
      bookId: 'test-book', pageId: 'page-1',
      anchor: { kind: 'imagePoint', pageId: 'page-1', imageAssetId: 'img-1', imageVersion: 'v1', x: 10, y: 10 },
      category: 'question', createdBy: 'user-1',
    });
    expect(store.deleteMessage(thread.threadId, 'nonexistent')).toBe(false);
  });
});
