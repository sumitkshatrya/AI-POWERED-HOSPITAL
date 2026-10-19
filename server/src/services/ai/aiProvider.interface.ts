export interface PatientSummaryInput {
  patient: {
    firstName: string;
    lastName: string;
    uhid: string;
    gender?: string;
    age?: number;
  };
  recentVisits: Array<{
    date: string;
    doctorName: string;
    department: string;
    reason?: string;
    diagnosis?: string;
  }>;
  majorConditions: string[];
  currentMedications: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
  }>;
  recentInvestigations: Array<{
    testName: string;
    date: string;
    status: string;
    keyFinding?: string;
  }>;
  allergies: string[];
  upcomingFollowUps: string[];
}

export interface PatientSummaryOutput {
  summaryText: string;
  recentVisitsOverview: string;
  activeConditions: string[];
  activeMedications: string[];
  recentInvestigationsSummary: string;
  allergiesAndRiskFactors: string[];
  recommendedFollowUps: string[];
  disclaimer: string;
}

export interface StructuredClinicalNoteOutput {
  chiefComplaint: string;
  symptoms: string[];
  examination: string;
  assessment: string;
  plan: string[];
  followUp: string;
  disclaimer: string;
}

export interface ReportExplanationInput {
  reportTitle: string;
  reportCategory: 'LABORATORY' | 'RADIOLOGY';
  findings: string;
  impression?: string;
  abnormalFlags?: string[];
  patientName?: string;
}

export interface ReportExplanationOutput {
  plainLanguageSummary: string;
  explainedTerminology: Array<{ term: string; explanation: string }>;
  keyFindingsBreakdown: string[];
  recommendedNextSteps: string;
  disclaimer: string;
}

export interface SpecialtyNavigationInput {
  symptomQuery: string;
}

export interface SpecialtyNavigationOutput {
  suggestedSpecialty: string;
  explanation: string;
  matchingKeywords: string[];
  guidanceText: string;
  disclaimer: string;
}

export interface OperationalMetricsInput {
  timeframeLabel: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowCount: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  activeDepartmentWorkload: Array<{ department: string; appointmentCount: number }>;
  lowStockItemsCount: number;
  expiringItemsCount: number;
}

export interface AdminAnalyticsOutput {
  operationalOverview: string;
  keyMetricsSummary: {
    appointmentsHeadline: string;
    financialHeadline: string;
    patientGrowthHeadline: string;
    inventoryAlertHeadline: string;
  };
  departmentHighlights: string;
  actionableInsights: string[];
  disclaimer: string;
}

export interface ChatActionSuggestion {
  label: string;
  actionType: 'NAVIGATE' | 'PROMPT' | 'EMERGENCY' | 'CALL';
  target?: string;
}

export interface ChatAssistantInput {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant' | 'system' | 'model';
    content: string;
  }>;
  userContext?: {
    userId?: string;
    role?: string;
    userName?: string;
    hospitalName?: string;
    branchName?: string;
    currentPage?: string;
  };
}

export interface ChatAssistantOutput {
  reply: string;
  suggestedActions?: ChatActionSuggestion[];
  suggestedQuestions?: string[];
  category?:
    | 'MEDICAL_ADVICE'
    | 'HOSPITAL_SERVICE'
    | 'DOCTOR_FINDER'
    | 'EMERGENCY'
    | 'MEDICATION'
    | 'GENERAL'
    | 'CLINICAL_SUPPORT';
  isEmergencyAlert?: boolean;
  disclaimer: string;
}

export interface IAiProvider {
  name: string;
  generatePatientSummary(input: PatientSummaryInput): Promise<PatientSummaryOutput>;
  structureClinicalNote(rawNotes: string): Promise<StructuredClinicalNoteOutput>;
  explainMedicalReport(input: ReportExplanationInput): Promise<ReportExplanationOutput>;
  navigateSpecialty(input: SpecialtyNavigationInput): Promise<SpecialtyNavigationOutput>;
  generateAdminAnalytics(input: OperationalMetricsInput): Promise<AdminAnalyticsOutput>;
  chatWithAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput>;
}


