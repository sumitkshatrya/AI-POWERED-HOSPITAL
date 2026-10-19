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

export class MockAiProvider implements IAiProvider {
  name = 'MOCK';

  async generatePatientSummary(input: PatientSummaryInput): Promise<PatientSummaryOutput> {
    const visitsCount = input.recentVisits.length;
    const activeMeds = input.currentMedications.map((m) => `${m.medicineName} (${m.dosage}, ${m.frequency})`);
    const conditions = input.majorConditions.length > 0 ? input.majorConditions : ['No chronic conditions documented'];
    const allergies = input.allergies.length > 0 ? input.allergies : ['No known drug allergies (NKDA)'];

    return {
      summaryText: `Patient ${input.patient.firstName} ${input.patient.lastName} (UHID: ${input.patient.uhid}) has ${visitsCount} recent clinical visits documented. Primary active diagnoses include: ${conditions.join(', ')}. Currently managed on ${activeMeds.length} active prescription regimens.`,
      recentVisitsOverview: input.recentVisits.length > 0
        ? `Last visit on ${input.recentVisits[0].date} with Dr. ${input.recentVisits[0].doctorName} (${input.recentVisits[0].department}) for ${input.recentVisits[0].reason || 'routine checkup'}.`
        : 'No recent outpatient or inpatient encounters recorded.',
      activeConditions: conditions,
      activeMedications: activeMeds.length > 0 ? activeMeds : ['No active medications'],
      recentInvestigationsSummary: input.recentInvestigations.length > 0
        ? `${input.recentInvestigations.length} recent lab/radiology investigations completed (${input.recentInvestigations.map((i) => i.testName).join(', ')}).`
        : 'No recent laboratory or diagnostic imaging investigations.',
      allergiesAndRiskFactors: allergies,
      recommendedFollowUps: input.upcomingFollowUps.length > 0 ? input.upcomingFollowUps : ['Follow up as needed per physician advice'],
      disclaimer: 'AI-generated summary — verify against the medical record.',
    };
  }

  async structureClinicalNote(rawNotes: string): Promise<StructuredClinicalNoteOutput> {
    const text = rawNotes.trim();

    // Naive extraction logic for Mock Provider
    let chiefComplaint = 'Patient consultation & symptom evaluation';
    let symptoms: string[] = [];
    let examination = 'Vital signs stable. Physical exam performed.';
    let assessment = 'Clinical evaluation in progress based on reported symptoms.';
    let plan: string[] = ['Maintain adequate hydration', 'Symptomatic medication prescribed'];
    let followUp = 'Follow up in 7 days or sooner if symptoms worsen.';

    if (text.toLowerCase().includes('fever') || text.toLowerCase().includes('cough') || text.toLowerCase().includes('temp')) {
      chiefComplaint = 'Fever and respiratory symptoms';
      symptoms = ['Elevated body temperature', 'Cough and malaise'];
      examination = 'Febrile. Chest clear on auscultation. Throat mild erythema.';
      assessment = 'Acute upper respiratory tract infection / Viral pyrexia';
      plan = ['Tab Paracetamol 500mg PO TID post meals x 5 days', 'Warm saline gargles & rest'];
      followUp = 'Follow up in 3 to 5 days if fever persists.';
    } else if (text.toLowerCase().includes('skin') || text.toLowerCase().includes('rash') || text.toLowerCase().includes('itching')) {
      chiefComplaint = 'Dermatological rash & localized pruritus';
      symptoms = ['Skin redness', 'Pruritus / itching'];
      examination = 'Localized erythematous papules over affected cutaneous region.';
      assessment = 'Contact dermatitis / Cutaneous allergic reaction';
      plan = ['Topical Hydrocortisone cream 1% applied BID', 'Tab Cetirizine 10mg HS x 5 days'];
      followUp = 'Follow up in 1 week if rash spreads.';
    } else if (text.length > 10) {
      chiefComplaint = text.slice(0, 60) + (text.length > 60 ? '...' : '');
      symptoms = [text];
    }

    return {
      chiefComplaint,
      symptoms,
      examination,
      assessment,
      plan,
      followUp,
      disclaimer: 'AI-generated clinical draft — doctor must review and approve before saving.',
    };
  }

