import { Request, Response, NextFunction } from 'express';
import { Doctor, User, Department, Branch, Hospital, Appointment, Consultation, Review, DoctorSchedule } from '../models';
import { updateDoctorProfileSchema, createDoctorReviewSchema } from '../schemas/doctor.schema';
import { doctorScheduleSchema } from '../schemas/appointment.schema';
import { NotFoundError, UnauthorizedError } from '../utils/errors';
import { safeJsonParseArray } from '../utils/json';

const formatDoctor = (doc: any) => {
  const userObj: any = doc.userId && typeof doc.userId === 'object' ? doc.userId : null;
  const deptObj: any = doc.departmentId && typeof doc.departmentId === 'object' ? doc.departmentId : null;
  const branchObj: any = doc.branchId && typeof doc.branchId === 'object' ? doc.branchId : null;
  const hospitalObj: any = doc.hospitalId && typeof doc.hospitalId === 'object' ? doc.hospitalId : null;

  return {
    id: doc._id ? doc._id.toString() : doc.id,
    _id: doc._id,
    userId: userObj ? userObj._id.toString() : doc.userId?.toString() || null,
    name: userObj ? `Dr. ${userObj.firstName} ${userObj.lastName}` : 'Doctor',
    photo: userObj?.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    registrationNumber: doc.registrationNumber || null,
    qualification: doc.qualifications || null,
    qualifications: doc.qualifications || null,
    specialization: doc.specialization,
    experience: doc.experience || 0,
    languages: Array.isArray(doc.languages) ? doc.languages : safeJsonParseArray(doc.languages, ['English']),
    fee: doc.consultationFee || 0,
    consultationFee: doc.consultationFee || 0,
    followupFee: doc.consultationFee || 0,
    rating: doc.rating || 0,
    totalReviews: doc.totalReviews || 0,
    bio: doc.bio || 'Experienced clinical specialist dedicated to patient-centered care.',
    services: Array.isArray(doc.services) ? doc.services : safeJsonParseArray(doc.services),
    isOnlineAvailable: doc.onlineConsultation || false,
    onlineConsultation: doc.onlineConsultation || false,
    isAvailable: doc.isAvailable !== false,
    hospital: hospitalObj ? { id: hospitalObj._id.toString(), name: hospitalObj.name, logoUrl: hospitalObj.logo || null } : null,
    branch: branchObj ? { id: branchObj._id.toString(), name: branchObj.name, city: branchObj.address, address: branchObj.address } : null,
    department: deptObj ? { id: deptObj._id.toString(), name: deptObj.name, code: deptObj.code || null } : null,
  };
};

const TREATMENT_TO_SPECIALTY: Record<string, string[]> = {
  'heart attack': ['Cardiology', 'Interventional Cardiology'],
  'bypass surgery': ['Cardiothoracic Surgery', 'Cardiology'],
  'chest pain': ['Cardiology', 'General Medicine'],
  'heart': ['Cardiology'],
  'cardiac': ['Cardiology'],
  'knee replacement': ['Orthopedics', 'Joint Replacement'],
  'joint pain': ['Orthopedics', 'Rheumatology'],
  'fracture': ['Orthopedics', 'Trauma Surgery'],
  'bone': ['Orthopedics'],
  'migraine': ['Neurology'],
  'brain stroke': ['Neurology', 'Neurosurgery'],
  'nerve': ['Neurology'],
  'skin allergy': ['Dermatology'],
  'acne': ['Dermatology'],
  'hair fall': ['Dermatology', 'Trichology'],
  'skin': ['Dermatology'],
  'pregnancy': ['Gynecology', 'Obstetrics & Gynecology'],
  'c-section': ['Gynecology', 'Obstetrics & Gynecology'],
  'delivery': ['Gynecology', 'Obstetrics & Gynecology'],
  'diabetes': ['Endocrinology', 'General Medicine'],
  'thyroid': ['Endocrinology'],
  'fever': ['General Medicine', 'Internal Medicine'],
  'cough': ['General Medicine', 'Pulmonology'],
  'cold': ['General Medicine'],
  'kidney stone': ['Urology', 'Nephrology'],
  'dialysis': ['Nephrology'],
  'cataract': ['Ophthalmology'],
  'eye': ['Ophthalmology'],
  'teeth': ['Dentistry'],
  'root canal': ['Dentistry'],
  'child': ['Pediatrics'],
  'depression': ['Psychiatry', 'Psychology'],
  'cancer': ['Oncology', 'Surgical Oncology'],
};

