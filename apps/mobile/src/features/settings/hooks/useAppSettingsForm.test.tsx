jest.mock('../useCases/appSettings', () => ({
  getAppSettings: jest.fn(),
  mapAppSettingsToFormValues: (settings: {
    currency: string;
    defaultGstRate: number;
    defaultPstRate: number;
    locale: string;
  } | null) =>
    settings
      ? {
          currency: settings.currency,
          defaultGstRate: String(settings.defaultGstRate),
          defaultPstRate: String(settings.defaultPstRate),
          locale: settings.locale,
        }
      : {
          currency: 'CAD',
          defaultGstRate: '0.05',
          defaultPstRate: '0.07',
          locale: 'en-CA',
        },
}));

jest.mock('../useCases/saveAppSettings', () => {
  class AppSettingsFormValidationError extends Error {
    issues: Array<{ field: string; message: string }>;

    constructor(issues: Array<{ field: string; message: string }>) {
      super('App settings form validation failed.');
      this.issues = issues;
    }
  }

  return {
    AppSettingsFormValidationError,
    saveAppSettings: jest.fn(),
    validateAppSettingsForm: (values: {
      currency: string;
      defaultGstRate: string;
      defaultPstRate: string;
      locale: string;
    }) => {
      const issues: Array<{ field: string; message: string }> = [];

      if (values.currency.trim().length === 0) {
        issues.push({
          field: 'currency',
          message: 'Enter a currency code such as CAD.',
        });
      }

      if (values.locale.trim().length === 0) {
        issues.push({
          field: 'locale',
          message: 'Enter a locale such as en-CA.',
        });
      }

      if (
        Number.isNaN(Number(values.defaultGstRate)) ||
        Number(values.defaultGstRate) < 0
      ) {
        issues.push({
          field: 'defaultGstRate',
          message: 'Enter a GST rate that is 0 or greater.',
        });
      }

      if (
        Number.isNaN(Number(values.defaultPstRate)) ||
        Number(values.defaultPstRate) < 0
      ) {
        issues.push({
          field: 'defaultPstRate',
          message: 'Enter a PST rate that is 0 or greater.',
        });
      }

      return issues;
    },
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { getAppSettings } from '../useCases/appSettings';
import { saveAppSettings } from '../useCases/saveAppSettings';
import { useAppSettingsForm } from './useAppSettingsForm';

let latestHookState: ReturnType<typeof useAppSettingsForm> | null = null;

function HookHarness() {
  latestHookState = useAppSettingsForm();
  return null;
}

async function flushEffects() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('useAppSettingsForm', () => {
  afterEach(() => {
    latestHookState = null;
    jest.clearAllMocks();
  });

  it('loads the default settings row into editable form values', async () => {
    (getAppSettings as jest.Mock).mockResolvedValue({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      createdAt: '2026-04-02T10:00:00.000Z',
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      homePrimaryMetric: 'cost_per_visit',
      id: 'default',
      locale: 'en-CA',
      regionPreset: 'BC_CA',
      updatedAt: '2026-04-02T10:00:00.000Z',
    });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    expect(latestHookState?.loadState).toBe('ready');
    expect(latestHookState?.formValues).toEqual({
      currency: 'CAD',
      defaultGstRate: '0.05',
      defaultPstRate: '0.07',
      locale: 'en-CA',
    });
  });

  it('saves edited settings and updates feedback state', async () => {
    (getAppSettings as jest.Mock).mockResolvedValue({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      createdAt: '2026-04-02T10:00:00.000Z',
      currency: 'CAD',
      defaultGstRate: 0.05,
      defaultPstRate: 0.07,
      homePrimaryMetric: 'cost_per_visit',
      id: 'default',
      locale: 'en-CA',
      regionPreset: 'BC_CA',
      updatedAt: '2026-04-02T10:00:00.000Z',
    });
    (saveAppSettings as jest.Mock).mockResolvedValue({
      checkinSuggestionsEnabled: true,
      checkoutSuggestionsEnabled: true,
      createdAt: '2026-04-02T10:00:00.000Z',
      currency: 'USD',
      defaultGstRate: 0,
      defaultPstRate: 0.08,
      homePrimaryMetric: 'cost_per_visit',
      id: 'default',
      locale: 'en-US',
      regionPreset: 'BC_CA',
      updatedAt: '2026-04-03T10:00:00.000Z',
    });

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<HookHarness />);
      await flushEffects();
    });

    await ReactTestRenderer.act(async () => {
      latestHookState?.setFieldValue('currency', 'USD');
      latestHookState?.setFieldValue('locale', 'en-US');
      latestHookState?.setFieldValue('defaultGstRate', '0');
      latestHookState?.setFieldValue('defaultPstRate', '0.08');
      await latestHookState?.save();
      await flushEffects();
    });

    expect(saveAppSettings).toHaveBeenCalled();
    expect(latestHookState?.saveState).toBe('success');
    expect(latestHookState?.saveFeedback).toBe('Settings updated.');
    expect(latestHookState?.formValues).toEqual({
      currency: 'USD',
      defaultGstRate: '0',
      defaultPstRate: '0.08',
      locale: 'en-US',
    });
  });
});
