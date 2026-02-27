'use client';

// ============================================================
// VoxPop AI — Zustand Store with localStorage Persistence
// ============================================================
// Supports hybrid personal/community mode:
//   - Personal mode: instant results after one user's value survey
//   - Community mode: aggregated stats from all voters
//
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
  StructuralAsymmetry,
  ValueQuestion,
  PersonalRecommendation,
} from '@/lib/types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ---- State ----
      datasetAnalysis: null,
      structuralAsymmetries: [],
      valueQuestions: [],
      scenarios: [],
      scenarioAutoMLResults: {},
      responses: [],
      personalRecommendation: null,
      recommendation: null,

      // ---- Actions ----
      setDatasetAnalysis: (analysis: DatasetAnalysis) =>
        set({ datasetAnalysis: analysis }),

      setStructuralAsymmetries: (asymmetries: StructuralAsymmetry[]) =>
        set({ structuralAsymmetries: asymmetries }),

      setValueQuestions: (questions: ValueQuestion[]) =>
        set({ valueQuestions: questions }),

      setScenarios: (scenarios: Scenario[]) =>
        set({ scenarios }),

      setScenarioAutoMLResults: (results: Record<string, AutoMLResult>) =>
        set({ scenarioAutoMLResults: results }),

      addResponse: (response: SurveyResponse) =>
        set((state) => ({
          responses: [...state.responses, response],
          recommendation: null, // Clear community recommendation to recompute
        })),
      // FUTURE: Replace addResponse body with:
      //   await fetch('/api/responses', { method: 'POST', body: JSON.stringify(response) })
      //   then invalidate/refetch responses

      setPersonalRecommendation: (rec: PersonalRecommendation) =>
        set({ personalRecommendation: rec }),

      setRecommendation: (rec: CommunityRecommendation) =>
        set({ recommendation: rec }),

      reset: () =>
        set({
          datasetAnalysis: null,
          structuralAsymmetries: [],
          valueQuestions: [],
          scenarios: [],
          scenarioAutoMLResults: {},
          responses: [],
          personalRecommendation: null,
          recommendation: null,
        }),
    }),
    {
      name: 'voxpop-ai-store', // localStorage key
      // FUTURE: Replace storage adapter with database-backed adapter
    },
  ),
);
