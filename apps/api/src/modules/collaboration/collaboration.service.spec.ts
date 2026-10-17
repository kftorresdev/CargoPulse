import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollaborationService } from './collaboration.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let prismaMock: {
    isConnected?: boolean;
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

  describe('Dual-Mode In-Memory Resilience (Offline Fallback)', () => {
    beforeEach(() => {
      prismaMock.isConnected = false;
    });

    it('should return 3-level hierarchical tree for CP-2026-X9810 when DB is offline', async () => {
      const tree = await service.getNotesTree('CP-2026-X9810');

      expect(tree).toHaveLength(1);

      // Level 1: Root Note
      const root = tree[0];
      expect(root.id).toBe('note-1');
      expect(root.author.role).toBe('ADMIN');
      expect(root.author.firstName).toBe('Kevin');
      expect(root.content).toContain('Master B/L released by ocean carrier');
      expect(root.replies).toHaveLength(1);

      // Level 2: Operator Reply
      const level2 = root.replies[0];
      expect(level2.id).toBe('note-2');
      expect(level2.author.role).toBe('LOGISTICS_OPERATOR');
      expect(level2.author.firstName).toBe('Carlos');
      expect(level2.content).toContain('House B/L customs entry submitted');
      expect(level2.replies).toHaveLength(1);

      // Level 3: Auditor Sub-reply
      const level3 = level2.replies[0];
      expect(level3.id).toBe('note-3');
      expect(level3.author.role).toBe('FREIGHT_AUDITOR');
      expect(level3.author.firstName).toBe('Elena');
      expect(level3.content).toContain('Pallet SKU #4892 telemetry confirmed');
      expect(level3.replies).toHaveLength(0);

      expect(prismaMock.note.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent shipment in offline mode', async () => {
      await expect(
        service.getNotesTree('invalid-offline-shipment'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create root note in offline mode', async () => {
      const note = await service.createNote('CP-2026-X9810', 'user-operator', {
        content: 'New offline root communication note',
      });

      expect(note.id).toMatch(/^note-/);
      expect(note.parentId).toBeNull();
      expect(note.content).toBe('New offline root communication note');
      expect(note.author.role).toBe('LOGISTICS_OPERATOR');

      expect(prismaMock.note.create).not.toHaveBeenCalled();
    });

    it('should allow creating Level 2 note in offline mode', async () => {
      const level2 = await service.createNote('CP-2026-X9810', 'user-auditor', {
        content: 'Reply to root note',
        parentId: 'note-1',
      });

      expect(level2.parentId).toBe('note-1');
      expect(level2.author.role).toBe('FREIGHT_AUDITOR');
    });

    it('should throw BadRequestException when trying to add Level 4 note (exceeding 3-level depth limit) in offline mode', async () => {
      // note-3 is already at Level 3 (root -> note-2 -> note-3)
      await expect(
        service.createNote('CP-2026-X9810', 'user-operator', {
          content: 'Disallowed fourth level reply',
          parentId: 'note-3',
        }),
      ).rejects.toThrow('Maximum discussion thread depth is 3 levels');
    });

    it('should throw BadRequestException if parent note does not exist in offline mode', async () => {
      await expect(
        service.createNote('CP-2026-X9810', 'user-admin', {
          content: 'Reply with missing parent',
          parentId: 'ghost-parent-note',
        }),
      ).rejects.toThrow(
        'Parent note does not exist or does not belong to this shipment',
      );
    });

    it('should throw NotFoundException if shipment does not exist when creating note in offline mode', async () => {
      await expect(
        service.createNote('non-existent-shipment', 'user-admin', {
          content: 'Offline test on unknown shipment',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty tree [] for shipment-mxus-002 when it has no notes yet in offline mode', async () => {
      const tree = await service.getNotesTree('shipment-mxus-002');
      expect(tree).toEqual([]);
    });

    it('should create a note on shipment-mxus-002 and retrieve it via getNotesTree in offline mode', async () => {
      const createdNote = await service.createNote('shipment-mxus-002', 'user-operator', {
        content: 'Cross-border transport manifest inspected at Laredo',
      });

      expect(createdNote.id).toMatch(/^note-/);
      expect(createdNote.shipmentId).toBe('shipment-mxus-002');
      expect(createdNote.content).toBe('Cross-border transport manifest inspected at Laredo');

      const tree = await service.getNotesTree('shipment-mxus-002');
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(createdNote.id);
      expect(tree[0].content).toBe('Cross-border transport manifest inspected at Laredo');
      expect(tree[0].replies).toHaveLength(0);
    });

    it('should allow replying to a valid parent note on shipment-mxus-002 in offline mode', async () => {
      const rootNote = await service.createNote('shipment-mxus-002', 'user-operator', {
        content: 'Customs release order pending approval',
      });

      const replyNote = await service.createNote('shipment-mxus-002', 'user-auditor', {
        content: 'Inspection stamp verified and confirmed',
        parentId: rootNote.id,
      });

      expect(replyNote.parentId).toBe(rootNote.id);

      const tree = await service.getNotesTree('shipment-mxus-002');
      const rootInTree = tree.find((n) => n.id === rootNote.id);
      expect(rootInTree).toBeDefined();
      expect(rootInTree!.replies).toHaveLength(1);
      expect(rootInTree!.replies[0].id).toBe(replyNote.id);
      expect(rootInTree!.replies[0].content).toBe('Inspection stamp verified and confirmed');
    });

    it('should support dynamically created shipments via ShipmentsService in offline mode', async () => {
      const shipmentsServiceMock = {
        findOne: vi.fn().mockImplementation(async (id: string) => {
          if (id === 'shipment-dyn-999') {
            return {
              id: 'shipment-dyn-999',
              trackingNumber: 'CP-DYN-999',
            };
          }
          throw new NotFoundException(`Shipment ${id} not found`);
        }),
        findAll: vi.fn().mockResolvedValue({
          items: [
            { id: 'shipment-dyn-999', trackingNumber: 'CP-DYN-999' },
          ],
        }),
      };

      const customService = new CollaborationService(
        prismaMock as unknown as PrismaService,
        shipmentsServiceMock as unknown as any,
      );

      const tree = await customService.getNotesTree('shipment-dyn-999');
      expect(tree).toEqual([]);

      const note = await customService.createNote('shipment-dyn-999', 'user-operator', {
        content: 'Dynamic shipment note',
      });
      expect(note.id).toMatch(/^note-/);

      const updatedTree = await customService.getNotesTree('shipment-dyn-999');
      expect(updatedTree).toHaveLength(1);
      expect(updatedTree[0].content).toBe('Dynamic shipment note');
    });

    it('should fallback to in-memory demo notes when database query throws error', async () => {
      prismaMock.isConnected = true;
      prismaMock.shipment.findUnique.mockRejectedValue(
        new Error('PostgreSQL socket disconnected'),
      );

      const tree = await service.getNotesTree('CP-2026-X9810');

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('note-1');
    });
  });
});
