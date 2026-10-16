import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollaborationService } from './collaboration.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let prismaMock: {
    shipment: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    note: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      shipment: {
        findUnique: vi.fn(),
      },
      note: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new CollaborationService(prismaMock as unknown as PrismaService);
  });

  describe('getNotesTree', () => {
    it('should throw NotFoundException if shipment does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(service.getNotesTree('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should build a clean 3-level hierarchical tree', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });

      const mockNotes = [
        {
          id: 'note-1',
          shipmentId: 'ship-1',
          authorId: 'user-1',
          parentId: null,
          content: 'Level 1 Root note',
          attachmentUrl: null,
          createdAt: new Date('2026-10-16T10:00:00Z'),
          updatedAt: new Date('2026-10-16T10:00:00Z'),
          author: { id: 'user-1', firstName: 'Sarah', lastName: 'Chen', email: 's@cp.com', role: 'ADMIN' },
        },
        {
          id: 'note-2',
          shipmentId: 'ship-1',
          authorId: 'user-2',
          parentId: 'note-1',
          content: 'Level 2 Reply to note-1',
          attachmentUrl: null,
          createdAt: new Date('2026-10-16T11:00:00Z'),
          updatedAt: new Date('2026-10-16T11:00:00Z'),
          author: { id: 'user-2', firstName: 'Elena', lastName: 'Reyes', email: 'e@cp.com', role: 'OPERATOR' },
        },
        {
          id: 'note-3',
          shipmentId: 'ship-1',
          authorId: 'user-3',
          parentId: 'note-2',
          content: 'Level 3 Sub-reply to note-2',
          attachmentUrl: null,
          createdAt: new Date('2026-10-16T12:00:00Z'),
          updatedAt: new Date('2026-10-16T12:00:00Z'),
          author: { id: 'user-3', firstName: 'Marcus', lastName: 'Vance', email: 'm@cp.com', role: 'AUDITOR' },
        },
      ];

      prismaMock.note.findMany.mockResolvedValue(mockNotes);

      const tree = await service.getNotesTree('ship-1');

      expect(tree).toHaveLength(1);
      const root = tree[0];
      expect(root.id).toBe('note-1');
      expect(root.replies).toHaveLength(1);

      const level2 = root.replies[0];
      expect(level2.id).toBe('note-2');
      expect(level2.replies).toHaveLength(1);

      const level3 = level2.replies[0];
      expect(level3.id).toBe('note-3');
      expect(level3.replies).toHaveLength(0);
    });
  });

  describe('createNote', () => {
    it('should throw NotFoundException if shipment does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue(null);

      await expect(
        service.createNote('non-existent-id', 'user-1', {
          content: 'Test note',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create root note when parentId is omitted', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.note.create.mockResolvedValue({
        id: 'new-note-1',
        content: 'Root note content',
        parentId: null,
      });

      const res = await service.createNote('ship-1', 'user-1', {
        content: 'Root note content',
      });

      expect(prismaMock.note.create).toHaveBeenCalledWith({
        data: {
          shipmentId: 'ship-1',
          authorId: 'user-1',
          content: 'Root note content',
          parentId: null,
          attachmentUrl: null,
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
      expect(res.id).toBe('new-note-1');
    });

    it('should throw BadRequestException if parent note does not exist', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.note.findUnique.mockResolvedValue(null);

      await expect(
        service.createNote('ship-1', 'user-1', {
          content: 'Reply note',
          parentId: 'invalid-parent',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if parent belongs to another shipment', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.note.findUnique.mockResolvedValue({
        id: 'parent-1',
        shipmentId: 'different-shipment-id',
        parentId: null,
      });

      await expect(
        service.createNote('ship-1', 'user-1', {
          content: 'Reply note',
          parentId: 'parent-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow creating level 2 note replying to root note', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.note.findUnique.mockResolvedValue({
        id: 'root-1',
        shipmentId: 'ship-1',
        parentId: null, // Level 1
      });
      prismaMock.note.create.mockResolvedValue({
        id: 'level2-note',
        parentId: 'root-1',
      });

      const res = await service.createNote('ship-1', 'user-1', {
        content: 'Level 2 reply',
        parentId: 'root-1',
      });

      expect(res.id).toBe('level2-note');
    });

    it('should allow creating level 3 note replying to level 2 note', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      prismaMock.note.findUnique
        .mockResolvedValueOnce({
          id: 'level2-1',
          shipmentId: 'ship-1',
          parentId: 'root-1', // Level 2
        })
        .mockResolvedValueOnce({
          id: 'root-1',
          shipmentId: 'ship-1',
          parentId: null, // Level 1
        });

      prismaMock.note.create.mockResolvedValue({
        id: 'level3-note',
        parentId: 'level2-1',
      });

      const res = await service.createNote('ship-1', 'user-1', {
        content: 'Level 3 sub-reply',
        parentId: 'level2-1',
      });

      expect(res.id).toBe('level3-note');
    });

    it('should throw BadRequestException when maximum discussion thread depth (3 levels) is exceeded', async () => {
      prismaMock.shipment.findUnique.mockResolvedValue({ id: 'ship-1' });
      // Parent is already level 3
      prismaMock.note.findUnique
        .mockResolvedValueOnce({
          id: 'level3-1',
          shipmentId: 'ship-1',
          parentId: 'level2-1',
        })
        .mockResolvedValueOnce({
          id: 'level2-1',
          shipmentId: 'ship-1',
          parentId: 'root-1', // Parent itself has a parent that has a parent!
        });

      await expect(
        service.createNote('ship-1', 'user-1', {
          content: 'Level 4 disallowed reply',
          parentId: 'level3-1',
        }),
      ).rejects.toThrow('Maximum discussion thread depth is 3 levels');
    });
  });
});
