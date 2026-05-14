import type {
  ISODateTime, LocalizedText,
  BookId, PageId, UserId,
  CommentThreadId, ImageAssetId,
  ContentBlockId, HotspotId,
  GlossaryTermId, LegalRefId,
} from './primitives';
import type { RichTextNode } from './content';
import type { PercentageRect } from './page';

export type AnchorStatus = "valid" | "needs-review" | "orphaned";

export type AnnotationAnchor =
  | {
      kind: "imagePoint";
      pageId: PageId;
      imageAssetId: ImageAssetId;
      imageVersion: string;
      x: number;
      y: number;
      status?: AnchorStatus;
    }
  | {
      kind: "imageRect";
      pageId: PageId;
      imageAssetId: ImageAssetId;
      imageVersion: string;
      rect: PercentageRect;
      status?: AnchorStatus;
    }
  | {
      kind: "hotspot";
      pageId: PageId;
      hotspotId: HotspotId;
    }
  | {
      kind: "contentBlock";
      pageId: PageId;
      blockId: ContentBlockId;
    }
  | {
      kind: "term";
      termId: GlossaryTermId;
    }
  | {
      kind: "legalRef";
      legalRefId: LegalRefId;
    };

export type CommentThread = {
  threadId: CommentThreadId;
  bookId: BookId;
  pageId: PageId;
  anchor: AnnotationAnchor;
  status: "open" | "resolved" | "archived";
  category:
    | "question"
    | "correction"
    | "tax-risk"
    | "legal-source"
    | "design"
    | "translation"
    | "todo"
    | "general";
  priority?: "low" | "normal" | "high";
  assignedTo?: UserId;
  messages: CommentMessage[];
  createdBy: UserId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  resolvedAt?: ISODateTime;
};

export type CommentMessage = {
  messageId: string;
  authorId: UserId;
  body: RichTextNode[];
  mentions?: UserId[];
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
};
