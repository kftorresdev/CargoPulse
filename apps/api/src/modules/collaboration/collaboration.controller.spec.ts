import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollaborationController } from './collaboration.controller.js';
import { CollaborationService } from './collaboration.service.js';

describe('CollaborationController', () => {
  let controller: CollaborationController;
  let serviceMock: {
    getNotesTree: ReturnType<typeof vi.fn>;
    createNote: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    serviceMock = {
      getNotesTree: vi.fn(),
      createNote: vi.fn(),
    };
    controller = new CollaborationController(
      serviceMock as unknown as CollaborationService,
    );
  });

  it('should call service.getNotesTree with shipmentId', async () => {
    serviceMock.getNotesTree.mockResolvedValue([]);

    const res = await controller.getNotesTree('ship-1');
    expect(serviceMock.getNotesTree).toHaveBeenCalledWith('ship-1');
    expect(res).toEqual([]);
  });

  it('should call service.createNote with shipmentId, authorId, and dto', async () => {
    const dto = { content: 'Test note' };
    serviceMock.createNote.mockResolvedValue({ id: 'note-1', content: 'Test note' });

    const res = await controller.createNote('ship-1', 'author-1', dto);
    expect(serviceMock.createNote).toHaveBeenCalledWith('ship-1', 'author-1', dto);
    expect(res).toEqual({ id: 'note-1', content: 'Test note' });
  });
});
