import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { ShipmentsService } from '../shipments/shipments.service.js';
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

export interface DemoNoteItem {
  id: string;
  shipmentId: string;
  authorId: string;
  author: NoteAuthorSummary;
  parentId: string | null;
  content: string;
  attachmentUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEMO_AUTHORS: Record<string, NoteAuthorSummary> = {
  admin: {
    id: 'user-admin',
    firstName: 'Kevin',
    lastName: 'Torres',
    email: 'admin@cargopulse.com',
    role: 'ADMIN',
  },
  operator: {
    id: 'user-operator',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'operator@cargopulse.com',
    role: 'LOGISTICS_OPERATOR',
  },
  auditor: {
    id: 'user-auditor',
    firstName: 'Elena',
    lastName: 'Rivas',
    email: 'auditor@cargopulse.com',
    role: 'FREIGHT_AUDITOR',
  },
};

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private demoNotes: DemoNoteItem[] = this.createInitialDemoNotes();

  private readonly validOfflineShipments = new Set<string>([
    'CP-2026-X9810',
    'shipment-x9810',
    'CP-2026-E4421',
    'shipment-e4421',
    'CP-2026-A1092',
    'shipment-a1092',
    'CP-MXUS-2026-001',
    'shipment-mxus-001',
    'CP-MXUS-2026-002',
    'shipment-mxus-002',
    'CP-MXUS-2026-003',
    'shipment-mxus-003',
    'ship-1',
  ]);

