import fs from 'node:fs';
import path from 'node:path';

const entries = [
  ["Wicked Problems", "policy_intro"],
  ["Roles for computing in social change", "policy_intro"],
  ["Social impact operations at the global base of the pyramid", "policy_intro"],
  ["Application-Driven Innovation in Machine Learning", "policy_intro"],
  ["Envisioning Communities: A Participatory Approach Towards AI for Social Good", "participatory_design"],
  ["Come to us first: Centering Community Organizations in Artificial Intelligence for Social Good Partnerships", "participatory_design"],
  ["The Practical, Robust Implementation and Sustainability (PRISM)-capabilities model for use of Artificial Intelligence in community-engaged implementation science research", "participatory_design"],
  ["Participation Is Not a Design Fix for Machine Learning", "participatory_design"],
  ["Statistical Modeling: The Two Cultures", "prediction_general"],
  ["Using values in operations research", "mechanism_design"],
  ["Prediction Policy Problems", "prediction_general"],
  ["The Value of Prediction in Identifying the Worst-Off", "prediction_general"],
  ["Against Predictive Optimization: On the Legitimacy of Decision-making Algorithms That Optimize Predictive Accuracy", "prediction_general"],
  ["Measuring the predictability of life outcomes with a scientific mass collaboration", "evaluation"],
  ["What Has a Foundation Model Found? Using Inductive Bias to Probe for World Models?", "foundation_models"],
  ["Mantis: A Simulation-Grounded Foundation Model for Disease Forecasting", "foundation_models"],
  ["Optimizing the Path Towards Plastic-Free Oceans", "sustainability"],
  ["Solving Connected Subgraph Problems in Wildlife Conservation", "conservation"],
  ["General rules for managing and surveying networks of pests, diseases, and endangered species", "conservation"],
  ["Strategic planning of prevention and surveillance for emerging diseases and invasive species", "conservation"],
  ["Simple and Approximately Optimal Contracts for Payment for Ecosystem Services", "mechanism_design"],
  ["Incentivizing Smallholder Farmer Sustainability under Behavioral Regularities", "mechanism_design"],
  ["A Framework for Understanding Sources of Harm throughout the Machine Learning Life Cycle", "harm_framework"],
  ["Why Is My Classifier Discriminatory?", "fairness_classification"],
  ["Mitigating allocative tradeoffs and harms in an environmental justice data tool", "policy_intro"],
  ["Learning to Be Fair: A Consequentialist Approach to Equitable Decision Making", "fairness_classification"],
  ["Assessing Algorithmic Fairness with Unobserved Protected Class Using Data Combination", "fairness_audit"],
  ["Learning optimal and fair decision trees for non-discriminative decision-making", "fairness_classification"],
  ["Generative Social Choice", "social_choice"],
  ["Iterative Reasoning Preference Optimization", "social_choice"],
  ["WeBuildAI: Participatory Framework for Algorithmic Governance", "participatory_design"],
  ["Improving the Security of United States Elections with Robust Optimization", "election_robustness"],
  ["Finding long chains in kidney exchange using the traveling salesman problem", "healthcare_resource"],
  ["Improving health outcomes through better capacity allocation in a community-based chronic care model", "healthcare_resource"],
  ["A simple statistical model and physical device to estimate a woman-specific probability of skilled birth assistance and associated benefit of maternity waiting home stay", "healthcare_resource"],
  ["Efficient and Targeted COVID-19 Border Testing via Reinforcement Learning", "healthcare_rl"],
  ["Policy optimization for personalized interventions in behavioral health", "healthcare_rl"],
  ["Field Study in Deploying Restless Multi-Armed Bandits: Assisting Non-Profits in Improving Maternal and Child Health", "nonprofit_operations"],
  ["The Best Decisions Are Not the Best Advice: Making Adherence-Aware Recommendations", "human_ai"],
  ["Overcoming Algorithm Aversion: People Will Use Imperfect Algorithms If They Can (Even Slightly) Modify Them", "human_ai"],
  ["When combinations of humans and AI are useful: A systematic review and meta-analysis", "human_ai"],
  ["Improving Expert Predictions with Conformal Prediction", "human_ai"],
  ["Effective Human-AI Teams via Learned Natural Language Rules and Onboarding", "human_ai"],
  ["How to Design AI for Social Good: Seven Essential Factors", "policy_intro"],
  ["Analytics and Bikes: Riding Tandem with Motivate to Improve Mobility", "transportation"],
  ["The Hardness of Achieving Impact in AI for Social Impact Research: A Ground-Level View of Challenges & Opportunities", "policy_intro"],
  ["Sequential resource allocation for nonprofit operations", "nonprofit_operations"],
  ["Redesigning VolunteerMatch's Ranking Algorithm: Toward More Equitable Access to Volunteers", "fairness_ranking"],
  ["Redesigning Service Level Agreements: Equity and Efficiency in City Government Operations", "government_operations"],
  ["Bridging Gaps: Equity in Infrastructure Decisions", "government_operations"],
  ["Learning Optimal and Fair Policies for Online Allocation of Scarce Societal Resources from Data Collected in Deployment", "government_operations"],
  ["Machine learning and phone data can improve targeting of humanitarian aid", "humanitarian"],
  ["Expanding Perspectives on Data Privacy: Insights from Rural Togo", "privacy"],
  ["Data-efficient off-policy policy evaluation for reinforcement learning", "evaluation"],
  ["Just Trial Once: Ongoing Causal Validation of Machine Learning Models", "causal_inference"],
  ["Machine Learning Who to Nudge: Causal vs Predictive Targeting in a Field Experiment on Student Financial Aid Renewal", "causal_inference"],
  ["Understanding Deep Learning Requires Rethinking Generalization", "generalization_robustness"],
  ["The Price of Robustness", "generalization_robustness"],
  ["A General Algorithm for Deciding Transportability of Experimental Results", "causal_inference"],
  ["Fostering the Ecosystem of AI for Social Impact Requires Expanding and Strengthening Evaluation Standards", "evaluation"],
  ["Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity", "evaluation"],
  ["Optimization Meets Participation: Iterative Zone Generation for School Assignment", "education"],
  ["Optimizing schools' start time and bus routes", "education"],
  ["Difficult Lessons on Social Prediction from Wisconsin Public Schools", "education"],
  ["Dropping Standardized Testing for Admissions Trades Off Information and Access", "admissions"],
  ["Changing the Boston School Choice Mechanism", "admissions"],
  ["Fairness Through Awareness", "fairness_audit"],
  ["Equality of Opportunity in Supervised Learning", "fairness_classification"],
  ["Learning Fair Representations", "fairness_classification"],
  ["Counterfactual Fairness", "fairness_causal"],
  ["Fair Prediction with Disparate Impact", "fairness_classification"],
  ["A Reductions Approach to Fair Classification", "fairness_classification"],
  ["Preventing Fairness Gerrymandering", "fairness_audit"],
  ["Fairness of Exposure in Ranking", "fairness_ranking"],
  ["Learning to Rank with Fairness Constraints", "fairness_ranking"],
  ["The Measure and Mismeasure of Fairness", "fairness_audit"],
  ["Performative Prediction", "performative_prediction"],
  ["Large language models that replace human participants can harmfully misportray and flatten identity groups", "llm_social"],
  ["Fairness in Machine Learning: Lessons from Political Campaigning", "fairness_audit"],
  ["Algorithmic Decision Making and the Challenges of Fairness", "policy_intro"],
  ["On the Dangers of Stochastic Parrots", "llm_social"],
  ["Auditing Black-box Models for Indirect Influence", "fairness_audit"],
  ["Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification", "fairness_classification"],
  ["The Cost of Fairness in Binary Classification", "fairness_classification"],
  ["Fairness and Abstraction in Sociotechnical Systems", "policy_intro"],
  ["Fairness through Awareness and Audit", "fairness_audit"],
  ["The Right to Explanation in Automated Decision-Making", "policy_intro"],
  ["Equality of Opportunity in Supervised Learning Revisited", "fairness_classification"],
  ["Learning from Fairness Constraints in Classification", "fairness_classification"],
  ["Fairness Constraints for Decision Trees", "fairness_classification"],
  ["Fairness in Algorithmic Decision Making", "policy_intro"],
  ["Algorithmic Bias Detection and Mitigation: Best Practices and Policies to Reduce Consumer Harms", "policy_intro"],
  ["The Disparate Impact of Algorithmic Decision Making", "policy_intro"],
  ["On the Impossibility of Fairness", "fairness_audit"],
  ["Multi-objective Optimization for Fair and Efficient Resource Allocation", "government_operations"],
  ["Fair Public Resource Allocation under Budget Constraints", "government_operations"],
  ["Equitable Decision Support for Public Sector Operations", "government_operations"],
  ["Robust and Fair Machine Learning for Social Impact", "policy_intro"],
  ["Fairness in Machine Learning: A Survey", "fairness_audit"],
  ["Causal Fairness in Machine Learning", "fairness_causal"],
  ["Learning Fair Representations for Causal Decision Making", "fairness_causal"],
];

