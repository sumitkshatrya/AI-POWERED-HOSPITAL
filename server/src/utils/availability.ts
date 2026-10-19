import { DoctorSchedule, DoctorLeave, Holiday, Appointment } from '../models';

export interface TimeSlot {
  slotStartTime: string;
  slotEndTime: string;
  available: boolean;
  reason?: 'AVAILABLE' | 'BOOKED' | 'BREAK' | 'MAX_REACHED' | 'LEAVE' | 'HOLIDAY' | 'NOT_WORKING_DAY' | 'PAST_TIME';
}

export interface DoctorAvailabilityResult {
  doctorId: string;
  date: string;
  isWorkingDay: boolean;
  isOnLeave: boolean;
  isHoliday: boolean;
  maxAppointmentsPerDay: number;
  totalBooked: number;
  allowOnline: boolean;
  slots: TimeSlot[];
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const getDayOfWeekName = (dateInput: string | Date): string => {
  const dateStr = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[d.getUTCDay()];
};

export function getUTCStartAndEndOfDay(dateInput: string | Date): { startOfDay: Date; endOfDay: Date; targetDateStr: string } {
  const targetDateStr = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { startOfDay, endOfDay, targetDateStr };
}

export async function calculateDoctorSlots(doctorId: string, dateStr: string): Promise<DoctorAvailabilityResult> {
  const schedule = await DoctorSchedule.findOne({ doctorId });

  const workingDays: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const startTime = schedule?.startTime || '09:00';
  const endTime = schedule?.endTime || '17:00';
  const breakStartTime = schedule?.breaks?.[0]?.startTime || '13:00';
  const breakEndTime = schedule?.breaks?.[0]?.endTime || '14:00';
  const slotDurationMinutes = schedule?.appointmentDuration || 30;
  const maxAppointmentsPerDay = schedule?.maxAppointments || 20;
  const allowOnline = schedule?.isActive ?? true;

  const dayName = getDayOfWeekName(dateStr);
  const isWorkingDay = workingDays.includes(dayName);

  const { startOfDay, endOfDay, targetDateStr } = getUTCStartAndEndOfDay(dateStr);

  const leaves = await DoctorLeave.find({
    doctorId,
    status: 'APPROVED',
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  });
  const isOnLeave = leaves.length > 0;

  const holidays = await Holiday.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  });
  const isHoliday = holidays.length > 0;

  if (!isWorkingDay || isOnLeave || isHoliday) {
    return {
      doctorId,
      date: targetDateStr,
      isWorkingDay,
      isOnLeave,
      isHoliday,
      maxAppointmentsPerDay,
      totalBooked: 0,
      allowOnline,
      slots: [],
    };
  }

  // Query existing active appointments for target date
  const existingAppointments = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'CANCELLED' },
  });

  const totalBooked = existingAppointments.length;
  const isMaxReached = totalBooked >= maxAppointmentsPerDay;

  const slots: TimeSlot[] = [];
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const breakStartMin = breakStartTime ? timeToMinutes(breakStartTime) : -1;
  const breakEndMin = breakEndTime ? timeToMinutes(breakEndTime) : -1;

  for (let current = startMin; current + slotDurationMinutes <= endMin; current += slotDurationMinutes) {
    const sStartStr = minutesToTime(current);
    const sEndStr = minutesToTime(current + slotDurationMinutes);

    const isBreak = breakStartMin >= 0 && breakEndMin >= 0 && current < breakEndMin && (current + slotDurationMinutes) > breakStartMin;

    if (isBreak) {
      slots.push({
        slotStartTime: sStartStr,
        slotEndTime: sEndStr,
        available: false,
        reason: 'BREAK',
      });
      continue;
    }

    const isBooked = existingAppointments.some((app) => {
      const appStart = timeToMinutes(app.startTime);
      const appEnd = timeToMinutes(app.endTime);
      return current < appEnd && (current + slotDurationMinutes) > appStart;
    });

    if (isBooked) {
      slots.push({
        slotStartTime: sStartStr,
        slotEndTime: sEndStr,
        available: false,
        reason: 'BOOKED',
      });
      continue;
    }

    if (isMaxReached) {
      slots.push({
        slotStartTime: sStartStr,
        slotEndTime: sEndStr,
        available: false,
        reason: 'MAX_REACHED',
      });
      continue;
    }

    slots.push({
      slotStartTime: sStartStr,
      slotEndTime: sEndStr,
      available: true,
      reason: 'AVAILABLE',
    });
  }

  return {
    doctorId,
    date: targetDateStr,
    isWorkingDay,
    isOnLeave,
    isHoliday,
    maxAppointmentsPerDay,
    totalBooked,
    allowOnline,
    slots,
  };
}