  async explainMedicalReport(input: ReportExplanationInput): Promise<ReportExplanationOutput> {
    const isLab = input.reportCategory === 'LABORATORY';
    const title = input.reportTitle;
    const findings = input.findings;

    let explainedTerms: Array<{ term: string; explanation: string }> = [
      { term: 'Reference Range', explanation: 'The expected normal interval for healthy individuals.' },
      { term: 'MCH / Hemoglobin', explanation: 'Proteins in red blood cells that transport oxygen throughout the body.' },
    ];

    if (title.toLowerCase().includes('blood') || title.toLowerCase().includes('cbc')) {
      explainedTerms.push({
        term: 'Complete Blood Count (CBC)',
        explanation: 'A routine blood test measuring red cells, white blood cells, hemoglobin, and platelets.',
      });
    } else if (title.toLowerCase().includes('x-ray') || title.toLowerCase().includes('chest')) {
      explainedTerms = [
        { term: 'Opacity / Infiltrate', explanation: 'Areas on an X-ray image where tissue appears dense or filled with fluid.' },
        { term: 'Consolidation', explanation: 'Solidification of lung tissue caused by fluid, cellular debris, or inflammation.' },
      ];
    }

    return {
      plainLanguageSummary: `This ${isLab ? 'laboratory test' : 'radiology diagnostic scan'} report (${title}) evaluates bodily biological parameters. The clinical findings note: "${findings.slice(0, 150)}...". Overall, key values are documented within specified reference parameters.`,
      explainedTerminology: explainedTerms,
      keyFindingsBreakdown: [
        `Main Result: ${findings}`,
        input.impression ? `Radiologist/Pathologist Impression: ${input.impression}` : 'No abnormal pathology flagged.',
      ],
      recommendedNextSteps: 'Discuss these results with your attending physician during your next scheduled consultation.',
      disclaimer: 'This explanation is for educational purposes only. It is not a medical diagnosis. Please consult your physician.',
    };
  }

  async navigateSpecialty(input: SpecialtyNavigationInput): Promise<SpecialtyNavigationOutput> {
    const query = input.symptomQuery.toLowerCase();

    let specialty = 'General Medicine / Internal Medicine';
    let explanation = 'General Physicians evaluate broad symptoms and provide initial diagnostic workups.';
    let keywords = ['general checkup', 'fever', 'fatigue'];

    if (query.includes('skin') || query.includes('rash') || query.includes('acne') || query.includes('itching') || query.includes('derma')) {
      specialty = 'Dermatology';
      explanation = 'Dermatology specializes in conditions affecting the skin, hair, nails, and cutaneous tissues.';
      keywords = ['skin', 'rash', 'dermatitis', 'eczema', 'itching'];
    } else if (query.includes('heart') || query.includes('chest pain') || query.includes('cardio') || query.includes('palpitations')) {
      specialty = 'Cardiology';
      explanation = 'Cardiology focuses on cardiovascular health, heart function, blood pressure, and vascular system diseases.';
      keywords = ['heart', 'cardiovascular', 'pulse', 'hypertension'];
    } else if (query.includes('bone') || query.includes('joint') || query.includes('fracture') || query.includes('knee') || query.includes('ortho')) {
      specialty = 'Orthopedics';
      explanation = 'Orthopedics specializes in the musculoskeletal system, including bones, joints, ligaments, and tendons.';
      keywords = ['bone', 'joint', 'knee', 'spine', 'fracture'];
    } else if (query.includes('child') || query.includes('baby') || query.includes('infant') || query.includes('pediatric')) {
      specialty = 'Pediatrics';
      explanation = 'Pediatrics provides specialized medical care for infants, children, and adolescents.';
      keywords = ['child', 'pediatric', 'infant', 'vaccination'];
    } else if (query.includes('eye') || query.includes('vision') || query.includes('opthal')) {
      specialty = 'Ophthalmology';
      explanation = 'Ophthalmology focuses on ocular health, vision disorders, and eye care.';
      keywords = ['eye', 'vision', 'cataract', 'optometry'];
    }

    return {
      suggestedSpecialty: specialty,
      explanation: `Based on your query "${input.symptomQuery}", ${explanation}`,
      matchingKeywords: keywords,
      guidanceText: `You can browse available ${specialty} specialists in our doctor directory to book an appointment.`,
      disclaimer: 'This guidance is for navigation purposes only and does not constitute medical advice or diagnosis.',
    };
  }

