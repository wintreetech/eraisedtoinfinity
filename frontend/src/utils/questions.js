export const questions = [
  // 🔱 SWAMI — Founder & Leadership
  {
    id: "q1",
    pillar: "Swami",
    label:
      "Do you aspire to become a Vijigishu—a global market leader in your segment—and aim for 10X growth in your business?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Yes", value: 5 },
    ],
  },
  {
    id: "q2",
    pillar: "Swami",
    label:
      "How do you currently allocate your time between strategic growth and day-to-day operations?",
    type: "single_choice",
    options: [
      { label: "Mostly daily operations", value: 1 },
      { label: "Roughly a 50–50 split", value: 3 },
      { label: "70% or more focused on strategy", value: 5 },
    ],
  },

  // 🔱 AMATYA — Management & Decision Makers
  {
    id: "q3",
    pillar: "Amatya",
    label:
      "How many managers or department heads do you have in your organization?",
    type: "numeric_bucket",
    scoringLogic: [
      { range: [0, 0], value: 1 },
      { range: [1, 2], value: 2 },
      { range: [3, 5], value: 3 },
      { range: [6, 10], value: 4 },
      { range: [11, 999], value: 5 },
    ],
  },
  {
    id: "q4",
    pillar: "Amatya",
    label:
      "Do you have a core management team that can run daily operations without your constant involvement?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Partially", value: 3 },
      { label: "Yes", value: 5 },
    ],
  },

  // 🔱 JANAPADA — Market & Customers
  {
    id: "q5",
    pillar: "Janapada",
    label: "How strong is your repeat customer base?",
    type: "scale",
    scale: {
      min: 1,
      max: 5,
      labels: {
        1: "Very Low",
        5: "Very High",
      },
    },
  },
  {
    id: "q6",
    pillar: "Janapada",
    label: "What best describes the growth rate of your market?",
    type: "single_choice",
    options: [
      { label: "Stagnant or below 5% growth", value: 1 },
      { label: "10–20% annual growth", value: 3 },
      { label: "25%+ annual growth and expanding", value: 5 },
    ],
  },

  // 🔱 DURGA — Systems & Infrastructure
  {
    id: "q7",
    pillar: "Durga",
    label:
      "Are more than 50% of your business processes managed through software such as CRM, ERP, or custom systems?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Partially", value: 3 },
      { label: "Yes", value: 5 },
    ],
  },
  {
    id: "q8",
    pillar: "Durga",
    label: "How many offices, units, or branches does your business operate?",
    type: "numeric_bucket",
    scoringLogic: [
      { range: [1, 1], value: 1 },
      { range: [2, 3], value: 3 },
      { range: [4, 10], value: 4 },
      { range: [11, 999], value: 5 },
    ],
  },

  // 🔱 KOSHA — Financial Strength & Capital
  {
    id: "q9",
    pillar: "Kosha",
    label: "How consistent are your profit margins?",
    type: "single_choice",
    options: [
      { label: "Below 10% or currently loss-making", value: 1 },
      { label: "10–20% and stable", value: 3 },
      { label: "20%+ and improving", value: 5 },
    ],
  },
  {
    id: "q10",
    pillar: "Kosha",
    label: "How is your business currently funded?",
    type: "single_choice",
    options: [
      { label: "Own funds", value: 2 },
      { label: "Bank finance", value: 3 },
      { label: "Investor capital", value: 5 },
      { label: "Combination of the above", value: 4 },
    ],
  },

  // 🔱 DANDA — Execution & Governance

  {
    id: "q11",
    pillar: "Danda",
    label:
      "Are you open to external capital (equity or structured funding) to accelerate business growth?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Maybe in the future", value: 3 },
      { label: "Yes, actively exploring", value: 5 },
    ],
  },

  {
    id: "q12",
    pillar: "Danda",
    label:
      "Do you have defined KPIs and a formal performance review system in place?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Yes", value: 5 },
    ],
  },

  // 🔱 MITRA — Advisors & Strategic Alliances
  {
    id: "q13",
    pillar: "Mitra",
    label:
      "Do you have a board of advisors, mentors, or consultants supporting your business?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Yes", value: 5 },
    ],
  },
  {
    id: "q14",
    pillar: "Mitra",
    label:
      "Would you like to onboard external talent or experts to support future business growth?",
    type: "single_choice",
    options: [
      { label: "No", value: 1 },
      { label: "Maybe", value: 3 },
      { label: "Yes", value: 5 },
    ],
  },
];
