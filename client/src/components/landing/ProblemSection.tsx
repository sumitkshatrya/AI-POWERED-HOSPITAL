import React from 'react';
import { Layers, Clock, UserX, EyeOff } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: Layers,
      title: 'Fragmented Systems',
      description: 'Patient information, lab reports, and billing records are spread across disconnected tools and manual logbooks.',
    },
    {
      icon: Clock,
      title: 'Manual Operations',
      description: 'Paper appointments, manual queue management, hand-written prescriptions, and delayed inventory updates consume staff time.',
    },
    {
      icon: UserX,
      title: 'Poor Patient Experience',
      description: 'Patients face long wait times, struggle to find doctors, and find it difficult to retrieve diagnostic reports or past records.',
    },
    {
      icon: EyeOff,
      title: 'Limited Visibility',
      description: 'Hospital administrators lack real-time operational insights into bed occupancy, daily revenue, and department bottlenecks.',
    },
  ];

  return (
    <section className="py-20 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Healthcare shouldn't feel this complicated.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-4">
            Legacy hospital operations suffer from fragmented tools, administrative delays, and lost medical context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition relative group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{prob.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{prob.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