  async generateAdminAnalytics(input: OperationalMetricsInput): Promise<AdminAnalyticsOutput> {
    const completionRate = input.totalAppointments > 0
      ? Math.round((input.completedAppointments / input.totalAppointments) * 100)
      : 0;

    return {
      operationalOverview: `Hospital Operational Metrics for ${input.timeframeLabel}: Total appointments reached ${input.totalAppointments} with a completion rate of ${completionRate}%. Total gross revenue collected is $${input.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} with $${input.pendingRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending collection. Active patient registry expanded by ${input.newPatientsThisMonth} new patients.`,
      keyMetricsSummary: {
        appointmentsHeadline: `${input.totalAppointments} total appointments (${input.completedAppointments} completed, ${input.cancelledAppointments} cancelled, ${input.noShowCount} no-shows).`,
        financialHeadline: `$${input.totalRevenue.toFixed(2)} collected revenue | $${input.pendingRevenue.toFixed(2)} uncollected balance.`,
        patientGrowthHeadline: `${input.totalPatients} total registered patients (${input.newPatientsThisMonth} new registrations this period).`,
        inventoryAlertHeadline: `${input.lowStockItemsCount} items at low stock reorder level | ${input.expiringItemsCount} items expiring within 30 days.`,
      },
      departmentHighlights: input.activeDepartmentWorkload.length > 0
        ? `Top department workloads: ${input.activeDepartmentWorkload.slice(0, 3).map((d) => `${d.department} (${d.appointmentCount} appts)`).join(', ')}.`
        : 'Department activity evenly distributed.',
      actionableInsights: [
        input.noShowCount > 5
          ? `Address the ${input.noShowCount} patient no-shows by implementing automated SMS/WhatsApp appointment reminders.`
          : 'Maintain current patient appointment reminder flow.',
        input.lowStockItemsCount > 0
          ? `Urgent: Restock ${input.lowStockItemsCount} inventory items currently at reorder threshold.`
          : 'Pharmacy & Hospital inventory levels are within normal operating bounds.',
      ],
      disclaimer: 'Note: Numerical metrics are retrieved directly from database records. Narrative summaries are AI-assisted interpretations.',
    };
  }

  async chatWithAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
    const q = input.message.toLowerCase().trim();
    const role = input.userContext?.role || 'GUEST';
    const userName = input.userContext?.userName ? ` ${input.userContext.userName}` : '';

    // 1. Emergency Red-Flag detection
    if (
      q.includes('chest pain') ||
      q.includes('heart attack') ||
      q.includes('stroke') ||
      q.includes('cannot breathe') ||
      q.includes('shortness of breath') ||
      q.includes('unconscious') ||
      q.includes('severe bleeding') ||
      q.includes('emergency')
    ) {
      return {
        reply: `⚠️ **CRITICAL MEDICAL ALERT**\n\nIf you or someone nearby is experiencing acute chest pain, severe difficulty breathing, sudden numbness/paralysis, or sudden loss of consciousness, **this may be a life-threatening medical emergency**.\n\n### Immediate Steps:\n1. **Call Emergency Services Immediately:** Dial **911 / 112** or our 24/7 Hospital Emergency Hotline.\n2. **Emergency Room:** Go immediately to the nearest Emergency Department.\n3. **Ambulance Dispatch:** You can request immediate ambulance dispatch through the Kshatriya Emergency portal.\n4. **Stay Calm & Seated:** Rest in a comfortable position and do not exert physical effort.`,
        isEmergencyAlert: true,
        category: 'EMERGENCY',
        suggestedActions: [
          { label: '🚨 Open Emergency ER Hub', actionType: 'NAVIGATE', target: '/emergency' },
          { label: '🚑 Request Ambulance Fleet', actionType: 'NAVIGATE', target: '/ambulance' },
          { label: '📞 Call 24/7 Emergency Line', actionType: 'CALL', target: 'tel:911' },
        ],
        suggestedQuestions: [
          'What are the signs of a heart attack vs angina?',
          'What is the hospital emergency ER location?',
          'How to perform basic CPR?',
        ],
        disclaimer: 'DISCLAIMER: AI assistants cannot replace emergency medical services. Seek immediate hospital care for emergencies.',
      };
    }

