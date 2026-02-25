// ============================================================
// VoxPop AI — Sample Kaggle Datasets for Demo
// ============================================================
// Representative rows from well-known fairness-in-ML datasets.
// These are realistic subsets — not the full Kaggle files.
// ============================================================

export interface SampleDataset {
  id: string;
  name: string;
  fileName: string;
  source: string;
  description: string;
  whyFairness: string;
  problemStatement: string;
  rows: Record<string, string | number | boolean>[];
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'compas',
    name: 'COMPAS Recidivism',
    fileName: 'compas_recidivism.csv',
    source: 'Kaggle / ProPublica',
    description:
      'Criminal recidivism risk scores used by US courts. ProPublica showed the algorithm was biased against Black defendants — the canonical fairness-in-ML case study.',
    whyFairness:
      'The COMPAS tool assigns risk scores that influence bail, sentencing, and parole decisions. Studies found Black defendants were nearly twice as likely to be falsely flagged as high-risk. This dataset is the gold standard for accuracy-vs-fairness tradeoff analysis.',
    problemStatement:
      'Predict whether a criminal defendant will re-offend within two years. The challenge: build a recidivism prediction model that is accurate enough to inform judicial decisions without systematically discriminating against Black defendants, who are historically flagged as high-risk at nearly double the false-positive rate of white defendants.',
    rows: [
      { age: 34, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'F', decile_score: 3, two_year_recid: 0 },
      { age: 24, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 1, priors_count: 4, charge_degree: 'F', decile_score: 8, two_year_recid: 1 },
      { age: 41, sex: 'Female', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 14, charge_degree: 'F', decile_score: 6, two_year_recid: 1 },
      { age: 39, sex: 'Male', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'M', decile_score: 1, two_year_recid: 0 },
      { age: 27, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 1, charge_degree: 'F', decile_score: 5, two_year_recid: 0 },
      { age: 23, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 2, charge_degree: 'F', decile_score: 7, two_year_recid: 1 },
      { age: 44, sex: 'Male', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'M', decile_score: 1, two_year_recid: 0 },
      { age: 30, sex: 'Female', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 3, charge_degree: 'F', decile_score: 6, two_year_recid: 1 },
      { age: 22, sex: 'Male', race: 'Hispanic', juv_fel_count: 1, juv_misd_count: 0, priors_count: 1, charge_degree: 'F', decile_score: 7, two_year_recid: 1 },
      { age: 36, sex: 'Female', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'M', decile_score: 2, two_year_recid: 0 },
      { age: 51, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 5, charge_degree: 'F', decile_score: 4, two_year_recid: 0 },
      { age: 28, sex: 'Male', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'M', decile_score: 2, two_year_recid: 0 },
      { age: 19, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 2, priors_count: 0, charge_degree: 'M', decile_score: 8, two_year_recid: 1 },
      { age: 33, sex: 'Female', race: 'Hispanic', juv_fel_count: 0, juv_misd_count: 0, priors_count: 1, charge_degree: 'M', decile_score: 3, two_year_recid: 0 },
      { age: 48, sex: 'Male', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 2, charge_degree: 'F', decile_score: 3, two_year_recid: 0 },
      { age: 26, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 6, charge_degree: 'F', decile_score: 9, two_year_recid: 1 },
      { age: 37, sex: 'Female', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 0, charge_degree: 'M', decile_score: 3, two_year_recid: 0 },
      { age: 20, sex: 'Male', race: 'Caucasian', juv_fel_count: 1, juv_misd_count: 0, priors_count: 0, charge_degree: 'F', decile_score: 4, two_year_recid: 1 },
      { age: 42, sex: 'Male', race: 'African-American', juv_fel_count: 0, juv_misd_count: 0, priors_count: 8, charge_degree: 'F', decile_score: 7, two_year_recid: 1 },
      { age: 31, sex: 'Female', race: 'Caucasian', juv_fel_count: 0, juv_misd_count: 0, priors_count: 1, charge_degree: 'M', decile_score: 2, two_year_recid: 0 },
    ],
  },
  {
    id: 'adult-income',
    name: 'Adult Census Income',
    fileName: 'adult_census_income.csv',
    source: 'Kaggle / UCI ML Repository',
    description:
      'Predict whether annual income exceeds $50K based on census data. The most widely used benchmark for algorithmic fairness research, with known gender and racial disparities.',
    whyFairness:
      'Models trained on this data consistently show that gender, race, and marital status strongly predict income — raising questions about whether using these features perpetuates historical wage gaps. A high-accuracy model may encode societal biases.',
    problemStatement:
      'Predict whether an individual earns more than $50K per year based on census attributes like education, occupation, and work hours. The challenge: historical wage data reflects systemic gender and racial pay gaps — a high-accuracy model risks encoding and perpetuating these disparities in automated hiring, lending, or benefit eligibility systems.',
    rows: [
      { age: 39, workclass: 'State-gov', education: 'Bachelors', education_num: 13, marital_status: 'Never-married', occupation: 'Adm-clerical', race: 'White', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '<=50K' },
      { age: 50, workclass: 'Self-emp-not-inc', education: 'Bachelors', education_num: 13, marital_status: 'Married-civ-spouse', occupation: 'Exec-managerial', race: 'White', sex: 'Male', hours_per_week: 13, native_country: 'United-States', income: '<=50K' },
      { age: 38, workclass: 'Private', education: 'HS-grad', education_num: 9, marital_status: 'Divorced', occupation: 'Handlers-cleaners', race: 'White', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '<=50K' },
      { age: 53, workclass: 'Private', education: 'Doctorate', education_num: 16, marital_status: 'Married-civ-spouse', occupation: 'Prof-specialty', race: 'Black', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '>50K' },
      { age: 28, workclass: 'Private', education: 'Bachelors', education_num: 13, marital_status: 'Married-civ-spouse', occupation: 'Prof-specialty', race: 'White', sex: 'Female', hours_per_week: 40, native_country: 'Cuba', income: '<=50K' },
      { age: 37, workclass: 'Private', education: 'Masters', education_num: 14, marital_status: 'Married-civ-spouse', occupation: 'Exec-managerial', race: 'White', sex: 'Female', hours_per_week: 40, native_country: 'United-States', income: '>50K' },
      { age: 49, workclass: 'Private', education: 'HS-grad', education_num: 9, marital_status: 'Married-spouse-absent', occupation: 'Other-service', race: 'Black', sex: 'Female', hours_per_week: 16, native_country: 'Jamaica', income: '<=50K' },
      { age: 52, workclass: 'Self-emp-not-inc', education: 'HS-grad', education_num: 9, marital_status: 'Married-civ-spouse', occupation: 'Exec-managerial', race: 'White', sex: 'Male', hours_per_week: 45, native_country: 'United-States', income: '>50K' },
      { age: 31, workclass: 'Private', education: 'Masters', education_num: 14, marital_status: 'Never-married', occupation: 'Prof-specialty', race: 'White', sex: 'Female', hours_per_week: 50, native_country: 'United-States', income: '>50K' },
      { age: 42, workclass: 'Private', education: 'Bachelors', education_num: 13, marital_status: 'Married-civ-spouse', occupation: 'Exec-managerial', race: 'Asian-Pac-Islander', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '>50K' },
      { age: 37, workclass: 'Private', education: 'Some-college', education_num: 10, marital_status: 'Married-civ-spouse', occupation: 'Craft-repair', race: 'White', sex: 'Male', hours_per_week: 80, native_country: 'United-States', income: '>50K' },
      { age: 30, workclass: 'State-gov', education: 'Bachelors', education_num: 13, marital_status: 'Married-civ-spouse', occupation: 'Prof-specialty', race: 'Asian-Pac-Islander', sex: 'Female', hours_per_week: 40, native_country: 'India', income: '>50K' },
      { age: 23, workclass: 'Private', education: 'Bachelors', education_num: 13, marital_status: 'Never-married', occupation: 'Adm-clerical', race: 'White', sex: 'Female', hours_per_week: 30, native_country: 'United-States', income: '<=50K' },
      { age: 32, workclass: 'Private', education: 'Assoc-acdm', education_num: 12, marital_status: 'Never-married', occupation: 'Sales', race: 'Black', sex: 'Male', hours_per_week: 50, native_country: 'United-States', income: '<=50K' },
      { age: 60, workclass: 'Self-emp-inc', education: 'HS-grad', education_num: 9, marital_status: 'Married-civ-spouse', occupation: 'Transport-moving', race: 'White', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '>50K' },
      { age: 22, workclass: 'Private', education: '11th', education_num: 7, marital_status: 'Never-married', occupation: 'Machine-op-inspct', race: 'White', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '<=50K' },
      { age: 44, workclass: 'Private', education: 'Masters', education_num: 14, marital_status: 'Divorced', occupation: 'Exec-managerial', race: 'White', sex: 'Female', hours_per_week: 40, native_country: 'United-States', income: '<=50K' },
      { age: 54, workclass: 'Private', education: 'Some-college', education_num: 10, marital_status: 'Married-civ-spouse', occupation: 'Machine-op-inspct', race: 'Amer-Indian-Eskimo', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '>50K' },
      { age: 35, workclass: 'Federal-gov', education: 'Bachelors', education_num: 13, marital_status: 'Married-civ-spouse', occupation: 'Adm-clerical', race: 'White', sex: 'Male', hours_per_week: 40, native_country: 'United-States', income: '<=50K' },
      { age: 46, workclass: 'Private', education: 'Prof-school', education_num: 15, marital_status: 'Married-civ-spouse', occupation: 'Prof-specialty', race: 'White', sex: 'Male', hours_per_week: 60, native_country: 'United-States', income: '>50K' },
    ],
  },
  {
    id: 'german-credit',
    name: 'German Credit Risk',
    fileName: 'german_credit_risk.csv',
    source: 'Kaggle / UCI ML Repository',
    description:
      'Classify bank customers as good or bad credit risk. Used in banking regulation and EU AI Act discussions about automated lending decisions.',
    whyFairness:
      'Lending models that maximize accuracy may systematically deny credit to young people, women, and foreign workers. The EU AI Act classifies credit scoring as "high-risk AI", requiring mandatory fairness audits before deployment.',
    problemStatement:
      'Classify bank loan applicants as good or bad credit risk based on financial history, employment, and demographics. The challenge: an accuracy-optimized model may systematically deny credit to younger applicants, women, and foreign workers — the EU AI Act now classifies credit scoring as high-risk AI requiring mandatory fairness audits.',
    rows: [
      { age: 67, sex: 'male', job: 2, housing: 'own', saving_accounts: 'NA', checking_account: 'little', credit_amount: 1169, duration: 6, purpose: 'radio/TV', risk: 'good' },
      { age: 22, sex: 'female', job: 2, housing: 'own', saving_accounts: 'little', checking_account: 'moderate', credit_amount: 5951, duration: 48, purpose: 'radio/TV', risk: 'bad' },
      { age: 49, sex: 'male', job: 1, housing: 'own', saving_accounts: 'little', checking_account: 'NA', credit_amount: 2096, duration: 12, purpose: 'education', risk: 'good' },
      { age: 45, sex: 'male', job: 2, housing: 'free', saving_accounts: 'little', checking_account: 'little', credit_amount: 7882, duration: 42, purpose: 'furniture/equipment', risk: 'good' },
      { age: 53, sex: 'male', job: 2, housing: 'free', saving_accounts: 'little', checking_account: 'little', credit_amount: 4870, duration: 24, purpose: 'car', risk: 'bad' },
      { age: 35, sex: 'male', job: 1, housing: 'rent', saving_accounts: 'NA', checking_account: 'NA', credit_amount: 9055, duration: 36, purpose: 'education', risk: 'good' },
      { age: 53, sex: 'male', job: 2, housing: 'own', saving_accounts: 'quite rich', checking_account: 'rich', credit_amount: 2835, duration: 24, purpose: 'furniture/equipment', risk: 'good' },
      { age: 35, sex: 'male', job: 3, housing: 'rent', saving_accounts: 'little', checking_account: 'moderate', credit_amount: 6948, duration: 36, purpose: 'car', risk: 'good' },
      { age: 61, sex: 'male', job: 1, housing: 'own', saving_accounts: 'rich', checking_account: 'NA', credit_amount: 3059, duration: 12, purpose: 'radio/TV', risk: 'good' },
      { age: 28, sex: 'male', job: 2, housing: 'own', saving_accounts: 'little', checking_account: 'moderate', credit_amount: 5234, duration: 30, purpose: 'car', risk: 'bad' },
      { age: 25, sex: 'female', job: 2, housing: 'rent', saving_accounts: 'little', checking_account: 'little', credit_amount: 1295, duration: 12, purpose: 'car', risk: 'bad' },
      { age: 24, sex: 'female', job: 2, housing: 'rent', saving_accounts: 'little', checking_account: 'NA', credit_amount: 4308, duration: 48, purpose: 'business', risk: 'good' },
      { age: 22, sex: 'female', job: 2, housing: 'own', saving_accounts: 'little', checking_account: 'moderate', credit_amount: 1567, duration: 12, purpose: 'education', risk: 'good' },
      { age: 60, sex: 'male', job: 3, housing: 'own', saving_accounts: 'quite rich', checking_account: 'NA', credit_amount: 1382, duration: 6, purpose: 'radio/TV', risk: 'good' },
      { age: 28, sex: 'female', job: 2, housing: 'rent', saving_accounts: 'little', checking_account: 'little', credit_amount: 2424, duration: 12, purpose: 'furniture/equipment', risk: 'bad' },
      { age: 32, sex: 'male', job: 1, housing: 'own', saving_accounts: 'moderate', checking_account: 'moderate', credit_amount: 3430, duration: 24, purpose: 'car', risk: 'good' },
      { age: 29, sex: 'male', job: 2, housing: 'own', saving_accounts: 'NA', checking_account: 'little', credit_amount: 2333, duration: 18, purpose: 'radio/TV', risk: 'good' },
      { age: 44, sex: 'male', job: 3, housing: 'free', saving_accounts: 'little', checking_account: 'moderate', credit_amount: 8072, duration: 36, purpose: 'business', risk: 'good' },
      { age: 23, sex: 'female', job: 2, housing: 'rent', saving_accounts: 'little', checking_account: 'NA', credit_amount: 3190, duration: 24, purpose: 'car', risk: 'bad' },
      { age: 40, sex: 'male', job: 2, housing: 'own', saving_accounts: 'moderate', checking_account: 'moderate', credit_amount: 7980, duration: 48, purpose: 'business', risk: 'good' },
    ],
  },
];
