// ============================================================
// VoxPop AI — Sample Kaggle Datasets
// ============================================================
// ~250 rows each generated via seeded RNG to mirror real-world
// bias patterns from well-known fairness-in-ML datasets.
//
// Based on:
//   COMPAS Recidivism    – Kaggle / ProPublica
//   Adult Census Income  – Kaggle / UCI ML Repository
//   German Credit Risk   – Kaggle / UCI ML Repository
// ============================================================

export interface SampleDataset {
  id: string;
  name: string;
  fileName: string;
  source: string;
  kaggleUrl: string;
  description: string;
  whyFairness: string;
  problemStatement: string;
  domain: string;
  rows: Record<string, string | number | boolean>[];
  columns: string[];
  targetColumn: string;
  sensitiveAttributes: string[];
}

// ---- Seeded helpers ----

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length)];
}

function rInt(min: number, max: number, r: number): number {
  return Math.floor(min + r * (max - min + 1));
}

// ---- COMPAS Recidivism (250 rows) ----

function buildCompasRows(): Record<string, string | number | boolean>[] {
  const rand = seeded(1001);
  const races = ['African-American', 'African-American', 'African-American', 'Caucasian', 'Caucasian', 'Hispanic', 'Other'];
  const sexes = ['Male', 'Male', 'Male', 'Female'];
  const degrees = ['F', 'M'];
  const rows: Record<string, string | number | boolean>[] = [];

  for (let i = 0; i < 250; i++) {
    const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
    const r5 = rand(), r6 = rand(), r7 = rand(), r8 = rand();
    const race = pick(races, r1);
    const sex = pick(sexes, r2);
    const age = rInt(18, 65, r3);
    const priors = age < 30 ? rInt(0, 8, r4) : rInt(0, 4, r4);
    const juvFel = r5 < 0.08 ? rInt(1, 2, r5) : 0;
    const juvMisd = r6 < 0.15 ? rInt(1, 3, r6) : 0;
    const degree = pick(degrees, r7);
    let baseScore = Math.min(10, Math.max(1, Math.round(
      (priors * 0.8) + (juvFel * 1.5) + (juvMisd * 0.5) + ((65 - age) / 15) + (race === 'African-American' ? 1.5 : 0)
    )));
    baseScore = Math.max(1, Math.min(10, baseScore + rInt(-1, 1, r8)));
    const recid = baseScore >= 6 ? (r8 > 0.3 ? 1 : 0) : (r8 > 0.75 ? 1 : 0);

    rows.push({
      age, sex, race,
      juv_fel_count: juvFel, juv_misd_count: juvMisd,
      priors_count: priors, charge_degree: degree,
      decile_score: baseScore, two_year_recid: recid,
    });
  }
  return rows;
}

// ---- Adult Census Income (250 rows) ----

function buildAdultRows(): Record<string, string | number | boolean>[] {
  const rand = seeded(2002);
  const workclasses = ['Private', 'Private', 'Private', 'Self-emp-not-inc', 'State-gov', 'Federal-gov', 'Local-gov', 'Self-emp-inc'];
  const educations = ['HS-grad', 'HS-grad', 'Some-college', 'Bachelors', 'Bachelors', 'Masters', 'Assoc-acdm', 'Doctorate', 'Prof-school', '11th', '9th'];
  const eduNums: Record<string, number> = {
    '9th': 5, '11th': 7, 'HS-grad': 9, 'Some-college': 10, 'Assoc-acdm': 12,
    'Bachelors': 13, 'Masters': 14, 'Prof-school': 15, 'Doctorate': 16,
  };
  const maritals = ['Married-civ-spouse', 'Married-civ-spouse', 'Never-married', 'Never-married', 'Divorced', 'Separated', 'Widowed'];
  const occupations = ['Exec-managerial', 'Prof-specialty', 'Sales', 'Craft-repair', 'Adm-clerical', 'Other-service', 'Machine-op-inspct', 'Transport-moving', 'Handlers-cleaners', 'Tech-support', 'Farming-fishing'];
  const racesA = ['White', 'White', 'White', 'Black', 'Asian-Pac-Islander', 'Amer-Indian-Eskimo'];
  const sexesA = ['Male', 'Male', 'Female'];
  const countries = ['United-States', 'United-States', 'United-States', 'Mexico', 'India', 'Cuba', 'Jamaica', 'Philippines', 'Germany'];

  const rows: Record<string, string | number | boolean>[] = [];

  for (let i = 0; i < 250; i++) {
    const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
    const r5 = rand(), r6 = rand(), r7 = rand(), r8 = rand(), r9 = rand();
    const sex = pick(sexesA, r1);
    const race = pick(racesA, r2);
    const education = pick(educations, r3);
    const eduNum = eduNums[education] || 9;
    const age = rInt(18, 70, r4);
    const marital = pick(maritals, r5);
    const occupation = pick(occupations, r6);
    const workclass = pick(workclasses, r7);
    const country = pick(countries, r8);
    const hours = rInt(10, 80, r9);
    const incomeScore =
      (eduNum - 9) * 0.15 +
      (sex === 'Male' ? 0.12 : 0) +
      (marital === 'Married-civ-spouse' ? 0.15 : 0) +
      (age > 35 ? 0.1 : 0) +
      (hours > 40 ? 0.08 : 0) +
      (race === 'White' ? 0.05 : 0);
    const income = (incomeScore + (rand() * 0.3 - 0.15)) > 0.35 ? '>50K' : '<=50K';

    rows.push({
      age, workclass, education, education_num: eduNum,
      marital_status: marital, occupation, race, sex,
      hours_per_week: hours, native_country: country, income,
    });
  }
  return rows;
}

