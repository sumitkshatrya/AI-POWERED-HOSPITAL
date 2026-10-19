import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AiAssistantChatBox } from '../components/AiAssistantChatBox';
import {
  Sparkles,
  Bot,
  Stethoscope,
  Calendar,
  Activity,
  Pill,
  Siren,
  Shield,
  FileText,
  Search,
  ChevronRight,
  Zap,
  HelpCircle,
  Brain,
  MessageSquareText,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const promptCategories = [
    { id: 'all', label: 'All Capabilities', icon: Sparkles },
    { id: 'symptoms', label: 'Symptoms & Triage', icon: Stethoscope },
    { id: 'doctors', label: 'Doctors & Appointments', icon: Calendar },
    { id: 'diagnostics', label: 'Labs & Radiology', icon: Activity },
    { id: 'pharmacy', label: 'Medicines & Drugs', icon: Pill },
    { id: 'emergency', label: 'Emergency & ICU', icon: Siren },
    { id: 'clinical', label: 'Clinical Documentation', icon: FileText },
  ];

  const samplePrompts = [
    {
      category: 'symptoms',
      title: 'Acute Fever & Cough Evaluation',
      query: 'I have a high fever (102°F), dry cough, and headache for 3 days. What are the potential causes and when should I see a doctor?',
      description: 'Get structured symptom triage, red-flag checklists, and self-care recommendations.',
      badge: 'Symptom Triage',
      color: 'border-amber-200 bg-amber-50/60 text-amber-700',
    },
    {
      category: 'symptoms',
      title: 'Chest Discomfort vs Acid Reflux',
      query: 'How do I differentiate between heart-related chest pressure and acid reflux or gastroesophageal pain?',
      description: 'Review critical cardiac red-flags and non-emergency digestive symptoms.',
      badge: 'Cardiac Triage',
      color: 'border-red-200 bg-red-50/60 text-red-700',
    },
    {
      category: 'doctors',
      title: 'Find Available Cardiologist',
      query: 'What Cardiology specialists are available this week for a consultation regarding hypertension and palpitations?',
      description: 'Find matching specialists, view qualifications, and check consultation booking procedures.',
      badge: 'Doctor Finder',
      color: 'border-sky-200 bg-sky-50/60 text-sky-700',
    },
    {
      category: 'doctors',
      title: 'OPD Token Queue Workflow',
      query: 'Explain how the hospital live OPD queue and token display system works for patients arriving at the clinic.',
      description: 'Understand live token calling, estimated wait times, and consultation room tracking.',
      badge: 'OPD Queue',
      color: 'border-blue-200 bg-blue-50/60 text-blue-700',
    },
    {
      category: 'diagnostics',
      title: 'Explain Blood Panel & CBC Values',
      query: 'Explain Complete Blood Count (CBC) markers: Hemoglobin, WBC count, Platelets, and MCV in plain terminology.',
      description: 'Plain-language interpretation of standard reference ranges and abnormal findings.',
      badge: 'Lab Explainer',
      color: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
    },
    {
      category: 'diagnostics',
      title: 'CT Scan vs MRI Comparison',
      query: 'What is the clinical difference between a CT scan and an MRI for diagnosing severe chronic headaches?',
      description: 'Comparative guidance on diagnostic modalities, radiation considerations, and prep time.',
      badge: 'Radiology RIS',
      color: 'border-indigo-200 bg-indigo-50/60 text-indigo-700',
    },
    {
      category: 'pharmacy',
      title: 'Drug Interaction Guidance',
      query: 'Are there any known adverse interactions between Metformin (for diabetes) and Ibuprofen (NSAID)?',
      description: 'Pharmaceutical safety screening, renal considerations, and recommended monitoring.',
      badge: 'Pharmacy Safety',
      color: 'border-purple-200 bg-purple-50/60 text-purple-700',
    },
    {
      category: 'emergency',
      title: 'Emergency ER Admission & Ambulance',
      query: 'What emergency life support facilities are available, and how quickly can an ambulance fleet be dispatched?',
      description: 'Direct access to Emergency trauma response, cardiac ICU, and 24/7 ambulance tracking.',
      badge: 'Emergency Hotline',
      color: 'border-rose-200 bg-rose-50/60 text-rose-700',
    },
    {
      category: 'clinical',
      title: 'SOAP Note Structuring Assistant',
      query: 'Draft a comprehensive SOAP note for a 52-year-old patient diagnosed with Type 2 Diabetes with peripheral neuropathy.',
      description: 'Assist doctors and nurses in standardizing SOAP documentation and management plans.',
      badge: 'Doctor Co-Pilot',
      color: 'border-teal-200 bg-teal-50/60 text-teal-700',
    },
  ];

  const filteredPrompts = samplePrompts.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      !searchFilter ||
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-900 text-white p-8 md:p-12 shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-60 h-60 rounded-full bg-sky-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
              Next-Gen Medical & Hospital Intelligence
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Kshatriya AI Assistant
            </h1>

            <p className="text-base sm:text-lg text-sky-100 leading-relaxed">
              Ask anything across clinical operations, medical knowledge, diagnostic explanations, doctor availability,
              and hospital workflows. Powered by Google Gemini and advanced healthcare AI algorithms.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-sky-200 font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <Brain className="w-4 h-4 text-sky-300" />
                <span>Multi-Turn Gemini Engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-200 font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <Shield className="w-4 h-4 text-emerald-300" />
                <span>HIPAA & RBAC Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-sky-200 font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <Zap className="w-4 h-4 text-amber-300" />
                <span>24/7 Live Triage Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid / Quick Portal Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => navigate('/doctors')}
            className="group cursor-pointer p-5 bg-white rounded-2xl border border-gray-200 hover:border-sky-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Doctor Directory</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Explore specialized doctors across 20+ departments with ratings, slots, and fees.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-sky-600 group-hover:text-sky-800">
              <span>Browse Specialists</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/lab-management')}
            className="group cursor-pointer p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">AI Diagnostics & Labs</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Receive plain-language AI explanations for complex blood panels, pathology, and X-Rays.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
              <span>View Lab Portal</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          <div
            onClick={() => navigate('/emergency')}
            className="group cursor-pointer p-5 bg-white rounded-2xl border border-gray-200 hover:border-rose-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Siren className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Emergency ER & Fleet</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                24/7 critical trauma triage, ambulance fleet dispatch, and ICU emergency transfers.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-rose-600 group-hover:text-rose-800">
              <span>Emergency Center</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>

        {/* Prompt Library Header & Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-sky-600" />
                Prompt & Knowledge Explorer
              </h2>
              <p className="text-xs text-gray-500">
                Click any scenario below to activate instant guidance in the floating AI Assistant chat box.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, symptoms, drugs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {promptCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Prompts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredPrompts.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 hover:border-sky-300 bg-gray-50/40 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
                      {p.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{p.title}</h4>
                  <p className="text-xs text-gray-600 mb-3">{p.description}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700 italic flex items-start gap-2">
                  <span className="text-sky-500 font-bold">"</span>
                  <span className="line-clamp-2">{p.query}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Compliance Notice */}
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-start gap-3">
          <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Medical AI Safeguard Notice</p>
            <p className="text-sky-800 leading-relaxed">
              Kshatriya AI Assistant uses state-of-the-art clinical machine learning and natural language processing to assist
              patients and staff. AI responses are generated for educational and navigational support and should not replace
              direct clinical evaluation from licensed healthcare professionals. In severe emergencies, call 911/112 immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AiAssistantPage;
