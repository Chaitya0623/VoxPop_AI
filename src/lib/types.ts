// ============================================================
// VoxPop AI — Core Type Definitions
// ============================================================

// ---- Dataset Agent Types ----

export interface DatasetColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'text' | 'date';
  unique: number;
  missing: number;
  sample: string[];
}

export interface DatasetAnalysis {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumn[];
  taskType: 'classification' | 'regression';
  targetColumn: string;
  sensitiveAttributes: string[];
  problemStatement: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    summary: string;
    details: string[];
  };
  suggestedTradeoffs: string[];
  previewRows: Record<string, string | number | boolean>[];
}

// ---- Scenario Agent Types ----

export interface ObjectiveWeights {
  accuracy: number;   // 0–100
  fairness: number;   // 0–100
  robustness: number; // 0–100
}

export interface Scenario {
  id: string;
  title: string;
  weights: ObjectiveWeights;
  narrative: string;
  estimatedPerformance: string;
  whoBenefits: string;
  whoMayLose: string;
  tradeoffExplanation: string;
}

// ---- AutoML Types ----

export type ModelType = 'RandomForest' | 'XGBoost' | 'LogisticRegression' | 'GradientBoosting' | 'SVM';

export interface Hyperparameters {
  [key: string]: string | number | boolean;
}

export interface ModelMetrics {
  accuracy: number;
  fairnessScore: number;
  robustnessScore: number;
  interpretabilityScore: number;
}

export interface AutoMLResult {
  modelType: ModelType;
  hyperparameters: Hyperparameters;
  metrics: ModelMetrics;
  compositeScore: number;
}

// ---- Survey / Voting Types ----

export type GuidingPrinciple =
  | 'equal_opportunity'
  | 'equal_outcome'
  | 'profit_maximization'
  | 'social_equity';

export interface SurveyResponse {
  id: string;
  timestamp: number;
  selectedScenarioId: string;
  accuracyVsFairness: number; // 0 = full fairness, 100 = full accuracy
  guidingPrinciple: GuidingPrinciple;
  confidenceRating: number; // 1–5
}

// ---- Analytics Types ----

export interface PreferenceDriftPoint {
  timestamp: number;
  label: string;
  averageAccuracyPref: number;
  averageFairnessPref: number;
}

export interface CommunityInsights {
  scenarioSplit: { name: string; value: number }[];
  principleSplit: { name: string; value: number }[];
  preferenceDrift: PreferenceDriftPoint[];
  polarizationIndex: number;
  stabilityScore: number;
  trendDirection: 'increasing_fairness' | 'increasing_efficiency' | 'stable';
  totalResponses: number;
}

// ---- Recommendation Types ----

export interface CommunityRecommendation {
  communityWeights: ObjectiveWeights;
  autoMLResult: AutoMLResult;
  justification: string;
  supportPercentage: number;
}

// ---- App State ----

export interface AppState {
  // Dataset
  datasetAnalysis: DatasetAnalysis | null;

  // Scenarios
  scenarios: Scenario[];
  scenarioAutoMLResults: Record<string, AutoMLResult>;

  // Responses
  responses: SurveyResponse[];

  // Recommendation
  recommendation: CommunityRecommendation | null;

  // Actions
  setDatasetAnalysis: (analysis: DatasetAnalysis) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setScenarioAutoMLResults: (results: Record<string, AutoMLResult>) => void;
  addResponse: (response: SurveyResponse) => void;
  setRecommendation: (rec: CommunityRecommendation) => void;
  reset: () => void;
}