// ---- German Credit Risk (250 rows) ----

function buildGermanRows(): Record<string, string | number | boolean>[] {
  const rand = seeded(3003);
  const sexesG = ['male', 'male', 'male', 'female'];
  const housings = ['own', 'own', 'rent', 'free'];
  const savings = ['little', 'little', 'moderate', 'quite rich', 'rich', 'NA'];
  const checkings = ['little', 'little', 'moderate', 'rich', 'NA', 'NA'];
  const purposes = ['car', 'car', 'radio/TV', 'furniture/equipment', 'education', 'business', 'repairs', 'domestic appliances'];
  const jobs = [0, 1, 2, 2, 2, 3];
  const durations = [6, 12, 12, 18, 24, 24, 36, 48, 60];

  const rows: Record<string, string | number | boolean>[] = [];

  for (let i = 0; i < 250; i++) {
    const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
    const r5 = rand(), r6 = rand(), r7 = rand(), r8 = rand(), r9 = rand();
    const sex = pick(sexesG, r1);
    const age = rInt(19, 75, r2);
    const job = pick(jobs, r3);
    const housing = pick(housings, r4);
    const saving = pick(savings, r5);
    const checking = pick(checkings, r6);
    const purpose = pick(purposes, r7);
    const duration = pick(durations, r8);
    const amount = rInt(250, 15000, r9);
    const riskScore =
      (age < 30 ? 0.2 : 0) +
      (sex === 'female' ? 0.1 : 0) +
      (amount > 5000 ? 0.15 : 0) +
      (duration > 24 ? 0.15 : 0) +
      (saving === 'NA' || checking === 'NA' ? 0.1 : 0) +
      (job <= 1 ? 0.1 : 0);
    const risk = (riskScore + (rand() * 0.3 - 0.15)) > 0.35 ? 'bad' : 'good';

    rows.push({
      age, sex, job, housing,
      saving_accounts: saving, checking_account: checking,
      credit_amount: amount, duration, purpose, risk,
    });
  }
  return rows;
}

// ---- Exported datasets ----

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'compas',
    name: 'COMPAS Recidivism',
    fileName: 'compas_recidivism.csv',
    source: 'ProPublica / Kaggle',
    kaggleUrl: 'https://www.kaggle.com/datasets/danofer/compass',
    domain: 'Criminal Justice',
    description:
      'Criminal recidivism risk scores used by US courts. ProPublica\'s 2016 investigation revealed the COMPAS algorithm was biased against Black defendants — the most cited fairness-in-ML case study.',
    whyFairness:
      'The COMPAS tool assigns risk scores that influence bail, sentencing, and parole decisions. ProPublica found Black defendants were nearly twice as likely to be falsely flagged as high-risk compared to white defendants with similar criminal histories.',
    problemStatement:
      'Predict whether a criminal defendant will re-offend within two years. The challenge: build a recidivism prediction model that is accurate enough to inform judicial decisions without systematically discriminating against Black defendants.',
    columns: ['age', 'sex', 'race', 'juv_fel_count', 'juv_misd_count', 'priors_count', 'charge_degree', 'decile_score', 'two_year_recid'],
    targetColumn: 'two_year_recid',
    sensitiveAttributes: ['race', 'sex'],
    rows: buildCompasRows(),
  },
  {
    id: 'adult-income',
    name: 'Adult Census Income',
    fileName: 'adult_census_income.csv',
    source: 'UCI ML Repository / Kaggle',
    kaggleUrl: 'https://www.kaggle.com/datasets/uciml/adult-census-income',
    domain: 'Economics',
    description:
      'Predict whether annual income exceeds $50K based on census data. Extracted from the 1994 Census Bureau database, this is the most widely used benchmark in algorithmic fairness research with 48,842 instances.',
    whyFairness:
      'Models trained on this data consistently show that gender, race, and marital status strongly predict income — raising critical questions about whether using these features perpetuates historical wage gaps rather than reflecting ability.',
    problemStatement:
      'Predict whether an individual earns more than $50K per year based on census attributes. The challenge: historical wage data reflects systemic gender and racial pay gaps — a high-accuracy model risks encoding and perpetuating these disparities.',
    columns: ['age', 'workclass', 'education', 'education_num', 'marital_status', 'occupation', 'race', 'sex', 'hours_per_week', 'native_country', 'income'],
    targetColumn: 'income',
    sensitiveAttributes: ['sex', 'race'],
    rows: buildAdultRows(),
  },
  {
    id: 'german-credit',
    name: 'German Credit Risk',
    fileName: 'german_credit_risk.csv',
    source: 'UCI ML Repository / Kaggle',
    kaggleUrl: 'https://www.kaggle.com/datasets/uciml/german-credit',
    domain: 'Finance',
    description:
      'Classify bank customers as good or bad credit risk based on 20 attributes. Created by Prof. Hans Hofmann, this dataset is central to EU AI Act discussions about high-risk AI in financial services.',
    whyFairness:
      'Lending models that maximize accuracy may systematically deny credit to young people, women, and foreign workers — groups that historically have less capital. The EU AI Act classifies credit scoring as "high-risk AI" requiring mandatory fairness audits.',
    problemStatement:
      'Classify bank loan applicants as good or bad credit risk. The challenge: an accuracy-optimized model may systematically deny credit to younger applicants, women, and foreign workers while appearing objective.',
    columns: ['age', 'sex', 'job', 'housing', 'saving_accounts', 'checking_account', 'credit_amount', 'duration', 'purpose', 'risk'],
    targetColumn: 'risk',
    sensitiveAttributes: ['sex', 'age'],
    rows: buildGermanRows(),
  },
];