    // 2. Doctor / Appointment Search
    if (
      q.includes('book') ||
      q.includes('appointment') ||
      q.includes('doctor') ||
      q.includes('specialist') ||
      q.includes('schedule') ||
      q.includes('consultation')
    ) {
      return {
        reply: `Hello${userName}! You can easily browse specialists and schedule consultations on our platform.\n\n### How to Book an Appointment:\n1. **Browse Doctors:** Go to the [Doctor Directory](/doctors) to view specialist profiles, qualifications, ratings, and consultation fees.\n2. **Select Department:** Choose from Cardiology, Dermatology, Pediatrics, Orthopedics, Neurology, General Medicine, and more.\n3. **Choose Slot:** Pick an available date and time that fits your schedule.\n4. **Live OPD Queue:** On the day of your appointment, monitor your live queue token from the [Live OPD Queue](/opd-queue) dashboard!`,
        category: 'DOCTOR_FINDER',
        suggestedActions: [
          { label: '🩺 Browse Doctor Directory', actionType: 'NAVIGATE', target: '/doctors' },
          { label: '📅 Manage Appointments', actionType: 'NAVIGATE', target: '/appointments' },
          { label: '🎟️ View Live OPD Queue', actionType: 'NAVIGATE', target: '/opd-queue' },
        ],
        suggestedQuestions: [
          'Which specialist should I see for persistent back pain?',
          'How does the OPD token display screen work?',
          'What are the consultation hours for Cardiology?',
        ],
        disclaimer: 'Appointments are subject to doctor schedule availability and hospital confirmation.',
      };
    }

    // 3. Lab / Diagnostics / Radiology
    if (
      q.includes('lab') ||
      q.includes('test') ||
      q.includes('blood test') ||
      q.includes('cbc') ||
      q.includes('x-ray') ||
      q.includes('mri') ||
      q.includes('ct scan') ||
      q.includes('radiology') ||
      q.includes('report')
    ) {
      return {
        reply: `### Laboratory & Diagnostic Radiology Services 🧪\n\nKshatriya provides comprehensive digital diagnostics with AI-powered report explanation:\n\n* **Laboratory Investigations:** Routine blood panels (CBC, Lipid, LFT, KFT), HbA1c, urine culture, biomarker tests, and pathology.\n* **Radiology (RIS/PACS):** Digital X-Rays, Ultrasound (USG), CT Scans, MRI, and Mammography.\n* **AI Report Explainer:** You can click "Explain Report" on any lab or imaging test in your EMR to receive a clear, plain-language breakdown of medical findings!\n* **Digital PDF Reports:** Download verified, tamper-proof diagnostic reports directly to your device.`,
        category: 'HOSPITAL_SERVICE',
        suggestedActions: [
          { label: '🧪 Open Lab Management', actionType: 'NAVIGATE', target: '/lab-management' },
          { label: '🩻 View Radiology Dashboard', actionType: 'NAVIGATE', target: '/radiology' },
        ],
        suggestedQuestions: [
          'What is a normal fasting blood sugar level?',
          'How does the AI Report Explainer work?',
          'How long do lab test results usually take?',
        ],
        disclaimer: 'Diagnostic findings should always be interpreted in conjunction with your treating physician.',
      };
    }

