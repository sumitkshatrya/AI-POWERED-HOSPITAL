import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService, DoctorListItem } from '../services/doctorService';
import { Search, Filter, Star, Calendar, MapPin, Stethoscope, Video, ChevronLeft, ChevronRight, DollarSign, Award, Clock, Sparkles } from 'lucide-react';
import { AiSpecialtyNavigatorWidget } from '../components/AiSpecialtyNavigatorWidget';

const POPULAR_TREATMENTS = [
  { label: 'All Specialists', query: '', specialty: '' },
  { label: '🦴 Knee & Joint Surgery', query: 'knee replacement', specialty: 'Orthopedics' },
  { label: '❤️ Bypass & Heart Care', query: 'bypass surgery', specialty: 'Cardiology' },
  { label: '🧠 Migraine & Stroke', query: 'migraine', specialty: 'Neurology' },
  { label: '🧴 Skin, Acne & Hair', query: 'skin allergy', specialty: 'Dermatology' },
  { label: '👶 Pregnancy & Delivery', query: 'pregnancy', specialty: 'Gynecology' },
  { label: '🩺 Diabetes & Thyroid', query: 'diabetes', specialty: 'General Medicine' },
  { label: '🦷 Dental & Teeth', query: 'teeth', specialty: 'Dentistry' },
];

export const DoctorDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('treatment') || searchParams.get('query') || '';
  const initialSpecialty = searchParams.get('specialty') || searchParams.get('department') || '';

  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [specialty, setSpecialty] = useState<string>(initialSpecialty);
  const [location, setLocation] = useState<string>('');
  const [isOnlineAvailable, setIsOnlineAvailable] = useState<boolean>(false);
  const [maxFee, setMaxFee] = useState<number>(500);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 9 });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await doctorService.getDoctors({
        search: debouncedSearch || undefined,
        specialty: specialty || undefined,
        location: location || undefined,
        isOnlineAvailable: isOnlineAvailable || undefined,
        maxFee: maxFee < 500 ? maxFee : undefined,
        sortBy,
        page,
        limit: 9,
      });
      setDoctors(res.doctors);
      setPagination(res.pagination || { total: 0, totalPages: 1, limit: 9 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load doctor directory.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, specialty, location, isOnlineAvailable, maxFee, sortBy, page]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const handleBookAppt = (doctorId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { state: { redirectTo: `/appointments?doctorId=${doctorId}` } });
    } else {
      navigate(`/appointments?doctorId=${doctorId}`);
    }
  };

  const handleTreatmentChipClick = (t: { query: string; specialty: string }) => {
    setSearch(t.query);
    setSpecialty(t.specialty);
    setPage(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-sky-500/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3 text-sky-200 border border-sky-400/30">
            Find Top Healthcare Specialists & Treatments
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Doctor & Treatment Directory</h1>
          <p className="mt-2 text-sky-100 text-sm sm:text-base leading-relaxed">
            Search verified clinical experts by specific treatment (e.g. Knee Replacement, Bypass, Acne), symptoms, or specialty. Accessible to everyone without login.
          </p>
        </div>
      </div>

      {/* AI Smart Specialty Navigator */}
      <AiSpecialtyNavigatorWidget
        onSelectSpecialty={(spec) => {
          setSpecialty(spec);
          setSearch('');
          setPage(1);
        }}
      />

      {/* Search Bar & Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {/* Popular Treatment Filter Chips */}
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Popular Treatments & Conditions:
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TREATMENTS.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTreatmentChipClick(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  search === t.query && (!t.specialty || specialty === t.specialty)
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          {/* Debounced Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search treatment (e.g. Knee Surgery, Bypass), doctor, or symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Specialty Filter */}
          <div>
            <select
              value={specialty}
              onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Gynecology">Gynecology & Obstetrics</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Dentistry">Dentistry</option>
              <option value="Ophthalmology">Ophthalmology</option>
            </select>
          </div>

          {/* Location Search */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by City / Location"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Online Consultation Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOnlineAvailable}
                onChange={(e) => { setIsOnlineAvailable(e.target.checked); setPage(1); }}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
              />
              <span className="flex items-center text-gray-700 font-medium">
                <Video className="w-3.5 h-3.5 text-sky-600 mr-1" /> Online Video Consultation
              </span>
            </label>

            {/* Max Fee Filter */}
            <div className="flex items-center space-x-2">
              <span>Max Fee:</span>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={maxFee}
                onChange={(e) => { setMaxFee(Number(e.target.value)); setPage(1); }}
                className="w-24 accent-sky-600"
              />
              <span className="font-bold text-gray-900">${maxFee === 500 ? 'Any' : maxFee}</span>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2">
            <span>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold text-gray-800"
            >
              <option value="rating">Highest Rating</option>
              <option value="experience">Years of Experience</option>
              <option value="fee">Consultation Fee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 font-medium animate-pulse">Loading doctors directory...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No doctors found matching your search filters.</p>
        </div>
      ) : (
        /* Doctor Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                {/* Doctor Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-sky-100 flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-gray-900 hover:text-sky-600 transition-colors cursor-pointer" onClick={() => navigate(`/doctors/${doc.id}`)}>
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded inline-block mt-0.5">
                      {doc.specialization}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{doc.qualification}</p>
                  </div>
                </div>

                {/* Badges & Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-gray-100 mb-4 bg-gray-50/50 rounded-lg p-2.5">
                  <div className="flex items-center text-gray-700">
                    <Award className="w-3.5 h-3.5 text-amber-500 mr-1.5 flex-shrink-0" />
                    <span>{doc.experience} Years Exp.</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1.5 flex-shrink-0" />
                    <span>{doc.rating} ({doc.totalReviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-gray-700 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{doc.hospital?.name || 'City General Hospital'} • {doc.branch?.city || 'Metropolis'}</span>
                  </div>
                </div>
              </div>

              {/* Footer Fee & Action Buttons */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider block">Consultation Fee</span>
                    <span className="text-lg font-bold text-gray-900">${doc.fee}</span>
                  </div>
                  {doc.isOnlineAvailable && (
                    <span className="flex items-center text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 rounded border border-emerald-200">
                      <Video className="w-3 h-3 mr-1" /> Video Available
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/doctors/${doc.id}`)}
                    className="w-full py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleBookAppt(doc.id)}
                    className="w-full py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                  >
                    Book Appt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{pagination.totalPages}</strong> ({pagination.total} total doctors)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

