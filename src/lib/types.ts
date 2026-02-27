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

// ---- Structural Analysis Types ----

export interface GroupStats {
  groupName: string;
  count: number;
  /** Key outcome metrics for this group (e.g., avg distance, avg income) */
  metrics: Record<string, number>;
}

export interface StructuralAsymmetry {
  /** The sensitive attribute that defines the groups (e.g., "race", "neighborhood") */
  attribute: string;
  /** Per-group statistical summaries */
  groups: GroupStats[];
  /** Detected disparities described in plain language */
  disparities: string[];
  /** Overall severity of the structural asymmetry */
  severity: 'low' | 'moderate' | 'high';
  /** Human-readable summary of the asymmetry */
  summary: string;
}

// ---- Value Question Types ----

export type ValueQuestionType = 'likert' | 'binary';

export interface ValueQuestion {
  id: string;
  /** The question text (contextual, referencing detected asymmetries) */
  question: string;
  type: ValueQuestionType;
  /** Which objective this question primarily maps to */
  mapsTo: 'accuracy' | 'fairness' | 'robustness';
  /** Weight multiplier for how strongly this question influences the mapped objective */
  weight: number;
  /** Optional: which asymmetry this question was derived from */
  relatedAsymmetry?: string;
}

export interface ValueResponse {
  questionId: string;
  /** For likert: 1–5 (Strongly Disagree → Strongly Agree); for binary: 0 or 1 */
  answer: number;
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

// ---- Monte Carlo Simulation Types ----

export interface AllocationArm {
  /** Group identifier (e.g., "Group A", "Group B") */
  groupName: string;
  /** Fraction of budget allocated (0–1) */
  allocation: number;
}

export interface MonteCarloRun {
  /** Allocation per group for this run */
  allocations: AllocationArm[];
  /** Simulated outcome metric (e.g., predicted attendance %) */
  outcome: number;
  /** Fairness metric for this run (e.g., equalized odds gap) */
  fairnessGap: number;
}

export interface MonteCarloResult {
  /** Total number of simulation runs */
  totalRuns: number;
  /** The Pareto-optimal allocation */
  optimalAllocation: AllocationArm[];
  /** Expected outcome at optimal allocation */
  expectedOutcome: number;
  /** Expected fairness improvement at optimal allocation (%) */
  fairnessImprovement: number;
  /** Efficiency sacrifice compared to pure-efficiency allocation (%) */
  efficiencySacrifice: number;
  /** Confidence level based on simulation convergence */
  confidence: 'low' | 'moderate' | 'high';
  /** Distribution summary: Pareto frontier points */
  paretoFrontier: { outcome: number; fairnessGap: number; allocation: number }[];
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
  /** NEW: value question responses (empty for legacy / sample votes) */
  valueResponses?: ValueResponse[];
  /** NEW: inferred weights from value questions (computed at vote time) */
  inferredWeights?: ObjectiveWeights;
}

// ---- Personal Recommendation Types ----

export interface PersonalRecommendation {
  /** Inferred weights from this user's value responses */
  userWeights: ObjectiveWeights;
  /** AutoML model recommendation for this user's values */
  autoMLResult: AutoMLResult;
  /** Monte Carlo allocation recommendation */
  monteCarloResult: MonteCarloResult;
  /** Human-readable summary (e.g., "Allocate 65% budget to Group B...") */
  summary: string;
  /** How this user's values compare to community (null if cold start) */
  communityComparison: {
    userFairnessWeight: number;
    communityFairnessWeight: number;
    divergencePercent: number;
    description: string;
  } | null;
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
  /** NEW: community-level Monte Carlo allocation (null if not enough data) */
  monteCarloResult?: MonteCarloResult | null;
}

// ---- App State ----

export interface AppState {
  // Dataset
  datasetAnalysis: DatasetAnalysis | null;

  // Structural Analysis (NEW)
  structuralAsymmetries: StructuralAsymmetry[];

  // Value Questions (NEW)
  valueQuestions: ValueQuestion[];

  // Scenarios
  scenarios: Scenario[];
  scenarioAutoMLResults: Record<string, AutoMLResult>;

  // Responses
  responses: SurveyResponse[];

  // Personal Mode (NEW)
  personalRecommendation: PersonalRecommendation | null;

  // Community Recommendation
  recommendation: CommunityRecommendation | null;

  // Actions
  setDatasetAnalysis: (analysis: DatasetAnalysis) => void;
  setStructuralAsymmetries: (asymmetries: StructuralAsymmetry[]) => void;
  setValueQuestions: (questions: ValueQuestion[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setScenarioAutoMLResults: (results: Record<string, AutoMLResult>) => void;
  addResponse: (response: SurveyResponse) => void;
  setPersonalRecommendation: (rec: PersonalRecommendation) => void;
  setRecommendation: (rec: CommunityRecommendation) => void;
  reset: () => void;
}