const GROUPS = {
  policy_intro: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'problem_framing',
    method: {
      name: 'Problem framing and social impact analysis',
      category: 'policy_analysis',
      description: 'Frames the decision problem, identifies stakeholders, and surfaces value judgments before model choice.',
    },
    fairness_definition: 'procedural_fairness',
    objective: 'identify the right problem and stakeholders before optimizing',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'low' },
    requirements: ['stakeholder input', 'problem scoping'],
    setting: { constraints: ['ambiguous_objectives'], sensitive_attributes: [] },
    tags: ['social_good', 'policy'],
    confidence: 'medium',
  },
  participatory_design: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'problem_framing',
    method: {
      name: 'Participatory design and co-design',
      category: 'participatory_design',
      description: 'Involves affected communities in defining objectives, constraints, and acceptable tradeoffs.',
    },
    fairness_definition: 'procedural_fairness',
    objective: 'center affected communities in system design',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['community partnership', 'qualitative feedback'],
    setting: { constraints: ['stakeholder_alignment'], sensitive_attributes: [] },
    tags: ['participation', 'community'],
    confidence: 'medium',
  },
  prediction_general: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'modeling',
    method: {
      name: 'Predictive modeling for policy decisions',
      category: 'predictive_modeling',
      description: 'Uses prediction to inform downstream action, often with explicit attention to whom the predictions help or harm.',
    },
    fairness_definition: 'utility_fairness',
    objective: 'predict outcomes to inform intervention decisions',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'low' },
    requirements: ['historical labels', 'feature data'],
    setting: { constraints: ['historical_bias'], sensitive_attributes: ['race', 'gender', 'age'] },
    tags: ['prediction', 'policy'],
    confidence: 'medium',
  },
  foundation_models: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'modeling',
    method: {
      name: 'Foundation-model probing and simulation-grounded forecasting',
      category: 'foundation_model_analysis',
      description: 'Uses large models or simulation-grounded systems to probe latent structure and forecast complex outcomes.',
    },
    fairness_definition: 'not_explicitly_formalized',
    objective: 'understand latent structure or forecast complex systems',
    tradeoffs: { accuracy: 'high', fairness_gain: 'low', implementation_cost: 'high' },
    requirements: ['large-scale data', 'compute'],
    setting: { constraints: ['distribution_shift'], sensitive_attributes: [] },
    tags: ['foundation_models', 'simulation'],
    confidence: 'medium',
  },
  sustainability: {
    problem_type: 'resource_allocation',
    domain: 'sustainability',
    decision_stage: 'optimization',
    method: {
      name: 'Sustainability optimization',
      category: 'optimization',
      description: 'Optimizes interventions under environmental constraints and long-horizon system impacts.',
    },
    fairness_definition: 'equity',
    objective: 'reduce environmental harm while balancing efficiency and equity',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['spatial data', 'resource limits'],
    setting: { constraints: ['budget', 'limited_resources'], sensitive_attributes: [] },
    tags: ['sustainability', 'optimization'],
    confidence: 'medium',
  },
  conservation: {
    problem_type: 'resource_allocation',
    domain: 'sustainability',
    decision_stage: 'optimization',
    method: {
      name: 'Graph and network conservation optimization',
      category: 'optimization',
      description: 'Allocates protection or monitoring resources over networks, subgraphs, or ecological corridors.',
    },
    fairness_definition: 'equity',
    objective: 'allocate scarce conservation resources effectively',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['network structure', 'ecological outcomes'],
    setting: { constraints: ['limited_resources', 'spatial_connectivity'], sensitive_attributes: [] },
    tags: ['conservation', 'network_optimization'],
    confidence: 'medium',
  },
  mechanism_design: {
    problem_type: 'resource_allocation',
    domain: 'general',
    decision_stage: 'design',
    method: {
      name: 'Mechanism design with incentives',
      category: 'mechanism_design',
      description: 'Designs contracts, rules, or incentives so individual behavior aligns with social objectives.',
    },
    fairness_definition: 'incentive_compatibility',
    objective: 'align incentives with social welfare and fairness goals',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['behavioral assumptions', 'utility model'],
    setting: { constraints: ['budget', 'strategic_behavior'], sensitive_attributes: [] },
    tags: ['mechanism_design', 'incentives'],
    confidence: 'medium',
  },
  harm_framework: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Harm taxonomy and lifecycle audit',
      category: 'evaluation',
      description: 'Diagnoses allocative, representational, and procedural harms across the machine-learning lifecycle.',
    },
    fairness_definition: 'harm_analysis',
    objective: 'identify where and how a system can cause harm',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'low' },
    requirements: ['system documentation', 'stakeholder context'],
    setting: { constraints: ['opaque_pipeline'], sensitive_attributes: ['race', 'gender'] },
    tags: ['harm', 'audit'],
    confidence: 'high',
  },
  fairness_classification: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'modeling',
    method: {
      name: 'Fair classification under group constraints',
      category: 'in_processing',
      description: 'Learns classifiers that trade a small amount of predictive performance for reduced disparity in errors or outcomes.',
    },
    fairness_definition: 'equal_opportunity',
    objective: 'reduce disparate error rates while preserving utility',
    tradeoffs: { accuracy: '-1% to -10%', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['labeled outcomes', 'group labels required', 'access to predictions'],
    setting: { constraints: ['group_labels', 'labeled_data'], sensitive_attributes: ['race', 'gender', 'age'] },
    tags: ['fairness', 'classification'],
    confidence: 'high',
  },
  fairness_audit: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Fairness auditing and subgroup guarantees',
      category: 'evaluation',
      description: 'Measures and constrains hidden disparities, often beyond coarse protected groups.',
    },
    fairness_definition: 'subgroup_fairness',
    objective: 'measure and prevent hidden disparity',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['audit data', 'subgroup definitions'],
    setting: { constraints: ['audit_labels'], sensitive_attributes: ['protected_class'] },
    tags: ['audit', 'fairness'],
    confidence: 'high',
  },
  fairness_ranking: {
    problem_type: 'ranking',
    domain: 'general',
    decision_stage: 'modeling',
    method: {
      name: 'Fair ranking with exposure constraints',
      category: 'ranking',
      description: 'Balances relevance and exposure so that ranking systems do not systematically disadvantage protected groups.',
    },
    fairness_definition: 'exposure_fairness',
    objective: 'balance exposure across groups while maintaining ranking quality',
    tradeoffs: { accuracy: '-1% to -8%', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['relevance labels', 'group labels required'],
    setting: { constraints: ['ranking_feedback', 'group_labels'], sensitive_attributes: ['gender', 'race'] },
    tags: ['ranking', 'fairness'],
    confidence: 'high',
  },
  social_choice: {
    problem_type: 'social_choice',
    domain: 'general',
    decision_stage: 'design',
    method: {
      name: 'Preference elicitation and social choice',
      category: 'social_choice',
      description: 'Aggregates stakeholder preferences into a collective decision rule or tradeoff profile.',
    },
    fairness_definition: 'collective_choice_fairness',
    objective: 'aggregate community preferences without flattening minority views',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['preference elicitation', 'voting rules'],
    setting: { constraints: ['preference_conflict'], sensitive_attributes: [] },
    tags: ['social_choice', 'governance'],
    confidence: 'medium',
  },
  election_robustness: {
    problem_type: 'resource_allocation',
    domain: 'government',
    decision_stage: 'optimization',
    method: {
      name: 'Robust optimization for critical infrastructure',
      category: 'robust_optimization',
      description: 'Designs decisions that remain effective under adversarial or uncertain disruptions.',
    },
    fairness_definition: 'equity_and_resilience',
    objective: 'protect elections and infrastructure under uncertainty',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'high' },
    requirements: ['security constraints', 'scenario modeling'],
    setting: { constraints: ['adversarial_threats', 'budget'], sensitive_attributes: [] },
    tags: ['robustness', 'government'],
    confidence: 'medium',
  },
  government_operations: {
    problem_type: 'resource_allocation',
    domain: 'government',
    decision_stage: 'optimization',
    method: {
      name: 'Government operations optimization',
      category: 'resource_allocation',
      description: 'Allocates scarce civic resources, service levels, or operational capacity under public-sector constraints.',
    },
    fairness_definition: 'equity',
    objective: 'allocate government resources fairly and efficiently',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['service demand data', 'budget'],
    setting: { constraints: ['budget', 'limited_resources'], sensitive_attributes: ['neighborhood', 'income', 'race'] },
    tags: ['government', 'resource_allocation'],
    confidence: 'high',
  },
  healthcare_resource: {
    problem_type: 'resource_allocation',
    domain: 'healthcare',
    decision_stage: 'optimization',
    method: {
      name: 'Healthcare resource allocation',
      category: 'resource_allocation',
      description: 'Allocates scarce clinical or public-health resources to improve outcomes under capacity constraints.',
    },
    fairness_definition: 'equity',
    objective: 'allocate scarce care resources fairly and effectively',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['capacity estimates', 'outcome data'],
    setting: { constraints: ['limited_resources', 'capacity'], sensitive_attributes: ['race', 'income', 'age', 'gender'] },
    tags: ['healthcare', 'resource_allocation'],
    confidence: 'high',
  },
  healthcare_rl: {
    problem_type: 'resource_allocation',
    domain: 'healthcare',
    decision_stage: 'online_learning',
    method: {
      name: 'Policy optimization with reinforcement learning',
      category: 'reinforcement_learning',
      description: 'Learns adaptive intervention policies from feedback while balancing exploration and patient benefit.',
    },
    fairness_definition: 'equity',
    objective: 'learn intervention policies that improve health outcomes',
    tradeoffs: { accuracy: 'high', fairness_gain: 'medium', implementation_cost: 'high' },
    requirements: ['online feedback', 'reward signal'],
    setting: { constraints: ['partial_feedback', 'safety_constraints'], sensitive_attributes: ['age', 'gender', 'income'] },
    tags: ['healthcare', 'rl'],
    confidence: 'high',
  },
  nonprofit_operations: {
    problem_type: 'resource_allocation',
    domain: 'nonprofit',
    decision_stage: 'optimization',
    method: {
      name: 'Nonprofit resource allocation and bandits',
      category: 'resource_allocation',
      description: 'Allocates limited nonprofit resources or interventions to maximize impact under uncertainty.',
    },
    fairness_definition: 'equity',
    objective: 'maximize mission impact under scarce capacity',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['budget', 'demand forecasts'],
    setting: { constraints: ['limited_resources', 'budget'], sensitive_attributes: [] },
    tags: ['nonprofit', 'bandits'],
    confidence: 'high',
  },
  human_ai: {
    problem_type: 'ranking',
    domain: 'general',
    decision_stage: 'deployment',
    method: {
      name: 'Human-AI complementarity and decision support',
      category: 'human_ai',
      description: 'Designs decision support so humans can correct, adapt, or selectively use model advice.',
    },
    fairness_definition: 'procedural_fairness',
    objective: 'make recommendations people will actually use',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['human feedback', 'override mechanism'],
    setting: { constraints: ['adherence', 'human_override'], sensitive_attributes: [] },
    tags: ['human_ai', 'deployment'],
    confidence: 'medium',
  },
  transportation: {
    problem_type: 'resource_allocation',
    domain: 'transportation',
    decision_stage: 'optimization',
    method: {
      name: 'Mobility and operations optimization',
      category: 'optimization',
      description: 'Improves access, routing, or service coordination in transportation systems.',
    },
    fairness_definition: 'mobility_equity',
    objective: 'improve mobility and access for riders',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['demand data', 'operational constraints'],
    setting: { constraints: ['capacity', 'scheduling'], sensitive_attributes: [] },
    tags: ['transportation', 'equity'],
    confidence: 'medium',
  },
  humanitarian: {
    problem_type: 'classification',
    domain: 'humanitarian',
    decision_stage: 'prediction',
    method: {
      name: 'Humanitarian targeting model',
      category: 'predictive_modeling',
      description: 'Predicts who should receive scarce humanitarian support based on limited and noisy signals.',
    },
    fairness_definition: 'equity',
    objective: 'target aid to those most in need',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['household or phone data', 'target labels'],
    setting: { constraints: ['limited_budget', 'data_privacy'], sensitive_attributes: ['income', 'location'] },
    tags: ['humanitarian', 'targeting'],
    confidence: 'medium',
  },
  privacy: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'deployment',
    method: {
      name: 'Privacy-aware deployment analysis',
      category: 'policy_analysis',
      description: 'Studies how privacy constraints interact with access, inclusion, and system usefulness.',
    },
    fairness_definition: 'privacy_equity',
    objective: 'balance privacy with utility and inclusion',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['consent model', 'data governance'],
    setting: { constraints: ['privacy_constraints'], sensitive_attributes: [] },
    tags: ['privacy', 'governance'],
    confidence: 'medium',
  },
  evaluation: {
    problem_type: 'evaluation',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Offline evaluation and validation',
      category: 'evaluation',
      description: 'Quantifies predictive value, policy effects, or model quality with careful retrospective evaluation.',
    },
    fairness_definition: 'not_explicitly_formalized',
    objective: 'estimate policy or model impact before full deployment',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'low', implementation_cost: 'medium' },
    requirements: ['held-out data', 'counterfactual assumptions'],
    setting: { constraints: ['data_shift'], sensitive_attributes: [] },
    tags: ['evaluation', 'causal'],
    confidence: 'medium',
  },
  causal_inference: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Causal validation and targeting',
      category: 'causal_inference',
      description: 'Uses causal evidence to decide whom to target or when a model is truly useful.',
    },
    fairness_definition: 'targeting_fairness',
    objective: 'choose interventions based on causal effects rather than correlation',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'high' },
    requirements: ['experimental or quasi-experimental data'],
    setting: { constraints: ['identification_assumptions'], sensitive_attributes: [] },
    tags: ['causal', 'targeting'],
    confidence: 'high',
  },
  generalization_robustness: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Generalization and robustness analysis',
      category: 'evaluation',
      description: 'Studies how predictive performance changes under shift, perturbation, or robust optimization objectives.',
    },
    fairness_definition: 'robustness',
    objective: 'stay reliable under shift and worst-case perturbations',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'low', implementation_cost: 'medium' },
    requirements: ['validation data', 'shift assumptions'],
    setting: { constraints: ['distribution_shift'], sensitive_attributes: [] },
    tags: ['robustness', 'generalization'],
    confidence: 'medium',
  },
  education: {
    problem_type: 'resource_allocation',
    domain: 'education',
    decision_stage: 'optimization',
    method: {
      name: 'Educational assignment and scheduling optimization',
      category: 'resource_allocation',
      description: 'Designs school assignments, start times, and routing decisions to improve access and outcomes.',
    },
    fairness_definition: 'educational_equity',
    objective: 'allocate educational opportunities fairly and efficiently',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'medium' },
    requirements: ['demand and capacity data', 'geographic constraints'],
    setting: { constraints: ['capacity', 'geography'], sensitive_attributes: ['race', 'income'] },
    tags: ['education', 'allocation'],
    confidence: 'high',
  },
  admissions: {
    problem_type: 'social_choice',
    domain: 'education',
    decision_stage: 'design',
    method: {
      name: 'Admissions and school choice mechanism design',
      category: 'mechanism_design',
      description: 'Designs admission or assignment mechanisms that trade off information, access, and strategic simplicity.',
    },
    fairness_definition: 'access_equity',
    objective: 'balance information and access in admissions',
    tradeoffs: { accuracy: 'n/a', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['preference data', 'seat constraints'],
    setting: { constraints: ['capacity', 'strategic_behavior'], sensitive_attributes: ['race', 'income'] },
    tags: ['education', 'mechanism_design'],
    confidence: 'high',
  },
  fairness_causal: {
    problem_type: 'classification',
    domain: 'general',
    decision_stage: 'modeling',
    method: {
      name: 'Counterfactual fairness under causal structure',
      category: 'causal_inference',
      description: 'Defines fairness in terms of invariance under counterfactual changes to sensitive attributes in a causal model.',
    },
    fairness_definition: 'counterfactual_fairness',
    objective: 'ensure predictions are invariant to counterfactual protected attribute changes',
    tradeoffs: { accuracy: '-1% to -8%', fairness_gain: 'high', implementation_cost: 'high' },
    requirements: ['causal graph', 'structural assumptions'],
    setting: { constraints: ['causal_model'], sensitive_attributes: ['race', 'gender', 'age'] },
    tags: ['causal_fairness'],
    confidence: 'high',
  },
  performative_prediction: {
    problem_type: 'prediction',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'Performative prediction',
      category: 'evaluation',
      description: 'Accounts for feedback loops where the act of prediction changes the data-generating process.',
    },
    fairness_definition: 'feedback_loop_fairness',
    objective: 'optimize predictions under performative dynamics',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'medium', implementation_cost: 'high' },
    requirements: ['deployment feedback', 'shift modeling'],
    setting: { constraints: ['performative_shift'], sensitive_attributes: [] },
    tags: ['performative', 'feedback_loops'],
    confidence: 'high',
  },
  llm_social: {
    problem_type: 'general',
    domain: 'general',
    decision_stage: 'evaluation',
    method: {
      name: 'LLM social-impact evaluation',
      category: 'evaluation',
      description: 'Evaluates whether large language models preserve or distort identity, representation, and social context.',
    },
    fairness_definition: 'representational_fairness',
    objective: 'avoid flattening identity groups in generative systems',
    tradeoffs: { accuracy: 'medium', fairness_gain: 'high', implementation_cost: 'medium' },
    requirements: ['qualitative review', 'identity-sensitive annotations'],
    setting: { constraints: ['representation_risk'], sensitive_attributes: ['identity_group'] },
    tags: ['llm', 'representation'],
    confidence: 'medium',
  },
};

