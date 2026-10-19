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

export class GeminiAiProvider implements IAiProvider {
  name = 'GEMINI';
  private fallbackProvider = new MockAiProvider();
  private apiKey: string | undefined;
  private modelName: string;

  constructor() {
    this.apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    if (this.apiKey && this.isValidApiKey()) {
      console.log(`[Gemini] Authenticated with Google Gemini AI API using model: ${this.modelName}`);
    }
  }

  private isValidApiKey(): boolean {
    return Boolean(
      this.apiKey &&
      (this.apiKey.startsWith('AIza') || this.apiKey.startsWith('AQ.')) &&
      this.apiKey.length > 20 &&
      !this.apiKey.includes('your_')
    );
  }

  async generatePatientSummary(input: PatientSummaryInput): Promise<PatientSummaryOutput> {
    if (!this.isValidApiKey()) {
      return this.fallbackProvider.generatePatientSummary(input);
    }
    try {
      // If valid API key exists, call Gemini REST endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a clinical AI copilot for a hospital platform. Generate a concise, structured patient summary from the following JSON input. Do NOT diagnose.
Input: ${JSON.stringify(input)}

Respond in valid JSON with fields:
summaryText, recentVisitsOverview, activeConditions (array), activeMedications (array), recentInvestigationsSummary, allergiesAndRiskFactors (array), recommendedFollowUps (array).`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error status: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        return {
          ...parsed,
          disclaimer: 'AI-generated summary — verify against the medical record.',
        };
      }
      return this.fallbackProvider.generatePatientSummary(input);
    } catch (err) {
      console.warn('Gemini API call failed, using mock fallback:', err);
      return this.fallbackProvider.generatePatientSummary(input);
    }
  }

  async structureClinicalNote(rawNotes: string): Promise<StructuredClinicalNoteOutput> {
    if (!this.isValidApiKey()) {
      return this.fallbackProvider.structureClinicalNote(rawNotes);
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Structure these clinical notes into SOAP format: "${rawNotes}".
Respond ONLY with valid JSON with keys: chiefComplaint, symptoms (array), examination, assessment, plan (array), followUp.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini status ${response.status} - ${errorText}`);
      }
      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty Gemini response');

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        return {
          ...parsed,
          disclaimer: 'AI-generated clinical draft — doctor must review and approve before saving.',
        };
      }
      return this.fallbackProvider.structureClinicalNote(rawNotes);
    } catch (err) {
      console.warn('Gemini SOAP note structuring failed, using fallback:', err);
      return this.fallbackProvider.structureClinicalNote(rawNotes);
    }
  }

  async explainMedicalReport(input: ReportExplanationInput): Promise<ReportExplanationOutput> {
    return this.fallbackProvider.explainMedicalReport(input);
  }

  async navigateSpecialty(input: SpecialtyNavigationInput): Promise<SpecialtyNavigationOutput> {
    return this.fallbackProvider.navigateSpecialty(input);
  }

  async generateAdminAnalytics(input: OperationalMetricsInput): Promise<AdminAnalyticsOutput> {
    return this.fallbackProvider.generateAdminAnalytics(input);
  }

  async chatWithAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
    if (!this.isValidApiKey()) {
      return this.fallbackProvider.chatWithAssistant(input);
    }

    try {
      const historyContents = (input.conversationHistory || []).map((msg) => ({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const systemPrompt = `You are "Kshatriya AI Assistant", an expert AI Health and Hospital Co-Pilot for a premier multi-tenant hospital management platform.
You can answer ANY question, including:
1. Health & Medical queries (symptoms, common ailments, triage guidance, nutrition, anatomy, first-aid, medication knowledge, medical abbreviations, prevention).
2. Hospital operations & services (Finding doctors, booking appointments, OPD live token queue, laboratory investigations, radiology scans, pharmacy medicines, ICU & bed admissions, ambulance dispatch, blood bank, billing & insurance).
3. Clinical assistance for doctors/nurses (SOAP note drafting tips, differential diagnosis guidance, ICD-10 suggestions, medication dosage considerations).

USER CONTEXT:
- Current Role: ${input.userContext?.role || 'Guest / Visitor'}
- User Name: ${input.userContext?.userName || 'User'}
- Hospital: ${input.userContext?.hospitalName || 'Kshatriya Health System'}
- Current Page: ${input.userContext?.currentPage || 'General'}

SAFETY GUIDELINES:
- If the user describes acute life-threatening emergency symptoms (severe chest pain, breathing arrest, stroke signs, massive hemorrhage), set isEmergencyAlert to true and prioritize emergency guidance.
- Always be empathetic, concise, and structured (use markdown bullet points, bold headers).
- Always output a valid JSON object with the following schema:
{
  "reply": "Your rich, formatted markdown response here...",
  "category": "MEDICAL_ADVICE" | "HOSPITAL_SERVICE" | "DOCTOR_FINDER" | "EMERGENCY" | "MEDICATION" | "GENERAL" | "CLINICAL_SUPPORT",
  "isEmergencyAlert": boolean,
  "suggestedActions": [
    { "label": "Button Label", "actionType": "NAVIGATE" | "PROMPT" | "EMERGENCY" | "CALL", "target": "/doctors" | "/appointments" | "/emergency" | "/lab-management" | "/pharmacy-dashboard" | "/bed-management" }
  ],
  "suggestedQuestions": ["Follow up question 1", "Follow up question 2", "Follow up question 3"],
  "disclaimer": "Informational disclaimer text"
}`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [
            {
              text: 'Understood. I am kshatriya AI Assistant. I will respond to all user queries in the specified JSON structure with helpful, accurate, and safe medical and hospital information.',
            },
          ],
        },
        ...historyContents,
        {
          role: 'user',
          parts: [{ text: input.message }],
        },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        return {
          reply: parsed.reply || text,
          category: parsed.category || 'GENERAL',
          isEmergencyAlert: parsed.isEmergencyAlert || false,
          suggestedActions: parsed.suggestedActions || [],
          suggestedQuestions: parsed.suggestedQuestions || [],
          disclaimer:
            parsed.disclaimer ||
            'Kshatriya AI Assistant provides informational guidance. Consult a medical doctor for definitive diagnosis.',
        };
      }

      // If plain text was returned instead of JSON
      return {
        reply: text,
        category: 'GENERAL',
        isEmergencyAlert: false,
        suggestedActions: [
          { label: '🩺 Browse Doctors', actionType: 'NAVIGATE', target: '/doctors' },
          { label: '📅 Book Appointment', actionType: 'NAVIGATE', target: '/appointments' },
        ],
        suggestedQuestions: ['Can you elaborate on that?', 'How do I consult a specialist?'],
        disclaimer: 'kshatriya AI Assistant provides informational guidance.',
      };
    } catch (err) {
      console.warn('Gemini chat failed, fallback to mock AI:', err);
      return this.fallbackProvider.chatWithAssistant(input);
    }
  }
}