    // 4. Pharmacy & Medicines
    if (
      q.includes('medicine') ||
      q.includes('pharmacy') ||
      q.includes('drug') ||
      q.includes('prescription') ||
      q.includes('dosage') ||
      q.includes('paracetamol') ||
      q.includes('antibiotic')
    ) {
      return {
        reply: `### Hospital Pharmacy & Medication Management 💊\n\nOur integrated pharmacy provides 24/7 digital medication dispensing, prescription tracking, and inventory control:\n\n* **Prescriptions:** Access your digital e-prescriptions generated by your doctor during consultations.\n* **Medicine Catalog:** View available pharmaceutical stock, batch numbers, strength, and generic alternatives.\n* **Pharmacy POS:** In-hospital prescription dispensing and automated inventory deduction.\n\n💡 *Always follow your physician\'s exact dosage instructions and finish full courses of prescribed antibiotics.*`,
        category: 'MEDICATION',
        suggestedActions: [
          { label: '💊 Pharmacy Dashboard', actionType: 'NAVIGATE', target: '/pharmacy-dashboard' },
          { label: '📦 Medicine Catalog', actionType: 'NAVIGATE', target: '/pharmacy-medicines' },
          { label: '🛒 Pharmacy POS Sales', actionType: 'NAVIGATE', target: '/pharmacy-sales' },
        ],
        suggestedQuestions: [
          'What are the common side effects of antibiotics?',
          'Can I take Paracetamol with Ibuprofen?',
          'How do I view my active prescriptions?',
        ],
        disclaimer: 'Never start or stop prescription medications without consulting your licensed physician or pharmacist.',
      };
    }

    // 5. Inpatient, Beds, ICU, Blood Bank
    if (
      q.includes('bed') ||
      q.includes('inpatient') ||
      q.includes('admission') ||
      q.includes('icu') ||
      q.includes('blood') ||
      q.includes('donor')
    ) {
      return {
        reply: `### Inpatient, ICU & Blood Bank Operations 🏥\n\n* **Bed Management:** Real-time occupancy tracking for General Wards, Semi-Private, Deluxe Rooms, and Isolation Units.\n* **ICU Telemetry:** Continuous vital tracking, ventilator status, and critical care monitoring.\n* **Blood Bank:** Real-time inventory of blood groups (A+, B+, O+, AB+, etc.), cross-matching, donor registry, and emergency blood requisition.\n* **Discharge Summaries:** AI-assisted discharge summary preparation with comprehensive medication reconciliation.`,
        category: 'HOSPITAL_SERVICE',
        suggestedActions: [
          { label: '🛏️ Bed Management', actionType: 'NAVIGATE', target: '/bed-management' },
          { label: '📈 ICU Dashboard', actionType: 'NAVIGATE', target: '/icu-dashboard' },
          { label: '🩸 Blood Bank', actionType: 'NAVIGATE', target: '/blood-bank' },
        ],
        suggestedQuestions: [
          'What is the current bed availability in General Ward?',
          'How can someone register as a voluntary blood donor?',
          'What are the steps for patient discharge?',
        ],
        disclaimer: 'Inpatient admissions and ICU transfers require physician clinical assessment.',
      };
    }

    // 6. Clinical / Doctor Assistance (if doctor, nurse or clinical query)
    if (
      role === 'DOCTOR' ||
      role === 'NURSE' ||
      q.includes('soap') ||
      q.includes('differential diagnosis') ||
      q.includes('icd') ||
      q.includes('clinical')
    ) {
      return {
        reply: `### Clinical Co-Pilot Workspace 🩺\n\nHello Dr.${userName}, I can assist with clinical documentation, structuring, and reference data:\n\n* **SOAP Note Structuring:** Paste raw clinical notes into the Doctor Workspace to automatically structure Chief Complaint, HPI, Examination, Assessment, and Plan.\n* **Patient Medical Summary:** Generate instantaneous synthesized clinical summaries highlighting chronic conditions, drug allergies, and recent investigations.\n* **Drug Interaction Screening:** Review patient allergy profiles and active medications before finalizing e-prescriptions.\n* **Differential Diagnosis Guidance:** Formulate diagnostic considerations based on presenting symptom constellations.`,
        category: 'CLINICAL_SUPPORT',
        suggestedActions: [
          { label: '📝 Doctor Workspace', actionType: 'NAVIGATE', target: '/doctor/consultation' },
          { label: '📊 Doctor Dashboard', actionType: 'NAVIGATE', target: '/doctor-dashboard' },
          { label: '📋 Clinical Workspace', actionType: 'NAVIGATE', target: '/doctor-workspace' },
        ],
        suggestedQuestions: [
          'How to structure clinical notes into SOAP format automatically?',
          'What are the common differential diagnoses for acute epigastric pain?',
          'Where do I view patient longitudinal vitals history?',
        ],
        disclaimer: 'Clinical AI co-pilot outputs are supportive suggestions. Attending physicians retain sole clinical responsibility.',
      };
    }

