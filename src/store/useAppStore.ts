'use client';

// ============================================================
// VoxPop AI — Zustand Store with localStorage Persistence
// ============================================================
// FUTURE: Replace localStorage with database API calls.
//         The store actions become thin wrappers around API calls.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  DatasetAnalysis,
  Scenario,
  AutoMLResult,
  SurveyResponse,
  CommunityRecommendation,
} from '@/lib/types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ---- State ----
      datasetAnalysis: null,
      scenarios: [],
      scenarioAutoMLResults: {},
      responses: [],
      recommendation: null,

      // ---- Actions ----
      setDatasetAnalysis: (analysis: DatasetAnalysis) =>
        set({ datasetAnalysis: analysis }),

      setScenarios: (scenarios: Scenario[]) =>
        set({ scenarios }),

      setScenarioAutoMLResults: (results: Record<string, AutoMLResult>) =>
        set({ scenarioAutoMLResults: results }),

      addResponse: (response: SurveyResponse) =>
        set((state) => ({
          responses: [...state.responses, response],
          recommendation: null, // Clear recommendation to recompute with new votes
        })),
      // FUTURE: Replace addResponse body with:
      //   await fetch('/api/responses', { method: 'POST', body: JSON.stringify(response) })
      //   then invalidate/refetch responses

      setRecommendation: (rec: CommunityRecommendation) =>
        set({ recommendation: rec }),

      reset: () =>
        set({
          datasetAnalysis: null,
          scenarios: [],
          scenarioAutoMLResults: {},
          responses: [],
          recommendation: null,
        }),
    }),
    {
      name: 'voxpop-ai-store', // localStorage key
      // FUTURE: Replace storage adapter with database-backed adapter
    },
  ),
);
