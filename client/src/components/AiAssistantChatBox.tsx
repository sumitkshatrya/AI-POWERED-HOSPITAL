import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiService, ChatMessage, ChatActionSuggestion } from '../services/aiService';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  AlertTriangle,
  Bot,
  User as UserIcon,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Shield,
  Stethoscope,
  Pill,
  Calendar,
  Activity,
  Siren,
  HelpCircle,
} from 'lucide-react';

interface QuickPrompt {
  label: string;
  icon: React.ElementType;
  text: string;
  category: string;
}

export const AiAssistantChatBox: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const getInitialMessages = (): ChatMessage[] => {
    const welcomeGreeting = user
      ? `Hello **${user.firstName}**! I'm your **Kshatriya AI Assistant**.`
      : "Hello! I'm your **Kshatriya AI Assistant**.";

    const roleDetail = user
      ? `I see you're logged in as **${user.role}** at **${user.hospital?.name || 'Kshatriya Health System'}**.`
      : 'You can ask me **anything** about hospital services, find doctors, book appointments, check symptoms, or explore medical information.';

    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `${welcomeGreeting} ${roleDetail}\n\n### What would you like help with today?\n* 🩺 **Symptom Triage & Health Guidance**\n* 📅 **Find Doctors & Schedule Appointments**\n* 🧪 **Laboratory & Diagnostic Radiology Reports**\n* 💊 **Pharmacy & Medication Information**\n* 🚨 **Emergency Care & Ambulance Dispatch**\n* 📝 **Clinical Notes & Medical Summaries**`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'GENERAL',
        suggestedActions: [
          { label: '🩺 Browse Doctors', actionType: 'NAVIGATE', target: '/doctors' },
          { label: '📅 Book Appointment', actionType: 'NAVIGATE', target: '/appointments' },
          { label: '🚨 Emergency Hub', actionType: 'NAVIGATE', target: '/emergency' },
        ],
        suggestedQuestions: [
          'What are the symptoms of acute appendicitis?',
          'How do I find a top Cardiologist?',
          'Explain how the OPD Token Queue works',
          'Can I take Paracetamol with Ibuprofen?',
        ],
        disclaimer: 'Kshatriya AI Assistant provides clinical & operational guidance. Always consult a licensed doctor for emergency or diagnostic decisions.',
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('aegis_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return getInitialMessages();
  });

  // Persist messages to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('aegis_ai_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Audio effects
  const playChime = (type: 'send' | 'receive' | 'alert') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // audio context not allowed
    }
  };

  // Speech Recognition (Speech to Text)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Text to Speech
  const speakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text to speech is not supported in this browser.');
      return;
    }

    if (isSpeaking && activeSpeechId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/#+\s/g, '')
      .replace(/[*_`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/⚠️|🚨|🧪|💊|🩺|📅|🏥|🎟️/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechId(null);
    };

    setIsSpeaking(true);
    setActiveSpeechId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy text
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);
    playChime('send');

    try {
      // Build conversation history excluding errors
      const history = updatedMessages
        .slice(-8)
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const context = {
        role: user?.role,
        currentPage: location.pathname,
        hospitalName: user?.hospital?.name,
        branchName: user?.branch?.name,
      };

      const response = await aiService.chatWithAssistant(text, history, context);

      const aiMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: response.category,
        isEmergencyAlert: response.isEmergencyAlert,
        suggestedActions: response.suggestedActions,
        suggestedQuestions: response.suggestedQuestions,
        disclaimer: response.disclaimer,
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (response.isEmergencyAlert) {
        playChime('alert');
      } else {
        playChime('receive');
      }
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content:
          "I'm sorry, I encountered a temporary connection issue. Please check your network or try asking your question again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        disclaimer: 'System status warning.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setActiveSpeechId(null);
      }
      setMessages(getInitialMessages());
      try {
        sessionStorage.removeItem('aegis_ai_chat_history');
      } catch {
        // ignore
      }
    }
  };

  const handleActionClick = (action: ChatActionSuggestion) => {
    if (action.actionType === 'NAVIGATE' && action.target) {
      navigate(action.target);
      // Optional: keep widget open or minimize
    } else if (action.actionType === 'PROMPT' && action.target) {
      handleSendMessage(action.target);
    } else if (action.actionType === 'CALL' && action.target) {
      window.location.href = action.target;
    } else if (action.actionType === 'EMERGENCY') {
      navigate('/emergency');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick starter prompt library
  const quickPrompts: QuickPrompt[] = [
    {
      label: 'Symptom Triage',
      icon: Stethoscope,
      text: 'I have a high fever with persistent cough and fatigue. What should I do?',
      category: 'Symptoms',
    },
    {
      label: 'Book Doctor',
      icon: Calendar,
      text: 'How can I find and book an appointment with an experienced Cardiologist?',
      category: 'Appointments',
    },
    {
      label: 'Explain Lab Test',
      icon: Activity,
      text: 'Explain what HbA1c and Complete Blood Count (CBC) test results indicate.',
      category: 'Diagnostics',
    },
    {
      label: 'Emergency ER',
      icon: Siren,
      text: 'What are the red-flag emergency symptoms requiring immediate hospitalization?',
      category: 'Emergency',
    },
    {
      label: 'Medication Guide',
      icon: Pill,
      text: 'What precautions should be taken when taking prescription antibiotics?',
      category: 'Pharmacy',
    },
    ...(user?.role === 'DOCTOR' || user?.role === 'NURSE'
      ? [
          {
            label: 'Clinical SOAP Note',
            icon: Sparkles,
            text: 'Help draft a SOAP assessment for a 45-year-old patient with acute gastroenteritis.',
            category: 'Clinical',
          },
        ]
      : []),
  ];

  // Helper to render markdown-like formatting in messages
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Heading 3: ###
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-gray-900 text-sm mt-3 mb-1 flex items-center gap-1.5">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Heading 2 / 1
          if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-bold text-gray-900 text-base mt-3 mb-1">
                {trimmed.replace(/^#+\s/, '')}
              </h3>
            );
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const text = trimmed.replace(/^[\*\-•]\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-sky-500 font-bold mt-0.5">•</span>
                <span>{renderInlineMarkdown(text)}</span>
              </div>
            );
          }

          // Numbered lists: e.g. 1.
          const numberedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numberedMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-bold text-sky-600 min-w-[1.2rem]">{numberedMatch[1]}.</span>
                <span>{renderInlineMarkdown(numberedMatch[2])}</span>
              </div>
            );
          }

          // Alert warning box
          if (trimmed.startsWith('⚠️') || trimmed.includes('CRITICAL MEDICAL ALERT')) {
            return (
              <div
                key={idx}
                className="bg-red-50 border-l-4 border-red-500 text-red-800 p-2.5 rounded-r my-2 text-xs font-semibold"
              >
                {renderInlineMarkdown(trimmed)}
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{renderInlineMarkdown(line)}</p>;
        })}
      </div>
    );
  };

  // Helper for inline markdown: bold, italics, links, codes
  const renderInlineMarkdown = (text: string) => {
    // Replace **bold** with <strong>
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\)|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Markdown link [label](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        return (
          <button
            key={index}
            onClick={() => {
              if (url.startsWith('http')) {
                window.open(url, '_blank');
              } else {
                navigate(url);
              }
            }}
            className="text-sky-600 font-semibold underline hover:text-sky-800 inline-flex items-center gap-0.5 mx-0.5"
          >
            {label}
            <ExternalLink className="w-3 h-3 inline" />
          </button>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Tooltip badge */}
          <div className="hidden lg:flex items-center bg-gray-900 text-white text-xs font-semibold py-1.5 px-3.5 rounded-full shadow-lg border border-gray-700 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 mr-1.5 animate-pulse" />
            Ask AI Assistant Anything
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Assistant Chat"
            className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white focus:outline-none focus:ring-4 focus:ring-sky-300"
          >
            {/* Animated glowing pulse aura */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-500 animate-pulse"></span>

            <div className="relative flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} />
              <Bot className="w-6 h-6 absolute text-white" />
            </div>

            {/* Online Indicator Badge */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-2xl flex flex-col bg-white border border-gray-200 overflow-hidden ${
            isExpanded
              ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:w-[750px] md:h-[calc(100vh-2rem)]'
              : 'bottom-6 right-6 w-[94vw] sm:w-[440px] h-[640px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 text-white px-4 py-3.5 flex items-center justify-between select-none shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 text-white">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white tracking-wide">Kshatriya AI Assistant</h3>
                  <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-300/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gemini Live
                  </span>
                </div>
                <p className="text-[11px] text-sky-100 font-medium truncate max-w-[200px] sm:max-w-none">
                  {user ? `${user.firstName} (${user.role})` : 'Instant 24/7 Medical & Hospital Co-Pilot'}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
                className="p-1.5 rounded-lg hover:bg-white/20 text-sky-100 hover:text-white transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-300" />}
              </button>

              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-1.5 rounded-lg hover:bg-white/20 text-sky-100 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore Window Size' : 'Maximize Window'}
                className="hidden sm:block p-1.5 rounded-lg hover:bg-white/20 text-sky-100 hover:text-white transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setActiveSpeechId(null);
                  }
                  setIsOpen(false);
                }}
                title="Close AI Assistant"
                className="p-1.5 rounded-lg hover:bg-red-500/80 text-white transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel / Badges Bar */}
          <div className="bg-slate-50 border-b border-gray-200 px-3 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-thin text-xs">
            <span className="text-gray-400 font-semibold uppercase text-[10px] flex items-center gap-1 flex-shrink-0">
              <HelpCircle className="w-3 h-3 text-sky-500" /> Prompts:
            </span>
            {quickPrompts.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.text)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 whitespace-nowrap bg-white hover:bg-sky-50 hover:border-sky-300 text-gray-700 hover:text-sky-700 px-2.5 py-1 rounded-full border border-gray-200 text-xs font-medium transition-all shadow-2xs flex-shrink-0"
                >
                  <Icon className="w-3 h-3 text-sky-600" />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isError = msg.isError;
              const isEmergency = msg.isEmergencyAlert;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-tr from-sky-600 to-blue-700'
                        : isEmergency
                        ? 'bg-red-600 animate-bounce'
                        : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                    }`}
                  >
                    {isUser ? (
                      <UserIcon className="w-4 h-4" />
                    ) : isEmergency ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-yellow-200" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm relative group ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : isEmergency
                        ? 'bg-red-50 border border-red-300 text-gray-900 rounded-tl-none'
                        : isError
                        ? 'bg-amber-50 border border-amber-300 text-gray-900 rounded-tl-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}
                  >
                    {/* Role & Time header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          isUser ? 'text-sky-100' : isEmergency ? 'text-red-700 font-bold' : 'text-gray-400'
                        }`}
                      >
                        {isUser ? 'You' : isEmergency ? '🚨 Emergency Notice' : 'Kshatriya AI'}
                      </span>
                      <span className={`text-[10px] ${isUser ? 'text-sky-200' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Content */}
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="text-sm text-gray-800">{renderFormattedContent(msg.content)}</div>
                    )}

                    {/* Action suggestions (Interactive navigation buttons) */}
                    {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleActionClick(act)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors shadow-2xs"
                          >
                            <span>{act.label}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Follow-up question chips */}
                    {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-[11px] font-semibold text-gray-400 mb-1.5">Suggested follow-ups:</p>
                        <div className="flex flex-col gap-1">
                          {msg.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSendMessage(q)}
                              disabled={isLoading}
                              className="text-left text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50/80 p-1.5 rounded border border-dashed border-sky-200 transition-colors flex items-center justify-between group"
                            >
                              <span>{q}</span>
                              <ChevronRight className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer */}
                    {!isUser && msg.disclaimer && (
                      <div className="mt-2.5 pt-1.5 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-400 italic">
                        <Shield className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{msg.disclaimer}</span>
                      </div>
                    )}

                    {/* AI Message Action Buttons (Copy, Speak) */}
                    {!isUser && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md p-0.5 shadow-xs">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          title="Copy text"
                          className="p-1 rounded text-gray-500 hover:text-sky-600 hover:bg-gray-100 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => speakText(msg.content, msg.id)}
                          title={isSpeaking && activeSpeechId === msg.id ? 'Stop reading' : 'Read aloud'}
                          className={`p-1 rounded transition-colors ${
                            isSpeaking && activeSpeechId === msg.id
                              ? 'text-red-600 bg-red-50'
                              : 'text-gray-500 hover:text-sky-600 hover:bg-gray-100'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-yellow-200 animate-spin" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[80%] flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-medium">Kshatriya AI is analyzing...</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? 'Listening... click to stop' : 'Voice Input (Speak)'}
                className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Textarea Input */}
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening to your speech...' : 'Ask anything (symptoms, doctors, medicines, tests)...'}
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all max-h-28 overflow-y-auto leading-normal"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:from-sky-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0 flex items-center justify-center"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span>Press <b>Enter</b> to send, <b>Shift+Enter</b> for newline</span>
              <span>⚡ Gemini Intelligence</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
