import type {
  ISODateTime, LocalizedText,
  BookId, PageId, NoteId,
  GlossaryTermId, LegalRefId,
  ContentBlockId, HotspotId,
} from './primitives';
import type { RichTextNode } from './content';

export type { NotesConfigRef } from './page';

export type NoteAnchor =
  | { kind: "page"; pageId: PageId }
  | { kind: "hotspot"; pageId: PageId; hotspotId: HotspotId }
  | { kind: "contentBlock"; pageId: PageId; blockId: ContentBlockId }
  | { kind: "term"; termId: GlossaryTermId }
  | { kind: "legalRef"; legalRefId: LegalRefId };

export type AtlasNote = {
  noteId: NoteId;
  bookId: BookId;
  pageId: PageId;
  anchor?: NoteAnchor;
  title?: LocalizedText;
  body: RichTextNode[];
  noteType:
    | "speaker-note"
    | "supplement"
    | "legal-background"
    | "example"
    | "authoring-note"
    | "image-prompt-note"
    | "review-note";
  visibility: "reader" | "presenter" | "editor-only";
  tags?: string[];
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};
