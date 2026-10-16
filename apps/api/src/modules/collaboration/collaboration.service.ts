import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateNoteDto } from './dto/index.js';

export interface NoteAuthorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface NoteTreeNode {
  id: string;
  shipmentId: string;
  authorId: string;
  author: NoteAuthorSummary;
  parentId: string | null;
  content: string;
  attachmentUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  replies: NoteTreeNode[];
}

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches all notes for a shipment and builds a clean 3-level hierarchical tree:
   * Level 1: Root notes
   * Level 2: Direct replies to root notes
   * Level 3: Nested replies to level 2 notes
   */
  async getNotesTree(shipmentId: string): Promise<NoteTreeNode[]> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${shipmentId}" not found`);
    }

    const allNotes = await this.prisma.note.findMany({
      where: { shipmentId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const nodeMap = new Map<string, NoteTreeNode>();
    const rootNodes: NoteTreeNode[] = [];

    for (const note of allNotes) {
      nodeMap.set(note.id, {
        id: note.id,
        shipmentId: note.shipmentId,
        authorId: note.authorId,
        author: note.author,
        parentId: note.parentId,
        content: note.content,
        attachmentUrl: note.attachmentUrl,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        replies: [],
      });
    }

    for (const note of allNotes) {
      const current = nodeMap.get(note.id)!;
      if (!note.parentId) {
        rootNodes.push(current);
      } else {
        const parent = nodeMap.get(note.parentId);
        if (parent) {
          parent.replies.push(current);
        } else {
          rootNodes.push(current);
        }
      }
    }

    return rootNodes;
  }

  /**
   * Creates a note or reply linked to an author and shipment.
   * Enforces strict 3-level depth limit:
   * Level 1: Root note (parentId is null)
   * Level 2: Parent is Level 1 (parent.parentId is null)
   * Level 3: Parent is Level 2 (parent.parentId is not null, grandparent.parentId is null)
   * If parent itself has a parent that has a parent (already level 3), throws BadRequestException.
   */
  async createNote(shipmentId: string, authorId: string, dto: CreateNoteDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID "${shipmentId}" not found`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.note.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.shipmentId !== shipmentId) {
        throw new BadRequestException(
          'Parent note does not exist or does not belong to this shipment',
        );
      }

      // Enforce strict 3-level depth limit
      if (parent.parentId !== null) {
        const grandParent = await this.prisma.note.findUnique({
          where: { id: parent.parentId },
        });

        if (grandParent && grandParent.parentId !== null) {
          throw new BadRequestException(
            'Maximum discussion thread depth is 3 levels',
          );
        }
      }
    }

    return this.prisma.note.create({
      data: {
        shipmentId,
        authorId,
        content: dto.content,
        parentId: dto.parentId ?? null,
        attachmentUrl: dto.attachmentUrl ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
