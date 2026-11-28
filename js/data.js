/* ============================================================================
   NuTex Inc. — Actionable Executive Dataset (300 Employees, Jan–Nov 2026)
   No abstract readiness scores, no jargon abbreviations.
   ============================================================================ */

window.NUTEX_DATA = (() => {
  const THRESHOLDS = { green: 95, yellow: 80 };

  const TARGETS = {
    weeklyPct: 75,          // Employees using AI weekly
    dailyPct: 45,           // Employees using AI 3+ days/week
    licenseActivePct: 85,   // Active share of paid licenses
    costPerActive: 42,      // €/month max target
    trainingPct: 80,        // Employees trained
    dataSourcesReady: 7,    // out of 9 needed data sources
    hoursSavedMo: 1500,
    costSavedMo: 58000,
    errorRateMax: 3.2       // % (before AI: 4.2%)
  };

  const KPI_INFO = {
    adoption:   { source: 'Tool Logs', updated: '2026-11-19', freq: 'Daily', text: 'Employees using at least one AI tool every week.' },
    licenses:   { source: 'Tool & Finance Logs', updated: '2026-11-19', freq: 'Daily', text: 'Paid licenses compared to active monthly users and cost per active user.' },
    training:   { source: 'Learning Platform', updated: '2026-11-18', freq: 'Weekly', text: 'Share of employees who completed core AI training.' },
    dataReady:  { source: 'IT Audit', updated: '2026-11-18', freq: 'Weekly', text: 'Data sources meeting all quality & security criteria.' },
    impact:     { source: 'Logs & Finance', updated: '2026-11-18', freq: 'Monthly', text: 'Estimated monthly hours & savings paired with measured process error rate.' },
    returnCalc: { source: 'Return model', updated: '2026-11-18', freq: 'Monthly', text: 'Return = time saved + quality + speed & revenue + cost avoided — net, each euro counted once. Soft facts (customer feedback, employee sentiment, compliance risk) are tracked separately, not in €. Details: open the tile → "How is return calculated?"' }
  };

  const ROLES = [
    { id: 'ceo',           name: 'Chris Turner',    title: 'CEO',           isCEO: true,  ownDepts: ['rd', 'marketing', 'sales', 'production', 'logistics', 'purchasing'] },
    { id: 'vp_rd',         name: 'Sarah Klein',     title: 'VP R&D',        isCEO: false, ownDepts: ['rd'] },
    { id: 'vp_commercial', name: 'Marcus Weber',    title: 'VP Commercial', isCEO: false, ownDepts: ['marketing', 'sales'] },
    { id: 'vp_production', name: 'Dr. Thomas Berg', title: 'VP Production', isCEO: false, ownDepts: ['production'] },
    { id: 'vp_logistics',  name: 'Julia Hoffmann',  title: 'VP Logistics',  isCEO: false, ownDepts: ['logistics'] },
    { id: 'vp_purchasing', name: 'Andreas Richter', title: 'VP Purchasing', isCEO: false, ownDepts: ['purchasing'] }
  ];

  const DEFAULT_RBAC = {
    ceo:           { allDepts: true, financials: true },
    vp_rd:         { allDepts: true, financials: false },
    vp_commercial: { allDepts: true, financials: false },
    vp_production: { allDepts: true, financials: false },
    vp_logistics:  { allDepts: true, financials: false },
    vp_purchasing: { allDepts: true, financials: false }
  };

  const TOOLS = [
    { id: 'm365',       name: 'M365 Copilot',       costPerSeat: 28 },
    { id: 'textilegpt', name: 'NuTex TextileGPT',   costPerSeat: 18 },
    { id: 'chatgpt',    name: 'ChatGPT Enterprise', costPerSeat: 55 },
    { id: 'supplyai',   name: 'CAD-AI & SupplyAI',  costPerSeat: 56 }
  ];

  // Monthly Timeframes: Nov 2026 back to Jan 2026 (no Q3)
  const TIMEFRAMES = {
    nov_2026: { label: 'Nov 2026', factor: 1.00, prevFactor: 0.93 },
    oct_2026: { label: 'Oct 2026', factor: 0.93, prevFactor: 0.87 },
    sep_2026: { label: 'Sep 2026', factor: 0.87, prevFactor: 0.79 },
    aug_2026: { label: 'Aug 2026', factor: 0.79, prevFactor: 0.72 },
    jul_2026: { label: 'Jul 2026', factor: 0.72, prevFactor: 0.64 },
    jun_2026: { label: 'Jun 2026', factor: 0.64, prevFactor: 0.55 },
    may_2026: { label: 'May 2026', factor: 0.55, prevFactor: 0.47 },
    apr_2026: { label: 'Apr 2026', factor: 0.47, prevFactor: 0.39 },
    mar_2026: { label: 'Mar 2026', factor: 0.39, prevFactor: 0.31 },
    feb_2026: { label: 'Feb 2026', factor: 0.31, prevFactor: 0.24 },
    jan_2026: { label: 'Jan 2026', factor: 0.24, prevFactor: 0.20 }
  };

  // 6 Departments = 300 Employees exact
  const DEPARTMENTS = [
    {
      id: 'rd', name: 'R&D', vp: 'Sarah Klein', employees: 45, targetUsers: 44, licensedUsers: 44, budgetShare: 0.32,
      dataSourcesReady: 1, dataSourcesTotal: 1,
      trainedEmployees: 40, weeklyUsers: 38, dailyUsers: 26, openRequests: 0,
      hoursSavedMo: 340, costSavedMo: 14200, errorRatePct: 2.4, cycleDays: 3.0,
      tokensM: 16.4, tokenRate: 55,
      seats: {
        m365:       { purchased: 35, assigned: 34, active: 31 },
        textilegpt: { purchased: 45, assigned: 43, active: 38 },
        chatgpt:    { purchased: 25, assigned: 24, active: 22 },
        supplyai:   { purchased: 30, assigned: 28, active: 25 }
      },
      teams: [
        { name: 'Smart Textiles Lab',  employees: 16, weeklyPct: 88, dailyPct: 63, trainedPct: 94 },
        { name: 'Material Simulation', employees: 15, weeklyPct: 87, dailyPct: 60, trainedPct: 87 },
        { name: 'Sustainability Lab',  employees: 8,  weeklyPct: 75, dailyPct: 50, trainedPct: 88 },
        { name: 'IP & Patents',        employees: 6,  weeklyPct: 83, dailyPct: 50, trainedPct: 83 }
      ]
    },
    {
      id: 'marketing', name: 'Marketing', vp: 'Marcus Weber', employees: 30, targetUsers: 30, licensedUsers: 29, budgetShare: 0.10,
      dataSourcesReady: 1, dataSourcesTotal: 1,
      trainedEmployees: 25, weeklyUsers: 24, dailyUsers: 15, openRequests: 1,
      hoursSavedMo: 225, costSavedMo: 8900, errorRatePct: 2.9, cycleDays: 2.8,
      tokensM: 6.8, tokenRate: 45,
      seats: {
        m365:       { purchased: 28, assigned: 27, active: 23 },
        textilegpt: { purchased: 20, assigned: 18, active: 15 },
        chatgpt:    { purchased: 28, assigned: 27, active: 24 },
        supplyai:   { purchased: 0,  assigned: 0,  active: 0 }
      },
      teams: [
        { name: 'Brand & Content',     employees: 16, weeklyPct: 88, dailyPct: 56, trainedPct: 88 },
        { name: 'Market Intelligence', employees: 7,  weeklyPct: 71, dailyPct: 43, trainedPct: 86 },
        { name: 'Trade Shows & PR',    employees: 7,  weeklyPct: 71, dailyPct: 43, trainedPct: 71 }
      ]
    },
    {
      id: 'sales', name: 'Sales', vp: 'Marcus Weber', employees: 50, targetUsers: 50, licensedUsers: 48, budgetShare: 0.19,
      dataSourcesReady: 1, dataSourcesTotal: 2,
      trainedEmployees: 38, weeklyUsers: 37, dailyUsers: 22, openRequests: 2,
      hoursSavedMo: 310, costSavedMo: 11800, errorRatePct: 2.8, cycleDays: 3.1,
      tokensM: 8.5, tokenRate: 46,
      seats: {
        m365:       { purchased: 48, assigned: 45, active: 37 },
        textilegpt: { purchased: 42, assigned: 38, active: 31 },
        chatgpt:    { purchased: 22, assigned: 20, active: 17 },
        supplyai:   { purchased: 0,  assigned: 0,  active: 0 }
      },
      teams: [
        { name: 'Auto & Marine Accounts', employees: 20, weeklyPct: 80, dailyPct: 50, trainedPct: 85 },
        { name: 'Apparel & Retail',       employees: 18, weeklyPct: 67, dailyPct: 39, trainedPct: 67 },
        { name: 'Sales Operations',       employees: 6,  weeklyPct: 83, dailyPct: 50, trainedPct: 83 },
        { name: 'Bid Desk',               employees: 6,  weeklyPct: 67, dailyPct: 33, trainedPct: 67 }
      ]
    },
    {
      id: 'production', name: 'Production', vp: 'Dr. Thomas Berg', employees: 90, targetUsers: 50, licensedUsers: 50, budgetShare: 0.18,
      dataSourcesReady: 0, dataSourcesTotal: 2,
      trainedEmployees: 49, weeklyUsers: 42, dailyUsers: 19, openRequests: 0,
      hoursSavedMo: 245, costSavedMo: 9400, errorRatePct: 3.5, cycleDays: 4.1,
      tokensM: 9.2, tokenRate: 52,
      seats: {
        m365:       { purchased: 42, assigned: 34, active: 24 },
        textilegpt: { purchased: 45, assigned: 36, active: 26 },
        chatgpt:    { purchased: 10, assigned: 8,  active: 5 },
        supplyai:   { purchased: 24, assigned: 18, active: 13 }
      },
      teams: [
        { name: 'Weaving Plant A',       employees: 34, weeklyPct: 50, dailyPct: 24, trainedPct: 59 },
        { name: 'Finishing Plant B',     employees: 28, weeklyPct: 36, dailyPct: 14, trainedPct: 43 },
        { name: 'Quality Assurance Lab', employees: 16, weeklyPct: 63, dailyPct: 31, trainedPct: 69 },
        { name: 'Maintenance Planning',  employees: 7,  weeklyPct: 43, dailyPct: 14, trainedPct: 57 },
        { name: 'Shift Scheduling',      employees: 5,  weeklyPct: 40, dailyPct: 20, trainedPct: 40 }
      ]
    },
    {
      id: 'logistics', name: 'Logistics', vp: 'Julia Hoffmann', employees: 45, targetUsers: 30, licensedUsers: 29, budgetShare: 0.10,
      dataSourcesReady: 0, dataSourcesTotal: 2,
      trainedEmployees: 29, weeklyUsers: 26, dailyUsers: 14, openRequests: 1,
      hoursSavedMo: 155, costSavedMo: 5800, errorRatePct: 3.2, cycleDays: 3.7,
      tokensM: 4.1, tokenRate: 48,
      seats: {
        m365:       { purchased: 25, assigned: 22, active: 17 },
        textilegpt: { purchased: 18, assigned: 15, active: 11 },
        chatgpt:    { purchased: 8,  assigned: 7,  active: 5 },
        supplyai:   { purchased: 26, assigned: 20, active: 14 }
      },
      teams: [
        { name: 'Warehouse & Fulfillment', employees: 20, weeklyPct: 50, dailyPct: 25, trainedPct: 55 },
        { name: 'Transport & Fleet',       employees: 14, weeklyPct: 64, dailyPct: 36, trainedPct: 71 },
        { name: 'Customs Compliance',      employees: 6,  weeklyPct: 67, dailyPct: 33, trainedPct: 83 },
        { name: 'Inventory Control',       employees: 5,  weeklyPct: 60, dailyPct: 40, trainedPct: 60 }
      ]
    },
    {
      id: 'purchasing', name: 'Purchasing', vp: 'Andreas Richter', employees: 40, targetUsers: 32, licensedUsers: 32, budgetShare: 0.11,
      dataSourcesReady: 1, dataSourcesTotal: 1,
      trainedEmployees: 29, weeklyUsers: 26, dailyUsers: 15, openRequests: 0,
      hoursSavedMo: 145, costSavedMo: 7100, errorRatePct: 2.9, cycleDays: 3.4,
      tokensM: 3.6, tokenRate: 46,
      seats: {
        m365:       { purchased: 32, assigned: 29, active: 24 },
        textilegpt: { purchased: 16, assigned: 14, active: 11 },
        chatgpt:    { purchased: 12, assigned: 11, active: 9 },
        supplyai:   { purchased: 24, assigned: 21, active: 17 }
      },
      teams: [
        { name: 'Fiber & Yarn Sourcing', employees: 16, weeklyPct: 69, dailyPct: 44, trainedPct: 75 },
        { name: 'Supplier Contracts',    employees: 13, weeklyPct: 69, dailyPct: 39, trainedPct: 77 },
        { name: 'Indirect Procurement',  employees: 6,  weeklyPct: 50, dailyPct: 33, trainedPct: 67 },
        { name: 'Cost Engineering',      employees: 5,  weeklyPct: 60, dailyPct: 20, trainedPct: 60 }
      ]
    }
  ];

  // VP-Submitted Projects for CEO Approval (Live editable + persisted in localStorage)
  const INITIAL_PROJECTS = [
    {
      id: 'p1',
      name: 'Optical Fabric Defect Camera',
      deptId: 'production',
      owner: 'Dr. Thomas Berg',
      outcome: 'Roll out to all looms: defects −27% (€185,000/yr)',
      budget: 48000,
      timeline: 'Q1 2027',
      status: 'Pending'
    },
    {
      id: 'p2',
      name: 'Raw Yarn Price Forecast',
      deptId: 'purchasing',
      owner: 'Andreas Richter',
      outcome: 'Scale to all fiber contracts (€120,000/yr)',
      budget: 24000,
      timeline: 'Q1 2027',
      status: 'Pending'
    },
    {
      id: 'p3',
      name: 'Automated Quote & Spec Drafting',
      deptId: 'sales',
      owner: 'Marcus Weber',
      outcome: 'Quotes 44% faster (€103,000/yr)',
      budget: 18000,
      timeline: 'Live',
      status: 'Approved'
    },
    {
      id: 'p4',
      name: 'Yarn Formulation Assistant',
      deptId: 'rd',
      owner: 'Sarah Klein',
      outcome: '30% faster lab tests (€118,000/yr)',
      budget: 32000,
      timeline: 'Live',
      status: 'Approved'
    },
    {
      id: 'p5',
      name: 'Predictive Loom Maintenance',
      deptId: 'production',
      owner: 'Dr. Thomas Berg',
      outcome: 'Blocked: Plant B machine data missing',
      budget: 65000,
      timeline: 'Q2 2027',
      status: 'Blocked'
    }
  ];

  // VP-Submitted Training Budget Requests for CEO Approval
  const INITIAL_TRAININGS = [
    {
      id: 't1',
      name: 'Shopfloor AI Basics Workshop',
      deptId: 'production',
      owner: 'Dr. Thomas Berg',
      outcome: 'Train 41 operators · Reach 80% trained',
      participants: 41,
      budget: 12000,
      timeline: 'Dec 2026',
      status: 'Pending'
    },
    {
      id: 't2',
      name: 'SupplyAI Warehouse Training',
      deptId: 'logistics',
      owner: 'Julia Hoffmann',
      outcome: '16 warehouse leads · Fewer order errors',
      participants: 16,
      budget: 6500,
      timeline: 'Jan 2027',
      status: 'Pending'
    },
    {
      id: 't3',
      name: 'Sales Prompting Bootcamp',
      deptId: 'sales',
      owner: 'Marcus Weber',
      outcome: '12 field reps · Faster customer quotes',
      participants: 12,
      budget: 4800,
      timeline: 'Completed',
      status: 'Approved'
    },
    {
      id: 't4',
      name: 'Advanced Fiber Simulation AI',
      deptId: 'rd',
      owner: 'Sarah Klein',
      outcome: '15 chemists · Deeper CAD-AI usage',
      participants: 15,
      budget: 8200,
      timeline: 'Running',
      status: 'Approved'
    }
  ];

  // Enterprise Systems & Data Readiness (Concrete Status)
  const SYSTEMS = [
    { name: 'Azure OpenAI EU Gateway', status: 'Live',       detail: 'All departments connected' },
    { name: 'NuTex Textile Spec Library', status: 'Live',    detail: '18,400 specs searchable' },
    { name: 'Salesforce CRM Copilot',  status: 'In Rollout', detail: '38 of 50 sales reps live' },
    { name: 'SAP Supply Chain Data',   status: 'In Rollout', detail: 'Carrier feeds finishing Dec' },
    { name: 'Plant B Loom Machines',   status: 'Blocked',    detail: 'No digital export yet' }
  ];

  // Monthly Employee AI Culture Survey (5 Questions + Tool Wish Ranking per Dept)
  const CULTURE_SURVEY = {
    questions: [
      { id: 'q_tools',   en: 'Have the AI tools I need',         de: 'Habe die KI-Tools, die ich brauche' },
      { id: 'q_manager', en: 'Manager encourages AI use',        de: 'Führungskraft fördert KI-Nutzung' },
      { id: 'q_rules',   en: 'Clear rules & data safety',        de: 'Klare Regeln & Datensicherheit' },
      { id: 'q_trust',   en: 'Positive outlook (no fear of AI)', de: 'Positives Gefühl (keine Angst vor KI)' }
    ],
    byDept: {
      rd:         { responseRate: 0.91, scores: { q_tools: 84, q_freedom: 91, q_manager: 89, q_rules: 86, q_trust: 87 }, wishes: { perplexity: 14, claude: 16, midjourney: 5,  deepl: 4,  cursor: 15 } },
      marketing:  { responseRate: 0.90, scores: { q_tools: 78, q_freedom: 86, q_manager: 85, q_rules: 81, q_trust: 80 }, wishes: { perplexity: 11, claude: 9,  midjourney: 19, deepl: 8,  cursor: 1  } },
      sales:      { responseRate: 0.84, scores: { q_tools: 74, q_freedom: 79, q_manager: 82, q_rules: 80, q_trust: 76 }, wishes: { perplexity: 18, claude: 11, midjourney: 8,  deepl: 12, cursor: 1  } },
      production: { responseRate: 0.76, scores: { q_tools: 51, q_freedom: 57, q_manager: 66, q_rules: 74, q_trust: 56 }, wishes: { perplexity: 8,  claude: 7,  midjourney: 6,  deepl: 3,  cursor: 5  } },
      logistics:  { responseRate: 0.80, scores: { q_tools: 62, q_freedom: 67, q_manager: 74, q_rules: 78, q_trust: 66 }, wishes: { perplexity: 7,  claude: 5,  midjourney: 2,  deepl: 3,  cursor: 1  } },
      purchasing: { responseRate: 0.85, scores: { q_tools: 70, q_freedom: 74, q_manager: 79, q_rules: 83, q_trust: 73 }, wishes: { perplexity: 10, claude: 8,  midjourney: 1,  deepl: 6,  cursor: 1  } }
    },
    // "What stops you from using AI more?" (multiple answers, % of respondents)
    barriers: {
      options: [
        { id: 'time',     label: 'No time to learn it',        lever: 'Protected learning time (30 min / week)' },
        { id: 'allowed',  label: 'Not sure what is allowed',   lever: 'One-page AI usage policy & FAQ' },
        { id: 'fit',      label: "Tool doesn't fit my work",   lever: 'Role-specific use cases & prompts' },
        { id: 'training', label: 'No training yet',            lever: 'Shopfloor training wave 2' },
        { id: 'mistakes', label: 'Afraid of making mistakes',  lever: 'AI champions as first contact' }
      ],
      byDept: {
        rd:         { time: 28, allowed: 18, fit: 8,  training: 4,  mistakes: 4 },
        marketing:  { time: 32, allowed: 22, fit: 10, training: 6,  mistakes: 5 },
        sales:      { time: 40, allowed: 25, fit: 15, training: 10, mistakes: 8 },
        production: { time: 46, allowed: 33, fit: 28, training: 31, mistakes: 14 },
        logistics:  { time: 42, allowed: 29, fit: 24, training: 22, mistakes: 12 },
        purchasing: { time: 36, allowed: 30, fit: 17, training: 14, mistakes: 9 }
      }
    },
    // Share of gross AI time savings lost to checking / fixing output
    reworkPct: { rd: 0.18, marketing: 0.20, sales: 0.22, production: 0.30, logistics: 0.28, purchasing: 0.25 },
    wishTools: [
      { id: 'perplexity', name: 'Perplexity Enterprise' },
      { id: 'claude',     name: 'Claude for Work' },
      { id: 'midjourney', name: 'Midjourney / Firefly' },
      { id: 'deepl',      name: 'DeepL Write Pro' },
      { id: 'cursor',     name: 'Cursor / GitHub Copilot' }
    ]
  };

  // 2026 Monthly Progress Targets (Jan–Nov)
  const TREND_2026 = {
    keys: ['jan_2026', 'feb_2026', 'mar_2026', 'apr_2026', 'may_2026', 'jun_2026', 'jul_2026', 'aug_2026', 'sep_2026', 'oct_2026', 'nov_2026'],
    labelsEn: ['Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26'],
    labelsDe: ['Jan 26', 'Feb 26', 'Mär 26', 'Apr 26', 'Mai 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Okt 26', 'Nov 26'],
    weekly:  { target: 75 },
    daily:   { target: 45 },
    trained: { target: 80 }
  };

  // Bilingual UI Dictionary (EN / DE) — ultra-concise
  const I18N = {
    en: {
      nav_overview: 'Overview',
      nav_projects: 'Projects',
      nav_trainings: 'Trainings',
      nav_licenses: 'Licenses',
      nav_budget: 'Budget',
      nav_departments: 'Departments',
      nav_culture: 'Culture',
      culture_pulse: 'Monthly Survey (5 Questions)',
      culture_wishes: 'Most Wanted Tools',
      culture_by_dept: 'Culture by Department',
      culture_trend: 'Culture Progress (Jan–Nov)',
      responses: 'responses',
      agree: 'agree',
      votes: 'votes',
      filters: 'Filters',
      reset: 'Reset',
      all_depts: 'All Departments (300)',
      accessible_depts: 'Accessible Depts',
      industry_tag: '◆ Industry Avg (Consulting)',
      industry_short: 'Industry Avg',
      target: 'Target',
      decisions: 'Decisions',
      todos: 'To-dos',
      ai_projects: 'AI Projects',
      projects: 'Projects',
      approval_needed: 'Approval needed',
      all_decided: 'All decided',
      trainings: 'Trainings',
      trained_suffix: 'trained',
      untrained_suffix: 'untrained',
      reallocate_seats: 'Reallocate {n} Seats',
      licenses: 'Licenses',
      unused: 'unused',
      paid: 'paid',
      monthly_budget: 'Monthly Budget',
      adjust: 'Adjust →',
      view: 'View →',
      used: 'used',
      spent: 'spent',
      left: 'left',
      over: 'over',
      project_approvals: 'Project Approvals',
      my_proposals: 'My Proposals',
      new_btn: '+ New',
      none_pending: '✓ None pending',
      approve: 'Approve',
      decline: 'Decline',
      undo: 'Undo',
      ai_adoption: 'AI Adoption',
      employees_using_ai: 'Employees using AI',
      funnel_all: 'All Employees',
      funnel_target: 'AI Target Group',
      funnel_trained: 'Trained',
      funnel_weekly: 'Weekly Users',
      usage_by_dept: 'AI Usage by Department',
      usage_by_tool: 'AI Usage by Tools',
      details: 'Details →',
      active_seats: 'Active seats',
      all: 'All',
      Pending: 'Pending',
      Approved: 'Approved',
      Blocked: 'Blocked',
      Declined: 'Declined',
      new_project: '+ New Project',
      request_training: '+ Request Training',
      outcome: 'Outcome',
      employees_trained: 'Employees Trained',
      needed_for_target: 'To Reach 80%',
      in_requests: 'In Requests',
      by_dept: 'By Department',
      emp: 'emp',
      active: 'Active',
      open_requests: 'open requests',
      per_active_user: '/ active user',
      actions: 'Actions',
      reallocate_btn: 'Reallocate',
      cancel_seats_btn: 'Cancel Seats',
      all_requests_filled: 'All Requests Filled',
      no_excess_seats: 'No Excess Seats',
      unused_to_req: 'Unused → Open requests',
      zero_requests: '0 open requests',
      cancel_n_seats: 'Cancel {n} Unused Seats',
      save_mo: 'Save {v} / mo',
      optimized: 'Optimized',
      done: 'Done',
      dept_col: 'Department',
      paid_col: 'Paid',
      active_col: 'Active',
      unused_col: 'Unused',
      increase_budget: 'Increase Budget',
      save: 'Save',
      ceo_only: 'CEO only',
      ceo_fin_only: 'CEO & Finance only',
      spend_breakdown: 'Spend Breakdown',
      ai_licenses: 'AI Licenses',
      api_tokens: 'API Tokens',
      token_usage_cost: 'Tokens & Cost',
      tokens_col: 'Tokens',
      cost_col: 'Cost',
      per_1m: '/ 1M tokens',
      tokens_short: 'tokens',
      approved_projects: 'Approved Projects',
      approved_trainings: 'Approved Trainings',
      weekly: 'Weekly',
      daily: 'Daily',
      trained: 'Trained',
      metric_weekly: 'Weekly AI Users',
      metric_daily: 'Daily AI Users',
      metric_trained: 'Employees Trained',
      summary: 'Summary',
      leading: 'Leading',
      lagging: 'Lagging',
      progress_2026: '2026 Progress (Jan–Nov)',
      click_dept_hint: 'Click a department bar to filter trend',
      all_depts_short: 'All Departments',
      on_track: 'On Track',
      watch: 'Watch',
      action_needed: 'Action Needed',
      settings: 'Settings',
      appearance: 'Appearance',
      light: 'Light',
      dark: 'Dark',
      language: 'Language',
      cancel: 'Cancel',
      submit: 'Submit',
      project_name: 'Project Name',
      expected_outcome: 'Expected Outcome',
      budget_eur: 'Budget (€)',
      timeline: 'Timeline',
      title: 'Title',
      employees: 'Employees',
      restricted: 'Restricted',
      nav_readiness: 'Readiness'
    },
    de: {
      nav_overview: 'Übersicht',
      nav_projects: 'Projekte',
      nav_trainings: 'Schulungen',
      nav_licenses: 'Lizenzen',
      nav_budget: 'Budget',
      nav_departments: 'Abteilungen',
      nav_culture: 'Kultur',
      culture_pulse: 'Monatsumfrage (5 Fragen)',
      culture_wishes: 'Tool-Wunschliste',
      culture_by_dept: 'Kultur nach Abteilung',
      culture_trend: 'Kultur-Verlauf (Jan–Nov)',
      responses: 'Antworten',
      agree: 'Zustimmung',
      votes: 'Stimmen',
      filters: 'Filter',
      reset: 'Zurücksetzen',
      all_depts: 'Alle Abteilungen (300)',
      accessible_depts: 'Freigegebene Abt.',
      industry_tag: '◆ Branchenschnitt (Beratung)',
      industry_short: 'Branchenschnitt',
      target: 'Ziel',
      decisions: 'Entscheidungen',
      todos: 'Aufgaben',
      ai_projects: 'KI-Projekte',
      projects: 'Projekte',
      approval_needed: 'Freigabe offen',
      all_decided: 'Alle entschieden',
      trainings: 'Schulungen',
      trained_suffix: 'geschult',
      untrained_suffix: 'ungeschult',
      reallocate_seats: '{n} Lizenzen umverteilen',
      licenses: 'Lizenzen',
      unused: 'ungenutzt',
      paid: 'bezahlt',
      monthly_budget: 'Monatsbudget',
      adjust: 'Anpassen →',
      view: 'Details →',
      used: 'verbraucht',
      spent: 'verbraucht',
      left: 'verfügbar',
      over: 'über Budget',
      project_approvals: 'Projekt-Freigaben',
      my_proposals: 'Meine Vorschläge',
      new_btn: '+ Neu',
      none_pending: '✓ Keine offenen Anträge',
      approve: 'Freigeben',
      decline: 'Ablehnen',
      undo: 'Rückgängig',
      ai_adoption: 'KI-Nutzung',
      employees_using_ai: 'Mitarbeitende mit KI-Nutzung',
      funnel_all: 'Alle Mitarbeitende',
      funnel_target: 'KI-Zielgruppe',
      funnel_trained: 'Geschult',
      funnel_weekly: 'Wöchentl. Nutzer',
      usage_by_dept: 'KI-Nutzung nach Abteilung',
      usage_by_tool: 'KI-Nutzung nach Tool',
      details: 'Details →',
      active_seats: 'Aktive Lizenzen',
      all: 'Alle',
      Pending: 'Offen',
      Approved: 'Freigegeben',
      Blocked: 'Blockiert',
      Declined: 'Abgelehnt',
      new_project: '+ Neues Projekt',
      request_training: '+ Schulung anfragen',
      outcome: 'Ergebnis',
      employees_trained: 'Geschulte Mitarbeitende',
      needed_for_target: 'Bis 80%-Ziel',
      in_requests: 'In Anträgen',
      by_dept: 'Nach Abteilung',
      emp: 'MA',
      active: 'Aktiv',
      open_requests: 'offene Anfragen',
      per_active_user: '/ aktiver Nutzer',
      actions: 'Maßnahmen',
      reallocate_btn: 'Umverteilen',
      cancel_seats_btn: 'Kündigen',
      all_requests_filled: 'Alle Anfragen gedeckt',
      no_excess_seats: 'Kein Überschuss',
      unused_to_req: 'Ungenutzt → Offene Anfragen',
      zero_requests: '0 offene Anfragen',
      cancel_n_seats: '{n} Lizenzen kündigen',
      save_mo: 'Spart {v} / Monat',
      optimized: 'Optimiert',
      done: 'Erledigt',
      dept_col: 'Abteilung',
      paid_col: 'Bezahlt',
      active_col: 'Aktiv',
      unused_col: 'Ungenutzt',
      increase_budget: 'Budget erhöhen',
      save: 'Speichern',
      ceo_only: 'Nur CEO',
      ceo_fin_only: 'Nur CEO & Finanzen',
      spend_breakdown: 'Ausgaben nach Bereich',
      ai_licenses: 'KI-Lizenzen',
      api_tokens: 'API-Tokens',
      token_usage_cost: 'Tokens & Kosten',
      tokens_col: 'Tokens',
      cost_col: 'Kosten',
      per_1m: '/ 1 Mio. Tokens',
      tokens_short: 'Tokens',
      approved_projects: 'Freigegebene Projekte',
      approved_trainings: 'Freigegebene Schulungen',
      weekly: 'Wöchentlich',
      daily: 'Täglich',
      trained: 'Geschult',
      metric_weekly: 'Wöchentliche Nutzer',
      metric_daily: 'Tägliche Nutzer',
      metric_trained: 'Geschulte MA',
      summary: 'Übersicht',
      leading: 'Spitzenreiter',
      lagging: 'Aufholbedarf',
      progress_2026: 'Verlauf 2026 (Jan–Nov)',
      click_dept_hint: 'Abteilung anklicken für Verlauf',
      all_depts_short: 'Alle Abteilungen',
      on_track: 'Im Plan',
      watch: 'Beobachten',
      action_needed: 'Handlungsbedarf',
      settings: 'Einstellungen',
      appearance: 'Darstellung',
      light: 'Hell',
      dark: 'Dunkel',
      language: 'Sprache',
      cancel: 'Abbrechen',
      submit: 'Einreichen',
      project_name: 'Projektname',
      expected_outcome: 'Erwarteter Nutzen',
      budget_eur: 'Budget (€)',
      timeline: 'Zeitraum',
      title: 'Titel',
      employees: 'Mitarbeitende',
      restricted: 'Eingeschränkt',
      nav_readiness: 'Readiness'
    }
  };

  // AI pilots & live use cases — monthly value vs. monthly run cost (Level-2 "Which pilots should we implement?")
  // trend = value per € for the last 6 months (Jun → Nov 2026)
  const PILOTS = [
    {
      id: 'quotedraft', name: 'QuoteDraft', driver: 'speed', full: 'Automated Quote & Spec Drafting', deptId: 'sales', owner: 'Marcus Weber',
      status: 'Live', since: 'Mar 2026', costMo: 2500, valueMo: 8600, employees: 50,
      result: 'Quotes 44% faster (27 h → 15 h) · win rate +4 pp', trend: [1.9, 2.4, 2.8, 3.1, 3.3, 3.47],
      next: 'Roll out to Apparel & Retail team (18 reps)'
    },
    {
      id: 'yarnlab', name: 'YarnLab', driver: 'speed', full: 'Yarn Formulation Assistant', deptId: 'rd', owner: 'Sarah Klein',
      status: 'Live', since: 'Feb 2026', costMo: 3300, valueMo: 9800, employees: 45,
      result: 'Lab test cycles 30% faster', trend: [2.2, 2.5, 2.6, 2.8, 2.9, 2.98],
      next: 'Connect simulation data to cut cycles further'
    },
    {
      id: 'fabricvision', name: 'FabricVision', driver: 'quality', full: 'Optical Fabric Defect Camera', deptId: 'production', owner: 'Dr. Thomas Berg',
      status: 'Pilot', since: 'Jul 2026', costMo: 1500, valueMo: 3600, employees: 90,
      result: 'Defects −27%, returns −25% in Plant A', trend: [0.4, 0.9, 1.4, 1.8, 2.2, 2.4],
      next: 'Approve rollout to all looms (€48k) — needs works council sign-off'
    },
    {
      id: 'weaveopt', name: 'WeaveOpt', driver: 'quality', full: 'Loom Setting Optimizer', deptId: 'production', owner: 'Dr. Thomas Berg',
      status: 'Pilot', since: 'Aug 2026', costMo: 800, valueMo: 1700, employees: 62,
      result: 'Changeover time −22%', trend: [0, 0.6, 1.1, 1.6, 1.9, 2.1],
      next: 'Blocked by ERP link for full rollout'
    },
    {
      id: 'yarnprice', name: 'YarnPrice', driver: 'cost', label: 'left', full: 'Raw Yarn Price Forecast', deptId: 'purchasing', owner: 'Andreas Richter',
      status: 'Pilot', since: 'Sep 2026', costMo: 1500, valueMo: 4200, employees: 12,
      result: '€35k saved on two fiber contracts', trend: [0, 0, 0, 1.2, 2.1, 2.8],
      next: 'Keep small — high value, few users'
    },
    {
      id: 'dyematch', name: 'DyeMatch', driver: 'quality', full: 'Color Recipe Matching', deptId: 'rd', owner: 'Sarah Klein',
      status: 'Pilot', since: 'Jun 2026', costMo: 1200, valueMo: 1700, employees: 38,
      result: 'First-time-right dyeing 71% → 79%', trend: [0.6, 0.8, 1.0, 1.2, 1.3, 1.42],
      next: 'Add finishing team to reach implement zone'
    },
    {
      id: 'shopfloor', name: 'ShopFloor Copilot', driver: 'time', label: 'above-left', full: 'Shopfloor Assistant (work instructions)', deptId: 'production', owner: 'Dr. Thomas Berg',
      status: 'Pilot', since: 'May 2026', costMo: 1300, valueMo: 1000, employees: 80,
      result: 'Only 31% of operators use it weekly', trend: [0.5, 0.6, 0.6, 0.7, 0.7, 0.76],
      next: 'Fix adoption: shopfloor training wave 2 before more spend'
    },
    {
      id: 'customsai', name: 'CustomsAI', driver: 'time', full: 'Customs Document Checker', deptId: 'logistics', owner: 'Julia Hoffmann',
      status: 'Pilot', since: 'Apr 2026', costMo: 1100, valueMo: 600, employees: 6,
      result: 'Errors flat — vendor tool covers it already', trend: [0.7, 0.6, 0.6, 0.5, 0.55, 0.55],
      next: 'Stop at end of contract (Jan 2027), save €1.1k/mo'
    },
    {
      id: 'routeassist', name: 'RouteAssist', driver: 'cost', full: 'Warehouse Picking Route Assistant', deptId: 'logistics', owner: 'Julia Hoffmann',
      status: 'Pilot', since: 'Jul 2026', costMo: 1400, valueMo: 2600, employees: 20,
      result: 'Picking route errors −15%, 40 min saved per shift', trend: [0.3, 0.7, 1.1, 1.4, 1.7, 1.86],
      next: 'Extend to second warehouse once SupplyAI users moved to Copilot'
    },
    {
      id: 'contentstudio', name: 'ContentStudio', split: { cost: 3000, time: 2200 }, label: 'right', full: 'Brand Content & Spec Sheet Drafting', deptId: 'marketing', owner: 'Marcus Weber',
      status: 'Live', since: 'Apr 2026', costMo: 1600, valueMo: 5200, employees: 24,
      result: 'Campaign assets 45% faster, agency spend −€3k/mo', trend: [2.1, 2.4, 2.7, 2.9, 3.1, 3.25],
      next: 'Connect product data to auto-draft spec sheets'
    },
    {
      id: 'trendradar', name: 'TrendRadar', driver: 'time', label: 'right', full: 'Market Intelligence Briefs', deptId: 'marketing', owner: 'Marcus Weber',
      status: 'Pilot', since: 'Sep 2026', costMo: 900, valueMo: 1100, employees: 7,
      result: 'Weekly competitor brief in 10 min instead of 3 h', trend: [0, 0, 0, 0.8, 1.1, 1.22],
      next: 'Share briefs with Sales to widen the audience'
    }
  ];

  // Company financial context for AI spend (example figures, mid-sized textile manufacturer)
  const COMPANY = {
    revenueYear: 68000000,      // €68M revenue
    itBudgetPct: 3.0,           // IT budget as % of revenue
    bench: {                    // peer ranges, mid-sized manufacturing
      perEmpMo: [60, 120],      // € AI spend per employee per month
      shareOfIt: [10, 20],      // % of IT budget
      shareOfRevenue: [0.3, 0.8] // % of revenue
    },
    // Anonymised peer group: AI spend as % of revenue (mid-sized manufacturers, 150–600 employees)
    peers: [
      { name: 'Technical textiles A', share: 0.18 }, { name: 'Nonwovens B', share: 0.27 },
      { name: 'Automotive textiles C', share: 0.33 }, { name: 'Yarn spinner D', share: 0.38 },
      { name: 'Home textiles E', share: 0.42 }, { name: 'Coated fabrics F', share: 0.46 },
      { name: 'Medical textiles G', share: 0.49 }, { name: 'Apparel fabrics H', share: 0.58 },
      { name: 'Industrial filters I', share: 0.64 }, { name: 'Composites J', share: 0.71 },
      { name: 'Smart textiles K', share: 0.86 }, { name: 'Packaging films L', share: 1.04 }
    ]
  };

  // Business KPIs before / after AI go-live. Series: Oct 2025 … Nov 2026 (index 0–13);
  // goLive = index of the first month with AI. control = comparable team / site without AI.
  // € impact per year matches the pilot values (×12) so it stays consistent with "Value per €".
  const IMPACT = {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    kpis: [
      {
        id: 'returns', name: 'Customer returns rate', driver: 'quality', pilots: ['fabricvision'], unit: '%', unitLabel: '% of shipped orders', lowerIsBetter: true,
        depts: ['production', 'sales'], goLive: 9, confidence: 'high', target: 2.5,
        series:  [3.2, 3.0, 3.1, 3.1, 3.2, 3.0, 3.1, 3.0, 3.1, 2.9, 2.7, 2.5, 2.4, 2.3],
        control: [3.1, 3.0, 3.2, 3.0, 3.1, 3.0, 3.1, 3.0, 3.0, 3.0, 2.9, 3.0, 2.9, 2.9], controlLabel: 'Plant B (no camera)',
        driverLabel: 'FabricVision', owner: 'Dr. Thomas Berg · Production', euroNote: 'fewer credit notes & re-shipments'
      },
      {
        id: 'quality', name: 'Quality issues', driver: 'quality', pilots: ['weaveopt', 'dyematch'], unit: '', unitLabel: 'defects per 1,000 m fabric', lowerIsBetter: true,
        depts: ['production', 'rd'], goLive: 9, confidence: 'high', target: 6.0,
        series:  [8.6, 8.3, 8.5, 8.4, 8.6, 8.2, 8.4, 8.3, 8.5, 7.6, 7.0, 6.6, 6.3, 6.1],
        control: [8.5, 8.4, 8.6, 8.3, 8.5, 8.4, 8.4, 8.2, 8.4, 8.3, 8.2, 8.3, 8.1, 8.2], controlLabel: 'Plant B (no camera)',
        driverLabel: 'WeaveOpt + DyeMatch', owner: 'Dr. Thomas Berg · Production', euroNote: 'less scrap and rework'
      },
      {
        id: 'response', name: 'Customer response time', driver: 'speed', pilots: ['quotedraft'], unit: 'h', unitLabel: 'hours to first quote', lowerIsBetter: true,
        depts: ['sales'], goLive: 5, confidence: 'high', target: 12,
        series:  [27, 25, 28, 26, 26, 24, 21, 19, 18, 17, 16, 16, 15, 15],
        control: [26, 26, 27, 25, 26, 25, 25, 24, 24, 25, 24, 23, 24, 23], controlLabel: 'Apparel team (no QuoteDraft)',
        driverLabel: 'QuoteDraft', owner: 'Marcus Weber · Sales', euroNote: 'more quotes per rep, higher win rate'
      },
      {
        id: 'feedback', name: 'Positive customer feedback', driver: null, pilots: [], unit: '%', unitLabel: '% positive survey answers', lowerIsBetter: false,
        depts: ['marketing', 'sales'], goLive: 6, confidence: 'low', target: 80,
        series:  [70, 71, 70, 71, 72, 71, 72, 74, 75, 76, 77, 77, 78, 79],
        driverLabel: 'ContentStudio + QuoteDraft', owner: 'Marcus Weber · Commercial', euroNote: 'retention effect, not priced'
      },
      {
        id: 'otd', name: 'On-time delivery', driver: 'cost', pilots: ['routeassist'], unit: '%', unitLabel: '% orders delivered on time', lowerIsBetter: false,
        depts: ['logistics', 'purchasing'], goLive: 9, confidence: 'medium', target: 95,
        series:  [88, 87, 89, 88, 87, 88, 89, 88, 88, 90, 91, 91, 92, 92],
        control: [88, 88, 87, 89, 88, 88, 88, 89, 88, 88, 89, 88, 89, 88], controlLabel: 'Warehouse 2 (no RouteAssist)',
        driverLabel: 'RouteAssist', owner: 'Julia Hoffmann · Logistics', euroNote: 'fewer penalties & express shipments'
      },
      {
        id: 'extcost', name: 'External costs', driver: 'cost', pilots: ['yarnprice', 'contentstudio'], unit: 'k', unitLabel: '€k per month: agency fees & purchase price premiums', lowerIsBetter: true,
        depts: ['purchasing', 'marketing'], goLive: 6, confidence: 'medium', target: 30,
        series:  [38.5, 38.0, 38.8, 38.2, 38.6, 38.1, 36.9, 36.2, 35.8, 35.5, 35.0, 33.9, 32.2, 31.1],
        driverLabel: 'YarnPrice + ContentStudio', owner: 'Andreas Richter · Purchasing', euroNote: 'avoided external spend'
      },
      {
        id: 'routine', name: 'Time on routine tasks', driver: 'time', pilots: '*', unit: 'h', unitLabel: 'hours per AI user per week', lowerIsBetter: true,
        depts: ['rd', 'marketing', 'sales', 'production', 'logistics', 'purchasing'], goLive: 3, confidence: 'medium', target: 7,
        series:  [9.1, 9.0, 9.2, 8.9, 8.6, 8.4, 8.2, 8.0, 7.9, 7.7, 7.6, 7.5, 7.5, 7.4],
        driverLabel: 'Everyday AI use + time pilots', owner: 'HR / Finance', euroNote: 'net hours × €40'
      },
      {
        id: 'labcycle', name: 'Lab test cycle time', driver: 'speed', pilots: ['yarnlab'], unit: 'd', unitLabel: 'days per material test', lowerIsBetter: true,
        depts: ['rd'], goLive: 4, confidence: 'medium', target: 3.5,
        series:  [5.1, 5.0, 4.9, 5.0, 4.4, 4.1, 3.9, 3.8, 3.7, 3.6, 3.6, 3.5, 3.5, 3.5],
        driverLabel: 'YarnLab', owner: 'Sarah Klein · R&D', euroNote: 'faster development, fewer lab hours'
      }
    ]
  };

  // How "return" is calculated: four hard drivers in € (summing to the realized return)
  // plus soft facts that are tracked but never priced.
  const RETURN_MODEL = {
    hourlyRate: 40, // € fully loaded cost per employee hour
    drivers: [
      {
        id: 'time', label: 'Time saved', color: 'var(--c-primary)',
        formula: 'Net hours saved × €40 fully loaded hourly rate',
        detail: 'Hours from everyday AI use (logs + monthly survey), net of rework for checking and fixing output.',
        source: 'Tool logs · pulse survey', owner: 'HR / Finance', freq: 'Monthly', confidence: 'estimate'
      },
      {
        id: 'quality', label: 'Quality', color: 'var(--c-sky)',
        formula: 'Fewer defects & returns × cost per case (scrap, credit note, re-shipment)',
        detail: 'Defects per 1,000 m and returns rate vs. 3-month pre-AI baseline; Plant B as control group.',
        source: 'QA system · ERP returns', owner: 'Production', freq: 'Monthly', confidence: 'measured'
      },
      {
        id: 'speed', label: 'Speed & revenue', color: 'var(--c-indigo)',
        formula: 'Faster quotes & lab cycles × contribution margin of the extra output',
        detail: 'Quote lead time and win rate (CRM), lab test cycle time; Apparel team as control group for quotes.',
        source: 'CRM · lab system', owner: 'Sales / R&D', freq: 'Monthly', confidence: 'measured'
      },
      {
        id: 'cost', label: 'Cost avoided', color: 'var(--c-navy)',
        formula: 'Avoided external spend: penalties, express freight, agency fees, better contract prices',
        detail: 'Invoices before vs. after go-live, adjusted for volume.',
        source: 'Finance · procurement', owner: 'Finance', freq: 'Quarterly', confidence: 'estimate'
      }
    ],
    rules: [
      'Each euro is counted once: hours freed inside a quality or speed pilot are valued via that outcome, not again as time saved.',
      'Baseline = average of the 3 months before each go-live.',
      'Soft facts are tracked next to the return but never priced into it.'
    ]
  };

  // People the CEO can delegate to-dos to (quick choose + search)
  const PEOPLE = [
    { id: 'sarah',   name: 'Sarah Klein',     role: 'VP R&D' },
    { id: 'marcus',  name: 'Marcus Weber',    role: 'VP Commercial' },
    { id: 'thomas',  name: 'Dr. Thomas Berg', role: 'VP Production' },
    { id: 'julia',   name: 'Julia Hoffmann',  role: 'VP Logistics' },
    { id: 'andreas', name: 'Andreas Richter', role: 'VP Purchasing' },
    { id: 'lena',    name: 'Lena Vogt',       role: 'Head of IT' },
    { id: 'tobias',  name: 'Tobias Kern',     role: 'IT lead · ERP' },
    { id: 'nina',    name: 'Nina Schäfer',    role: 'HR / Learning' },
    { id: 'paul',    name: 'Paul Brandt',     role: 'Finance' },
    { id: 'miriam',  name: 'Miriam Koch',     role: 'Legal & Compliance' },
    { id: 'jonas',   name: 'Jonas Fischer',   role: 'Data owner Production' },
    { id: 'eva',     name: 'Eva Lorenz',      role: 'AI program lead' }
  ];

  // Company-wide adoption over time (employees of 300) + the changes that moved it.
  // Nov values match the live metrics (210 trained, 193 weekly users, 232 licensed, target group 236).
  // m = position on the month axis (0 = Jan); a change sits just before the month it shows up in.
  const ADOPTION_2026 = {
    year: 2026,
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    target: 236,
    // Each month-to-month step is either exactly one change event below or organic growth.
    trained:  [30, 60, 104, 116, 136, 138, 156, 166, 182, 186, 210],
    licensed: [40, 70, 96, 120, 182, 182, 196, 168, 210, 194, 232],
    weekly:   [30, 52, 81, 104, 133, 119, 151, 142, 180, 158, 193],
    events: [
      {
        id: 'ev-training1', m: 1.9, date: '2 Mar 2026', title: 'AI basics training · wave 1',
        weekly: 29, licensed: 26, trained: 44, recovered: 0, depts: ['rd', 'marketing', 'sales'],
        why: 'Hands-on e-learning plus team sessions turned licensed users into weekly users.',
        fix: 'Repeat the format for shopfloor teams (wave 2, Dec).'
      },
      {
        id: 'ev-licenses', m: 3.85, date: '28 Apr 2026', title: 'License expansion (+60 seats)',
        weekly: 29, licensed: 62, trained: 20, recovered: 0, depts: ['production', 'logistics', 'purchasing'],
        why: 'Seats went to whole departments at once; only half started using them weekly.',
        fix: 'Tie new seats to a training slot.'
      },
      {
        id: 'ev-sso', m: 4.8, date: '25 May 2026', title: 'SSO migration',
        weekly: -14, licensed: 0, trained: 0, recovered: 14, depts: ['production', 'logistics'],
        why: 'Shared shopfloor PCs logged users out every shift; people gave up after repeated sign-ins.',
        fix: 'Fixed with kiosk sign-in in July — fully recovered.'
      },
      {
        id: 'ev-lock', m: 6.8, date: '25 Jul 2026', title: 'Inactive licenses locked',
        weekly: -9, licensed: -28, trained: 0, recovered: 4, depts: ['production', 'sales'],
        why: '28 seats with < 1 use per month were locked; 9 of those people used AI occasionally and dropped out.',
        fix: 'Offer a one-click re-request instead of a ticket.'
      },
      {
        id: 'ev-copilot', m: 7.85, date: '26 Aug 2026', title: 'M365 Copilot rollout (ops teams)',
        weekly: 38, licensed: 42, trained: 16, recovered: 0, depts: ['production', 'logistics', 'purchasing'],
        why: 'Copilot inside Outlook and Teams meant no new tool to learn; usage started on day one.',
        fix: 'Add short role-based prompts for shift leads.'
      },
      {
        id: 'ev-supplyai', m: 8.9, date: '28 Sep 2026', title: 'SupplyAI chat module removed',
        weekly: -22, licensed: -16, trained: 0, recovered: 12, depts: ['logistics', 'purchasing'],
        why: 'The vendor dropped the chat module; warehouse teams lost their main AI entry point without a replacement.',
        fix: 'Move them to M365 Copilot with a 30-min guided switch.'
      },
      {
        id: 'ev-bootcamp', m: 9.6, date: '20 Oct 2026', title: 'Prompting bootcamp & AI champions',
        weekly: 35, licensed: 38, trained: 24, recovered: 0, depts: ['sales', 'rd'],
        why: 'Champions in every team answered questions on the spot; usage grew fastest where they were active.',
        fix: 'Name champions in Production and Logistics.'
      }
    ]
  };

  return {
    THRESHOLDS, TARGETS, KPI_INFO, ROLES, DEFAULT_RBAC, PILOTS, ADOPTION_2026, PEOPLE, COMPANY, IMPACT, RETURN_MODEL,
    TOOLS, TIMEFRAMES, DEPARTMENTS, INITIAL_PROJECTS, INITIAL_TRAININGS, SYSTEMS, CULTURE_SURVEY, TREND_2026, I18N
  };
})();