    // 7. Common Medical Condition / Symptoms / Health Q&A
    if (
      q.includes('fever') ||
      q.includes('headache') ||
      q.includes('cold') ||
      q.includes('diabetes') ||
      q.includes('blood pressure') ||
      q.includes('hypertension') ||
      q.includes('diet') ||
      q.includes('allergy')
    ) {
      return {
        reply: `### Health Guidance & General Information 🌿\n\nHere is medical context regarding your question:\n\n* **Hydration & Rest:** For common febrile or viral symptoms, maintaining fluid intake and getting 7-9 hours of restful sleep is essential.\n* **Symptom Monitoring:** Track your temperature, pulse, and symptom progression over 24-48 hours.\n* **Lifestyle & Nutrition:** For cardiovascular and metabolic wellness (blood pressure, blood sugar), prioritize whole grains, leafy greens, reduced sodium intake, and moderate daily physical activity.\n* **When to See a Doctor:** If symptoms persist beyond 3 days, temperature exceeds 102°F (38.9°C), or you develop shortness of breath, please book an appointment with our Internal Medicine department.`,
        category: 'MEDICAL_ADVICE',
        suggestedActions: [
          { label: '🩺 Consult a Doctor', actionType: 'NAVIGATE', target: '/doctors' },
          { label: '📅 Book OPD Appointment', actionType: 'NAVIGATE', target: '/appointments' },
        ],
        suggestedQuestions: [
          'What foods help manage high blood pressure?',
          'When is a fever considered dangerously high in adults?',
          'What lifestyle changes improve HbA1c levels?',
        ],
        disclaimer: 'This information is for general educational guidance only and does not substitute for personalized medical diagnosis.',
      };
    }

    // 8. General Platform & Help
    return {
      reply: `### Hello${userName}! I am your Kshatriya AI Health & Hospital Assistant 🤖✨\n\nI can assist you with a wide variety of tasks across our healthcare platform. You can ask me **anything**, such as:\n\n* **Medical & Health Questions:** Symptoms, medication info, first aid, condition explanations, dietary and wellness advice.\n* **Hospital Services & Doctors:** Finding doctors by specialty, booking appointments, checking OPD queue status.\n* **Diagnostics & EMR:** Laboratory orders, radiology imaging, explaining medical reports, inpatient and bed management.\n* **Pharmacy & Billing:** Medicine availability, billing invoices, insurance claims, and emergency services.\n* **Clinical Co-Pilot:** SOAP note drafting, clinical summaries, and operational analytics for hospital staff.\n\n*How can I help you today?*`,
      category: 'GENERAL',
      suggestedActions: [
        { label: '🩺 Find a Doctor', actionType: 'NAVIGATE', target: '/doctors' },
        { label: '📅 Book Appointment', actionType: 'NAVIGATE', target: '/appointments' },
        { label: '🧪 Lab Management', actionType: 'NAVIGATE', target: '/lab-management' },
        { label: '🚨 Emergency ER', actionType: 'NAVIGATE', target: '/emergency' },
      ],
      suggestedQuestions: [
        'How do I schedule an appointment with a specialist?',
        'What should I do if I am feeling dizzy and fatigued?',
        'Explain how the OPD queue token system works',
        'What emergency facilities are available at the hospital?',
      ],
      disclaimer: 'Kshatriya AI Assistant provides informational guidance. Always consult licensed medical professionals for diagnosis.',
    };
  }
}