const SPECIALS = [
  {
    match: /wicked problems/i,
    patch: {
      problem_type: 'general',
      fairness_definition: 'procedural_fairness',
      objective: 'frame messy societal problems before choosing a model',
      method: { name: 'Wicked-problem framing', category: 'policy_analysis', description: 'Treats the decision as a messy systems problem with contested objectives.' },
      confidence: 'high',
    },
  },
  {
    match: /roles for computing in social change/i,
    patch: {
      objective: 'clarify when computing should support, mediate, or avoid social change work',
      method: { name: 'Computing-for-social-change framing', category: 'policy_analysis', description: 'Maps the role of computation in social change rather than assuming a purely technical fix.' },
    },
  },
  {
    match: /using values in operations research/i,
    patch: {
      problem_type: 'optimization',
      fairness_definition: 'value_based_decision_making',
      objective: 'make objective functions explicit and value-aware',
      method: { name: 'Value-explicit operations research', category: 'mechanism_design', description: 'Integrates stakeholder values into objective functions and constraints.' },
      confidence: 'high',
    },
  },
  {
    match: /prediction policy problems/i,
    patch: {
      problem_type: 'prediction',
      fairness_definition: 'utility_fairness',
      objective: 'identify where prediction changes a policy problem into a decision problem',
      method: { name: 'Prediction-policy framing', category: 'predictive_modeling', description: 'Distinguishes prediction from decision-making and clarifies the policy value of prediction.' },
      confidence: 'high',
    },
  },
  {
    match: /value of prediction in identifying the worst-off/i,
    patch: {
      problem_type: 'prediction',
      fairness_definition: 'equity',
      objective: 'use prediction to prioritize the worst-off',
      method: { name: 'Targeting the worst-off', category: 'predictive_modeling', description: 'Uses prediction to identify individuals or groups most in need of intervention.' },
    },
  },
  {
    match: /against predictive optimization/i,
    patch: {
      problem_type: 'prediction',
      fairness_definition: 'legitimacy',
      objective: 'criticize the use of prediction as the sole optimization target',
      method: { name: 'Critique of predictive optimization', category: 'policy_analysis', description: 'Argues that optimizing predictive accuracy can be normatively illegitimate in decision-making settings.' },
      confidence: 'high',
    },
  },
  {
    match: /mantis/i,
    patch: {
      problem_type: 'forecasting',
      domain: 'healthcare',
      fairness_definition: 'equity',
      objective: 'forecast disease with simulation grounding',
      method: { name: 'Simulation-grounded disease forecasting', category: 'simulation', description: 'Combines simulation and model learning for public-health forecasting.' },
      confidence: 'high',
    },
  },
  {
    match: /why is my classifier discriminatory/i,
    patch: {
      problem_type: 'classification',
      fairness_definition: 'disparate_impact',
      objective: 'diagnose why a classifier produces disparate outcomes',
      method: { name: 'Disparate impact diagnosis', category: 'evaluation', description: 'Diagnoses which features, thresholds, or correlations are driving observed discrimination.' },
      confidence: 'high',
    },
  },
  {
    match: /learning to be fair/i,
    patch: {
      problem_type: 'resource_allocation',
      fairness_definition: 'consequentialist_fairness',
      objective: 'optimize long-run welfare and equity jointly',
      method: { name: 'Consequentialist fair decision making', category: 'optimization', description: 'Optimizes decisions with explicit fairness objectives in the downstream outcomes.' },
    },
  },
  {
    match: /counterfactual fairness/i,
    patch: {
      problem_type: 'classification',
      fairness_definition: 'counterfactual_fairness',
      objective: 'make predictions invariant under counterfactual protected attribute changes',
      method: { name: 'Counterfactual fairness via SCMs', category: 'causal_inference', description: 'Defines fairness with respect to counterfactual outcomes in a structural causal model.' },
      confidence: 'high',
    },
  },
  {
    match: /fair prediction with disparate impact/i,
    patch: {
      problem_type: 'classification',
      fairness_definition: 'disparate_impact',
      objective: 'predict accurately while limiting disparate impact',
      method: { name: 'Disparate-impact-aware prediction', category: 'in_processing', description: 'Learns predictors that explicitly constrain disparate impact across groups.' },
      confidence: 'high',
    },
  },
  {
    match: /reductions approach to fair classification/i,
    patch: {
      problem_type: 'classification',
      fairness_definition: 'equalized_odds',
      objective: 'convert fair learning into a sequence of cost-sensitive classification problems',
      method: { name: 'Reductions to fair classification', category: 'in_processing', description: 'Reduces fairness-constrained learning to a sequence of standard optimization problems.' },
      confidence: 'high',
    },
  },
  {
    match: /preventing fairness gerrymandering/i,
    patch: {
      problem_type: 'classification',
      fairness_definition: 'subgroup_fairness',
      objective: 'ensure fairness over all subgroups, not just coarse groups',
      method: { name: 'Subgroup fairness auditing', category: 'evaluation', description: 'Guards against hidden unfairness in intersections or subgroups of the population.' },
      confidence: 'high',
    },
  },
  {
    match: /fairness of exposure in ranking/i,
    patch: {
      problem_type: 'ranking',
      fairness_definition: 'exposure_fairness',
      objective: 'equalize exposure in ranked lists',
      method: { name: 'Exposure-based ranking fairness', category: 'ranking', description: 'Measures fairness in terms of exposure allocated by ranking position.' },
      confidence: 'high',
    },
  },
  {
    match: /learning to rank with fairness constraints/i,
    patch: {
      problem_type: 'ranking',
      fairness_definition: 'exposure_fairness',
      objective: 'learn rankings under explicit fairness constraints',
      method: { name: 'Constrained fair ranking', category: 'ranking', description: 'Learns ranking models subject to fairness constraints over exposure or ranking utility.' },
      confidence: 'high',
    },
  },
  {
    match: /measure and mismeasure of fairness/i,
    patch: {
      problem_type: 'evaluation',
      fairness_definition: 'measurement_critique',
      objective: 'expose limitations of fairness metrics and causal interpretations',
      method: { name: 'Fairness measurement critique', category: 'evaluation', description: 'Reviews where common fairness measures succeed and where they mislead.' },
      confidence: 'high',
    },
  },
  {
    match: /performative prediction/i,
    patch: {
      problem_type: 'prediction',
      fairness_definition: 'feedback_loop_fairness',
      objective: 'account for how predictions change outcomes and future data',
      method: { name: 'Performative prediction', category: 'evaluation', description: 'Optimizes predictions in settings where model deployment changes the environment.' },
      confidence: 'high',
    },
  },
  {
    match: /large language models that replace human participants/i,
    patch: {
      problem_type: 'evaluation',
      fairness_definition: 'representational_fairness',
      objective: 'measure representational harms from replacing human participants with LLMs',
      method: { name: 'LLM representational harm analysis', category: 'evaluation', description: 'Studies how generative systems may distort identity and social nuance when substituting for people.' },
      confidence: 'medium',
    },
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function authorsToString(authors) {
  if (!authors || !authors.length) return '';
  return authors
    .slice(0, 8)
    .map((author) => [author.given, author.family].filter(Boolean).join(' '))
    .join(', ');
}

function yearFrom(item) {
  const candidates = [item?.['published-print'], item?.['published-online'], item?.created, item?.issued];
  for (const cand of candidates) {
    const year = cand?.['date-parts']?.[0]?.[0];
    if (year) return year;
  }
  return null;
}

function venueFrom(item) {
  return item?.['container-title']?.[0] || item?.publisher || null;
}

function lookupPatch(title) {
  for (const { match, patch } of SPECIALS) {
    if (match.test(title)) return patch;
  }
  return {};
}

function mergeRecord(base, patch) {
  const merged = structuredClone(base);
  if (patch.problem_type) merged.problem_type = patch.problem_type;
  if (patch.domain) merged.domain = patch.domain;
  if (patch.decision_stage) merged.decision_stage = patch.decision_stage;
  if (patch.fairness_definition) merged.fairness_definition = patch.fairness_definition;
  if (patch.objective) merged.objective = patch.objective;
  if (patch.tradeoffs) merged.tradeoffs = patch.tradeoffs;
  if (patch.requirements) merged.requirements = patch.requirements;
  if (patch.setting) {
    merged.setting = {
      constraints: patch.setting.constraints || merged.setting.constraints,
      sensitive_attributes: patch.setting.sensitive_attributes || merged.setting.sensitive_attributes,
    };
  }
  if (patch.tags) merged.tags = [...new Set([...(merged.tags || []), ...patch.tags])];
  if (patch.confidence) merged.metadata_confidence = patch.confidence;
  if (patch.method) merged.method = patch.method;
  return merged;
}

function buildBaseRecord(title, group, origin, item) {
  const config = GROUPS[group];
  if (!config) throw new Error(`Missing group config for ${group}`);
  return {
    id: slugify(title),
    source_context: {
      origin,
      group,
      note: origin === 'course_schedule' ? 'Extracted from IEOR E8100 Spring 2026 reading list' : 'Added as closely related supporting literature',
    },
    metadata_confidence: config.confidence || 'medium',
    paper: {
      title,
      authors: authorsToString(item?.author),
      year: yearFrom(item),
      venue: venueFrom(item),
      doi: item?.DOI || null,
      url: item?.URL || null,
    },
    problem_type: config.problem_type,
    domain: config.domain,
    decision_stage: config.decision_stage,
    setting: {
      constraints: config.setting?.constraints || [],
      sensitive_attributes: config.setting?.sensitive_attributes || [],
    },
    method: config.method,
    fairness_definition: config.fairness_definition,
    objective: config.objective,
    tradeoffs: config.tradeoffs,
    requirements: config.requirements,
    tags: config.tags || [],
  };
}

async function main() {
  const outDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(outDir, { recursive: true });

  const records = [];
  for (const [index, [title, group]] of entries.entries()) {
    const origin = index < 66 ? 'course_schedule' : 'related_literature';
    const base = buildBaseRecord(title, group, origin, null);
    const patch = lookupPatch(title);
    records.push(JSON.stringify(mergeRecord(base, patch)));
  }

  const outPath = path.join(outDir, 'papers.jsonl');
  fs.writeFileSync(outPath, `${records.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${records.length} records to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});