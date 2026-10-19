import crypto from 'crypto';
import { AIInteractionLog } from '../../models/AIInteractionLog';
import {
  IAiProvider,
  PatientSummaryInput,
  PatientSummaryOutput,
  StructuredClinicalNoteOutput,
  ReportExplanationInput,
  ReportExplanationOutput,
  SpecialtyNavigationInput,
  SpecialtyNavigationOutput,
  OperationalMetricsInput,
  AdminAnalyticsOutput,
  ChatAssistantInput,
  ChatAssistantOutput,
} from './aiProvider.interface';
import { MockAiProvider } from './mockAiProvider';
import { GeminiAiProvider } from './geminiAiProvider';

export class AiService {
  private provider: IAiProvider;

  constructor() {
    const providerName = (process.env.AI_PROVIDER || 'mock').toLowerCase();
    if (providerName === 'gemini') {
      this.provider = new GeminiAiProvider();
    } else {
      this.provider = new MockAiProvider();
    }
  }

  private hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  }

  private async logInteraction(params: {
    userId: string;
    userRole: string;
    hospitalId?: string | null;
    branchId?: string | null;
    feature: string;
    promptText: string;
    status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
    latencyMs: number;
    metadata?: any;
  }) {
    try {
      const isValidObjectId = (id?: string | null) => Boolean(id && /^[0-9a-fA-F]{24}$/.test(String(id)));
      await AIInteractionLog.create({
        userId: isValidObjectId(params.userId) ? params.userId : undefined,
        hospitalId: isValidObjectId(params.hospitalId) ? params.hospitalId : undefined,
        prompt: params.promptText,
        response: params.status,
        provider: this.provider.name,
      });
    } catch (err) {
      console.error('Failed to save AI Interaction Log:', err);
    }
  }

  async getPatientSummary(
    input: PatientSummaryInput,
    user: { id: string; role: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<PatientSummaryOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: PatientSummaryOutput;

    try {
      result = await this.provider.generatePatientSummary(input);
    } catch (err) {
      console.warn('AI Provider failed for Patient Summary, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.generatePatientSummary(input);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      feature: 'PATIENT_SUMMARY',
      promptText: `PatientSummary:${input.patient.uhid}`,
      status,
      latencyMs,
      metadata: { patientUhid: input.patient.uhid },
    });

    return result;
  }

  async structureClinicalNote(
    rawNotes: string,
    user: { id: string; role: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<StructuredClinicalNoteOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: StructuredClinicalNoteOutput;

    try {
      result = await this.provider.structureClinicalNote(rawNotes);
    } catch (err) {
      console.warn('AI Provider failed for Clinical Note, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.structureClinicalNote(rawNotes);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      feature: 'CLINICAL_NOTE_STRUCTURER',
      promptText: rawNotes,
      status,
      latencyMs,
    });

    return result;
  }

  async explainMedicalReport(
    input: ReportExplanationInput,
    user: { id: string; role: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<ReportExplanationOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: ReportExplanationOutput;

    try {
      result = await this.provider.explainMedicalReport(input);
    } catch (err) {
      console.warn('AI Provider failed for Report Explanation, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.explainMedicalReport(input);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      feature: 'REPORT_EXPLANATION',
      promptText: `${input.reportCategory}:${input.reportTitle}`,
      status,
      latencyMs,
    });

    return result;
  }

  async navigateSpecialty(
    input: SpecialtyNavigationInput,
    user: { id: string; role: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<SpecialtyNavigationOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: SpecialtyNavigationOutput;

    try {
      result = await this.provider.navigateSpecialty(input);
    } catch (err) {
      console.warn('AI Provider failed for Specialty Navigation, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.navigateSpecialty(input);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      feature: 'APPOINTMENT_NAVIGATION',
      promptText: input.symptomQuery,
      status,
      latencyMs,
    });

    return result;
  }

  async generateAdminAnalytics(
    input: OperationalMetricsInput,
    user: { id: string; role: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<AdminAnalyticsOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: AdminAnalyticsOutput;

    try {
      result = await this.provider.generateAdminAnalytics(input);
    } catch (err) {
      console.warn('AI Provider failed for Admin Analytics, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.generateAdminAnalytics(input);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user.id,
      userRole: user.role,
      hospitalId: user.hospitalId,
      branchId: user.branchId,
      feature: 'ADMIN_ANALYTICS',
      promptText: `AdminAnalytics:${input.timeframeLabel}`,
      status,
      latencyMs,
    });

    return result;
  }

  async chatWithAssistant(
    input: ChatAssistantInput,
    user?: { id?: string; role?: string; hospitalId?: string | null; branchId?: string | null }
  ): Promise<ChatAssistantOutput> {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FALLBACK' | 'ERROR' = 'SUCCESS';
    let result: ChatAssistantOutput;

    try {
      result = await this.provider.chatWithAssistant(input);
    } catch (err) {
      console.warn('AI Provider failed for Chat Assistant, using Mock fallback:', err);
      status = 'FALLBACK';
      const mock = new MockAiProvider();
      result = await mock.chatWithAssistant(input);
    }

    const latencyMs = Date.now() - startTime;
    await this.logInteraction({
      userId: user?.id || 'GUEST',
      userRole: user?.role || 'GUEST',
      hospitalId: user?.hospitalId || undefined,
      branchId: user?.branchId || undefined,
      feature: 'AI_ASSISTANT_CHAT',
      promptText: input.message.slice(0, 100),
      status,
      latencyMs,
      metadata: {
        category: result.category,
        isEmergencyAlert: result.isEmergencyAlert,
      },
    });

    return result;
  }
}

export const aiService = new AiService();

