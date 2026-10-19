import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService, DoctorListItem } from '../services/doctorService';
import { Star, Award, MapPin, Clock, Video, Calendar, ShieldCheck, CheckCircle2, MessageSquare, ChevronLeft, Globe, DollarSign } from 'lucide-react';

export const DoctorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorListItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'location' | 'reviews'>('about');

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadDoctorProfile(id);
    }
  }, [id]);

  const loadDoctorProfile = async (docId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorService.getDoctorById(docId);
      setDoctor(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!doctor) return;
    try {
      setSubmittingReview(true);
      await doctorService.postDoctorReview(doctor.id, {
        patientId: 'patient-current',
        rating: reviewRating,
        comment: reviewComment,
      });
      setIsReviewModalOpen(false);
      setReviewComment('');
      loadDoctorProfile(doctor.id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-500 font-medium animate-pulse">Loading doctor profile...</div>;
  }

  if (error || !doctor) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button onClick={() => navigate('/doctors')} className="flex items-center text-xs font-semibold text-sky-700 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Directory
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error || 'Doctor profile not found.'}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/doctors')} className="flex items-center text-xs font-semibold text-sky-700 hover:underline">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Doctor Directory
      </button>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-sky-50 shadow-md flex-shrink-0"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">{doctor.name}</h1>
                <p className="text-sm font-semibold text-sky-700">{doctor.specialization} • {doctor.qualification}</p>
              </div>

              <span className="flex items-center text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Reg: {doctor.registrationNumber}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
              <span className="flex items-center">
                <Award className="w-4 h-4 text-amber-500 mr-1" /> {doctor.experience} Years Experience
              </span>
              <span className="flex items-center font-bold text-gray-900">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" /> {doctor.rating} ({doctor.totalReviews} reviews)
              </span>
              <span className="flex items-center text-gray-600">
                <Globe className="w-4 h-4 text-sky-600 mr-1" /> Speaks: {doctor.languages.join(', ')}
              </span>
            </div>

            {/* Fee & Action Button */}
            <div className="pt-4 flex flex-wrap items-center justify-between border-t border-gray-100 gap-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">OPD Consultation Fee</span>
                <span className="text-2xl font-extrabold text-gray-900">${doctor.fee}</span>
                {doctor.followupFee && (
                  <span className="text-xs text-gray-500 ml-2">(Follow-up: ${doctor.followupFee})</span>
                )}
              </div>

              <button
                onClick={() => navigate(`/appointments?doctorId=${doctor.id}`)}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex space-x-1 text-sm font-semibold">
        {(['about', 'availability', 'location', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-2">About Clinical Practice</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{doctor.bio}</p>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3">Clinical Services Provided</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {doctor.services?.map((serv, idx) => (
                  <div key={idx} className="flex items-center text-xs font-semibold text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                    <span>{serv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Weekly OPD & Consultation Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctor.availabilityHours?.map((sch, idx) => (
                <div key={idx} className="p-4 bg-sky-50/60 rounded-xl border border-sky-100">
                  <div className="flex items-center text-xs font-bold text-sky-900 mb-2">
                    <Clock className="w-4 h-4 text-sky-600 mr-1.5" />
                    <span>{sch.day}</span>
                  </div>
                  <div className="space-y-1">
                    {sch.slots.map((slot, sIdx) => (
                      <span key={sIdx} className="block text-xs bg-white text-gray-800 px-2.5 py-1 rounded border border-gray-200 font-medium">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900">Hospital & Branch Location</h3>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">{doctor.hospital?.name}</h4>
                <p className="text-xs text-gray-700 mt-0.5">{doctor.branch?.name} • {doctor.branch?.address}, {doctor.branch?.city}</p>
                <p className="text-xs text-gray-500 mt-1">Department: {doctor.department?.name}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Patient Ratings & Reviews</h3>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Write Review</span>
              </button>
            </div>

            {doctor.reviews?.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4">No reviews submitted yet for this doctor.</p>
            ) : (
              <div className="space-y-3">
                {doctor.reviews?.map((rev) => (
                  <div key={rev.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">
                        {rev.patient ? `${rev.patient.firstName} ${rev.patient.lastName}` : 'Verified Patient'}
                      </span>
                      <div className="flex items-center text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                        <span className="font-bold text-gray-800">{rev.rating} / 5</span>
                      </div>
                    </div>
                    {rev.comment && <p className="text-gray-700 mt-1">{rev.comment}</p>}
                    <span className="text-[10px] text-gray-400 block mt-2">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Write Doctor Review</h3>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Rating (1 to 5 Stars)</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Feedback Comment</label>
              <textarea
                rows={4}
                placeholder="Share your experience regarding diagnosis, consultation quality, and bedside manner..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={submittingReview}
                onClick={handleAddReview}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