export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      specialty,
      location,
      hospitalId,
      branchId,
      minFee,
      maxFee,
      isOnlineAvailable,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (specialty) {
      query.specialization = new RegExp(String(specialty), 'i');
    }

    if (hospitalId) {
      query.hospitalId = String(hospitalId);
    }

    if (branchId) {
      query.branchId = String(branchId);
    }

    if (isOnlineAvailable !== undefined) {
      query.onlineConsultation = isOnlineAvailable === 'true';
    }

    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseFloat(minFee as string);
      if (maxFee) query.consultationFee.$lte = parseFloat(maxFee as string);
    }

    if (search) {
      const searchStr = String(search).trim().toLowerCase();
      const q = new RegExp(searchStr, 'i');
      
      // Check if the search term matches known treatment/symptom keywords
      const mappedSpecs: string[] = [];
      for (const [key, specs] of Object.entries(TREATMENT_TO_SPECIALTY)) {
        if (searchStr.includes(key) || key.includes(searchStr)) {
          mappedSpecs.push(...specs);
        }
      }

      const orConditions: any[] = [
        { specialization: q },
        { qualifications: q },
        { bio: q },
        { services: { $in: [q] } },
      ];

      if (mappedSpecs.length > 0) {
        orConditions.push({
          specialization: { $in: mappedSpecs.map((s) => new RegExp(s, 'i')) },
        });
      }

      query.$or = orConditions;
    }

    const sortObj: any = {};
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'fee') {
      sortObj.consultationFee = dir;
    } else if (sortBy === 'experience') {
      sortObj.experience = dir;
    } else {
      sortObj.rating = dir;
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .populate('userId')
        .populate('departmentId')
        .populate('branchId')
        .populate('hospitalId')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Doctor.countDocuments(query),
    ]);

    const formatted = doctors.map(formatDoctor);

    res.status(200).json({
      status: 'success',
      data: {
        doctors: formatted,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const doc = await Doctor.findOne({
      $or: [{ _id: id }, { userId: id }],
    })
      .populate('userId')
      .populate('departmentId')
      .populate('branchId')
      .populate('hospitalId');

    if (!doc) {
      throw new NotFoundError('Doctor profile record not found.');
    }

    const reviews = await Review.find({ doctorId: doc._id })
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    const formatted = {
      ...formatDoctor(doc),
      reviews: reviews.map((r: any) => ({
        id: r._id.toString(),
        patientId: r.patientId?._id?.toString() || r.patientId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        patient: r.patientId && typeof r.patientId === 'object' ? {
          firstName: r.patientId.firstName,
          lastName: r.patientId.lastName,
        } : null,
      })),
    };

    res.status(200).json({
      status: 'success',
      data: {
        doctor: formatted,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Authentication required.');
    }

    const docProfile = await Doctor.findOne({ userId });
    if (!docProfile) {
      throw new NotFoundError('Doctor profile not found for this account.');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      pendingConsultationsCount,
      completedConsultations,
      uniquePatientsCount,
      recentAppointments,
    ] = await Promise.all([
      Appointment.countDocuments({
        doctorId: docProfile._id,
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
      }),
      Appointment.countDocuments({
        doctorId: docProfile._id,
        appointmentDate: { $gte: todayEnd },
      }),
      Appointment.countDocuments({
        doctorId: docProfile._id,
        status: { $in: ['WAITING', 'IN_CONSULTATION'] },
      }),
      Consultation.find({ doctorId: docProfile._id }),
      Appointment.distinct('patientId', { doctorId: docProfile._id }),
      Appointment.find({ doctorId: docProfile._id })
        .populate('patientId')
        .sort({ appointmentDate: -1 })
        .limit(5),
    ]);

    const totalRevenue = completedConsultations.reduce(
      (sum, c) => sum + (docProfile.consultationFee || 0),
      0
    );

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          todayAppointments: todayAppointmentsCount,
          upcomingAppointments: upcomingAppointmentsCount,
          totalPatients: uniquePatientsCount.length,
          pendingConsultations: pendingConsultationsCount,
          followUps: completedConsultations.length,
          revenue: totalRevenue,
        },
        recentPatients: recentAppointments.map((a: any) => {
          const patientObj: any = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
          return {
            appointmentId: a._id.toString(),
            appointmentDate: a.appointmentDate,
            slotTime: `${a.startTime} - ${a.endTime}`,
            status: a.status,
            patient: patientObj
              ? {
                  id: patientObj._id.toString(),
                  uhid: patientObj.patientId || patientObj.mrn,
                  mrn: patientObj.mrn,
                  firstName: patientObj.firstName,
                  lastName: patientObj.lastName,
                  phone: patientObj.phone,
                  bloodGroup: patientObj.bloodGroup,
                }
              : null,
          };
        }),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = updateDoctorProfileSchema.parse(req.body);

    const doc = await Doctor.findOne({ $or: [{ _id: id }, { userId: id }] });
    if (!doc) {
      throw new NotFoundError('Doctor profile record not found.');
    }

    if (req.user?.role !== 'SUPER_ADMIN' && doc.userId.toString() !== req.user?.id) {
      throw new UnauthorizedError('You are not authorized to modify this doctor profile.');
    }

    const updateObj: any = { ...data };
    if (data.qualification !== undefined) updateObj.qualifications = data.qualification;

    const updated = await Doctor.findByIdAndUpdate(doc._id, { $set: updateObj }, { new: true })
      .populate('userId')
      .populate('departmentId')
      .populate('branchId')
      .populate('hospitalId');

    res.status(200).json({
      status: 'success',
      message: 'Doctor profile updated successfully.',
      data: { doctor: formatDoctor(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const addDoctorReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.params.id as string;
    const data = createDoctorReviewSchema.parse(req.body);

    const review = await Review.create({
      doctorId,
      patientId: data.patientId,
      rating: data.rating,
      comment: data.comment,
    });

    const reviews = await Review.find({ doctorId });
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    await Doctor.findByIdAndUpdate(doctorId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length,
    });

    res.status(201).json({
      status: 'success',
      message: 'Doctor review submitted successfully.',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.params.id as string;
    const docProfile = await Doctor.findOne({
      $or: [{ _id: doctorId }, { userId: doctorId }],
    });
    if (!docProfile) {
      throw new NotFoundError('Doctor profile not found.');
    }

    let schedule = await DoctorSchedule.findOne({ doctorId: docProfile._id });

    if (!schedule) {
      schedule = await DoctorSchedule.create({
        doctorId: docProfile._id,
        hospitalId: docProfile.hospitalId,
        branchId: docProfile.branchId,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        breaks: [{ startTime: '13:00', endTime: '14:00' }],
        appointmentDuration: 30,
        maxAppointments: 20,
        isActive: true,
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        schedule: {
          id: schedule._id.toString(),
          doctorId: schedule.doctorId.toString(),
          workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakStartTime: schedule.breaks?.[0]?.startTime || '13:00',
          breakEndTime: schedule.breaks?.[0]?.endTime || '14:00',
          slotDurationMinutes: schedule.appointmentDuration,
          maxAppointmentsPerDay: schedule.maxAppointments || 20,
          leaves: [],
          holidays: [],
          allowOnline: true,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctorSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.params.id as string;
    const data = doctorScheduleSchema.parse(req.body);

    const docProfile = await Doctor.findOne({
      $or: [{ _id: doctorId }, { userId: doctorId }],
    });
    if (!docProfile) {
      throw new NotFoundError('Doctor profile not found.');
    }

    const scheduleObj = {
      hospitalId: docProfile.hospitalId,
      branchId: docProfile.branchId,
      startTime: data.startTime,
      endTime: data.endTime,
      breaks: [{ startTime: data.breakStartTime, endTime: data.breakEndTime }],
      appointmentDuration: data.slotDurationMinutes,
      maxAppointments: data.maxAppointmentsPerDay,
      isActive: true,
    };

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: docProfile._id },
      { $set: scheduleObj },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Doctor schedule updated successfully.',
      data: {
        schedule: {
          id: schedule._id.toString(),
          doctorId: schedule.doctorId.toString(),
          workingDays: data.workingDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakStartTime: data.breakStartTime,
          breakEndTime: data.breakEndTime,
          slotDurationMinutes: schedule.appointmentDuration,
          maxAppointmentsPerDay: schedule.maxAppointments,
          leaves: data.leaves || [],
          holidays: data.holidays || [],
          allowOnline: data.allowOnline,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
