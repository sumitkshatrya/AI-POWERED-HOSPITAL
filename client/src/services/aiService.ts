import api from './api';

export interface PatientSummary {
  summaryText: string;
  recentVisitsOverview: string;
  activeConditions: string[];
  activeMedications: string[];
  recentInvestigationsSummary: string;
  allergiesAndRiskFactors: string[];
  recommendedFollowUps: string[];
  disclaimer: string;
}

export interface StructuredClinicalNote {
  chiefComplaint: string;
  symptoms: string[];
  examination: string;
  assessment: string;
  plan: string[];
  followUp: string;
  disclaimer: string;
}

export interface ReportExplanation {
  plainLanguageSummary: string;
  explainedTerminology: Array<{ term: string; explanation: string }>;
  keyFindingsBreakdown: string[];
  recommendedNextSteps: string;
  disclaimer: string;
}

export interface SpecialtyNavigation {
  suggestedSpecialty: string;
  explanation: string;
  matchingKeywords: string[];
  guidanceText: string;
  disclaimer: string;
}

export interface AdminAnalyticsData {
  metrics: {
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
  };
  aiInterpretation: {
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
  };
}

export interface ChatActionSuggestion {
  label: string;
  actionType: 'NAVIGATE' | 'PROMPT' | 'EMERGENCY' | 'CALL';
  target?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  category?: string;
  isEmergencyAlert?: boolean;
  suggestedActions?: ChatActionSuggestion[];
  suggestedQuestions?: string[];
  disclaimer?: string;
  isError?: boolean;
}

export interface ChatAssistantResponse {
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

export const aiService = {
  chatWithAssistant: async (
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    context?: {
      role?: string;
      currentPage?: string;
      patientId?: string;
      hospitalName?: string;
      branchName?: string;
    }
  ): Promise<ChatAssistantResponse> => {
    const res = await api.post('/ai/chat', {
      message,
      conversationHistory,
      context,
    });
    return res.data.data;
  },

  getPatientSummary: async (patientId: string): Promise<PatientSummary> => {
    const res = await api.get(`/ai/patients/${patientId}/summary`);
    return res.data.data.summary;
  },

  structureClinicalNotes: async (rawNotes: string): Promise<StructuredClinicalNote> => {
    const res = await api.post('/ai/clinical-notes/structure', { rawNotes });
    return res.data.data.structuredNotes;
  },

  explainReport: async (data: {
    reportId?: string;
    reportTitle: string;
    reportCategory: 'LABORATORY' | 'RADIOLOGY';
    findings: string;
    impression?: string;
  }): Promise<ReportExplanation> => {
    const res = await api.post('/ai/reports/explain', data);
    return res.data.data.explanation;
  },

  navigateSpecialty: async (symptomQuery: string): Promise<{ navigation: SpecialtyNavigation; matchingDepartments: any[] }> => {
    const res = await api.post('/ai/specialty-navigation', { symptomQuery });
    return res.data.data;
  },

  getAdminAnalytics: async (timeframe?: string): Promise<AdminAnalyticsData> => {
    const res = await api.get('/ai/admin-analytics', { params: { timeframe } });
    return res.data.data;
  },

  getLogs: async (): Promise<any[]> => {
    const res = await api.get('/ai/logs');
    return res.data.data.logs;
  },
};