  private readonly shipmentAliases: Record<string, string> = {
    'shipment-x9810': 'CP-2026-X9810',
    'CP-2026-X9810': 'shipment-x9810',
    'shipment-e4421': 'CP-2026-E4421',
    'CP-2026-E4421': 'shipment-e4421',
    'shipment-a1092': 'CP-2026-A1092',
    'CP-2026-A1092': 'shipment-a1092',
    'shipment-mxus-001': 'CP-MXUS-2026-001',
    'CP-MXUS-2026-001': 'shipment-mxus-001',
    'shipment-mxus-002': 'CP-MXUS-2026-002',
    'CP-MXUS-2026-002': 'shipment-mxus-002',
    'shipment-mxus-003': 'CP-MXUS-2026-003',
    'CP-MXUS-2026-003': 'shipment-mxus-003',
  };

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly shipmentsService?: ShipmentsService,
  ) {}

  private get isDbAvailable(): boolean {
    return this.prisma?.isConnected !== false;
  }

  private createInitialDemoNotes(): DemoNoteItem[] {
    const baseTime = new Date('2026-10-16T10:00:00.000Z').getTime();
    return [
      {
        id: 'note-1',
        shipmentId: 'CP-2026-X9810',
        authorId: 'user-admin',
        author: DEMO_AUTHORS.admin,
        parentId: null,
        content:
          'Master B/L released by ocean carrier. Temperature logs required for refrigerated container.',
        attachmentUrl: null,
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime),
      },
      {
        id: 'note-2',
        shipmentId: 'CP-2026-X9810',
        authorId: 'user-operator',
        author: DEMO_AUTHORS.operator,
        parentId: 'note-1',
        content:
          'House B/L customs entry submitted to Newark port authority.',
        attachmentUrl: null,
        createdAt: new Date(baseTime + 3600 * 1000),
        updatedAt: new Date(baseTime + 3600 * 1000),
      },
      {
        id: 'note-3',
        shipmentId: 'CP-2026-X9810',
        authorId: 'user-auditor',
        author: DEMO_AUTHORS.auditor,
        parentId: 'note-2',
        content:
          'Pallet SKU #4892 telemetry confirmed at +4.2°C within compliant range.',
        attachmentUrl: null,
        createdAt: new Date(baseTime + 7200 * 1000),
        updatedAt: new Date(baseTime + 7200 * 1000),
      },
    ];
  }

  private buildTree(notes: DemoNoteItem[] | any[]): NoteTreeNode[] {
    const nodeMap = new Map<string, NoteTreeNode>();
    const rootNodes: NoteTreeNode[] = [];

    for (const note of notes) {
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

    for (const note of notes) {
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

  private findAuthor(authorId: string): NoteAuthorSummary {
    if (authorId === 'user-admin' || authorId.includes('admin')) {
      return DEMO_AUTHORS.admin;
    }
    if (authorId === 'user-operator' || authorId.includes('operator')) {
      return DEMO_AUTHORS.operator;
    }
    if (authorId === 'user-auditor' || authorId.includes('auditor')) {
      return DEMO_AUTHORS.auditor;
    }

    return {
      id: authorId,
      firstName: 'CargoPulse',
      lastName: 'User',
      email: `${authorId}@cargopulse.internal`,
      role: 'LOGISTICS_OPERATOR',
    };
  }

  /**
   * Fetches all notes for a shipment and builds a clean 3-level hierarchical tree:
   * Level 1: Root notes
   * Level 2: Direct replies to root notes
   * Level 3: Nested replies to level 2 notes
   */
  async getNotesTree(shipmentId: string): Promise<NoteTreeNode[]> {
    if (this.isDbAvailable) {
      try {
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

        return this.buildTree(allNotes);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during getNotesTree for ${shipmentId}: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo notes.`,
        );
      }
    }

    const exists = await this.checkShipmentExists(shipmentId);
    if (!exists) {
      throw new NotFoundException(`Shipment with ID "${shipmentId}" not found`);
    }

    const identifiers = await this.getShipmentIdentifiers(shipmentId);
    const shipmentNotes = this.demoNotes.filter((n) =>
      identifiers.has(n.shipmentId),
    );

    return this.buildTree(shipmentNotes);
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
    if (this.isDbAvailable) {
      try {
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

        return await this.prisma.note.create({
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
      } catch (error) {
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException
        ) {
          throw error;
        }
        this.logger.warn(
          `Database query failed during createNote: ${
            error instanceof Error ? error.message : String(error)
          }. Falling back to in-memory demo notes.`,
        );
      }
    }

    const exists = await this.checkShipmentExists(shipmentId);
    if (!exists) {
      throw new NotFoundException(`Shipment with ID "${shipmentId}" not found`);
    }

    const identifiers = await this.getShipmentIdentifiers(shipmentId);

    if (dto.parentId) {
      const parent = this.demoNotes.find((n) => n.id === dto.parentId);

      if (!parent || !identifiers.has(parent.shipmentId)) {
        throw new BadRequestException(
          'Parent note does not exist or does not belong to this shipment',
        );
      }

      // Enforce strict 3-level depth limit:
      // If parent.parentId is not null, parent is at least Level 2.
      if (parent.parentId !== null) {
        const grandParent = this.demoNotes.find((n) => n.id === parent.parentId);
        if (grandParent && grandParent.parentId !== null) {
          throw new BadRequestException(
            'Maximum discussion thread depth is 3 levels',
          );
        }
      }
    }

    const author = this.findAuthor(authorId);
    const newNote: DemoNoteItem = {
      id: `note-${Date.now()}`,
      shipmentId,
      authorId,
      author,
      parentId: dto.parentId ?? null,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.demoNotes.push(newNote);
    return newNote;
  }

  private async checkShipmentExists(shipmentId: string): Promise<boolean> {
    const alias = this.shipmentAliases[shipmentId];
    if (
      this.validOfflineShipments.has(shipmentId) ||
      (alias && this.validOfflineShipments.has(alias))
    ) {
      return true;
    }

    if (this.shipmentsService) {
      try {
        const found = await this.shipmentsService.findOne(shipmentId);
        if (found) {
          return true;
        }
      } catch {
        // Fall back to findAll query
      }

      try {
        const allShipments = await this.shipmentsService.findAll({ limit: 100 } as any);
        const matches = allShipments?.items?.some(
          (s) => s.id === shipmentId || s.trackingNumber === shipmentId,
        );
        if (matches) {
          return true;
        }
      } catch {
        // Ignored
      }
    }

    return false;
  }

  private async getShipmentIdentifiers(shipmentId: string): Promise<Set<string>> {
    const ids = new Set<string>([shipmentId]);
    const alias = this.shipmentAliases[shipmentId];
    if (alias) {
      ids.add(alias);
    }

    if (this.shipmentsService) {
      try {
        const found = await this.shipmentsService.findOne(shipmentId);
        if (found) {
          if (found.id) ids.add(found.id);
          if (found.trackingNumber) ids.add(found.trackingNumber);
        }
      } catch {
        try {
          const all = await this.shipmentsService.findAll({ limit: 100 } as any);
          const found = all?.items?.find(
            (s) => s.id === shipmentId || s.trackingNumber === shipmentId,
          );
          if (found) {
            if (found.id) ids.add(found.id);
            if (found.trackingNumber) ids.add(found.trackingNumber);
          }
        } catch {
          // Ignored
        }
      }
    }

    return ids;
  }
}

