jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../db';
import {
  createLocationPrompt,
  getLatestLocationPrompt,
  listLocationPrompts,
  markLocationPromptAccepted,
} from './LocationPromptRepository';

function createLocationPromptRow(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    created_at: '2026-04-02T10:00:00.000Z',
    dismissed_permanently: 0,
    gym_id: 'gym_1',
    id: 'prompt_1',
    occurred_at: '2026-04-02T10:00:00.000Z',
    related_visit_id: null,
    type: 'enter',
    was_accepted: 0,
    ...overrides,
  };
}

describe('LocationPromptRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists location prompts newest-first with filter support', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [
          createLocationPromptRow({
            id: 'prompt_2',
            occurred_at: '2026-04-02T12:00:00.000Z',
          }),
          createLocationPromptRow({
            id: 'prompt_1',
            occurred_at: '2026-04-02T10:00:00.000Z',
          }),
        ],
        item: () => undefined,
        length: 2,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const prompts = await listLocationPrompts({
      gymId: 'gym_1',
      relatedVisitId: 'visit_1',
    });

    expect(executeAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE gym_id = ? AND related_visit_id = ?'),
      ['gym_1', 'visit_1'],
    );
    expect(prompts[0]?.id).toBe('prompt_2');
    expect(prompts[1]?.id).toBe('prompt_1');
  });

  it('creates a new prompt row with default acceptance flags', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: {
          item: () =>
            createLocationPromptRow({
              id: 'prompt_3',
              type: 'checkin_suggested',
            }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const prompt = await createLocationPrompt({
      gymId: 'gym_1',
      occurredAt: '2026-04-02T10:05:00.000Z',
      type: 'checkin_suggested',
    });

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO location_prompts'),
      expect.arrayContaining([
        expect.stringMatching(/^prompt_/),
        'gym_1',
        'checkin_suggested',
        '2026-04-02T10:05:00.000Z',
        0,
        null,
        0,
        expect.any(String),
      ]),
    );
    expect(prompt.type).toBe('checkin_suggested');
    expect(prompt.wasAccepted).toBe(false);
  });

  it('marks a prompt accepted and links it to a visit', async () => {
    const txExecuteAsync = jest
      .fn()
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({
        rows: {
          item: () =>
            createLocationPromptRow({
              id: 'prompt_1',
              related_visit_id: 'visit_1',
              was_accepted: 1,
            }),
        },
      });
    const transaction = jest.fn(async callback =>
      callback({
        executeAsync: txExecuteAsync,
      }),
    );

    (getDatabase as jest.Mock).mockReturnValue({ transaction });

    const prompt = await markLocationPromptAccepted('prompt_1', 'visit_1');

    expect(txExecuteAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE location_prompts'),
      ['visit_1', 'prompt_1'],
    );
    expect(prompt.wasAccepted).toBe(true);
    expect(prompt.relatedVisitId).toBe('visit_1');
  });

  it('returns the latest prompt helper result when rows exist', async () => {
    const executeAsync = jest.fn().mockResolvedValue({
      rows: {
        _array: [createLocationPromptRow({ id: 'prompt_latest' })],
        item: () => undefined,
        length: 1,
      },
    });

    (getDatabase as jest.Mock).mockReturnValue({ executeAsync });

    const latestPrompt = await getLatestLocationPrompt();

    expect(latestPrompt?.id).toBe('prompt_latest');
  });
});
