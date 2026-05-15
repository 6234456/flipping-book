import type { CommentThread, CommentMessage, AnnotationAnchor } from '../types/comments';

const STORAGE_PREFIX = 'atlas-comments-';

function generateId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function messageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CreateThreadInput = {
  bookId: string;
  pageId: string;
  anchor: AnnotationAnchor;
  category: CommentThread['category'];
  priority?: CommentThread['priority'];
  createdBy: string;
};

export function createCommentStore(bookId: string) {
  const storageKey = STORAGE_PREFIX + bookId;

  function load(): CommentThread[] {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save(threads: CommentThread[]) {
    localStorage.setItem(storageKey, JSON.stringify(threads));
  }

  return {
    getAll(): CommentThread[] {
      return load();
    },

    get(threadId: string): CommentThread | undefined {
      return load().find((t) => t.threadId === threadId);
    },

    getByPage(pageId: string): CommentThread[] {
      return load().filter((t) => t.pageId === pageId);
    },

    createThread(input: CreateThreadInput): CommentThread {
      const now = new Date().toISOString();
      const thread: CommentThread = {
        threadId: generateId(),
        bookId: input.bookId,
        pageId: input.pageId,
        anchor: input.anchor,
        status: 'open',
        category: input.category,
        priority: input.priority ?? 'normal',
        messages: [],
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      };
      const threads = load();
      threads.push(thread);
      save(threads);
      return thread;
    },

    addMessage(threadId: string, msg: { authorId: string; body: CommentMessage['body'] }): CommentThread | undefined {
      const threads = load();
      const thread = threads.find((t) => t.threadId === threadId);
      if (!thread) return undefined;

      const message: CommentMessage = {
        messageId: messageId(),
        authorId: msg.authorId,
        body: msg.body,
        createdAt: new Date().toISOString(),
      };
      thread.messages.push(message);
      thread.updatedAt = new Date().toISOString();
      save(threads);
      return thread;
    },

    resolve(threadId: string): void {
      const threads = load();
      const thread = threads.find((t) => t.threadId === threadId);
      if (thread) {
        thread.status = 'resolved';
        thread.resolvedAt = new Date().toISOString();
        thread.updatedAt = new Date().toISOString();
        save(threads);
      }
    },

    reopen(threadId: string): void {
      const threads = load();
      const thread = threads.find((t) => t.threadId === threadId);
      if (thread) {
        thread.status = 'open';
        thread.resolvedAt = undefined;
        thread.updatedAt = new Date().toISOString();
        save(threads);
      }
    },

    deleteThread(threadId: string): boolean {
      const threads = load();
      const idx = threads.findIndex((t) => t.threadId === threadId);
      if (idx === -1) return false;
      threads.splice(idx, 1);
      save(threads);
      return true;
    },

    editMessage(threadId: string, messageId: string, newBody: CommentMessage['body']): boolean {
      const threads = load();
      const thread = threads.find((t) => t.threadId === threadId);
      if (!thread) return false;
      const msg = thread.messages.find((m) => m.messageId === messageId);
      if (!msg) return false;
      msg.body = newBody;
      msg.updatedAt = new Date().toISOString();
      thread.updatedAt = new Date().toISOString();
      save(threads);
      return true;
    },

    deleteMessage(threadId: string, messageId: string): boolean {
      const threads = load();
      const thread = threads.find((t) => t.threadId === threadId);
      if (!thread) return false;
      const idx = thread.messages.findIndex((m) => m.messageId === messageId);
      if (idx === -1) return false;
      thread.messages.splice(idx, 1);
      thread.updatedAt = new Date().toISOString();
      save(threads);
      return true;
    },

    /** Export all comments as a JSON string */
    exportJSON(): string {
      return JSON.stringify(load(), null, 2);
    },

    /** Import comments from a JSON string. Merges with existing, skipping duplicate threadIds. */
    importJSON(json: string): { imported: number; skipped: number } {
      try {
        const incoming: CommentThread[] = JSON.parse(json);
        if (!Array.isArray(incoming)) return { imported: 0, skipped: 0 };

        const existing = load();
        const existingIds = new Set(existing.map((t) => t.threadId));
        let imported = 0;
        let skipped = 0;

        for (const thread of incoming) {
          if (existingIds.has(thread.threadId)) {
            skipped++;
          } else {
            existing.push(thread);
            existingIds.add(thread.threadId);
            imported++;
          }
        }

        save(existing);
        return { imported, skipped };
      } catch {
        return { imported: 0, skipped: 0 };
      }
    },
  };
}
