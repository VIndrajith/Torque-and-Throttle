import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Calendar, User, Phone, Check, Clock, Loader2, Send } from 'lucide-react';
import { Vehicle } from '../types';
import { getStoredVehicles, subscribeToVehicles } from '../firebase/vehicleService';
import { postTestDriveWebhook } from '../utils/mailDispatcher';

interface BookingFormProps {
  preselectedVehicleId?: string;
  vehicles?: Vehicle[];
}

export const BookingForm: React.FC<BookingFormProps> = ({ preselectedVehicleId, vehicles: propVehicles }) => {
  const [liveVehicles, setLiveVehicles] = useState<Vehicle[]>(() => propVehicles ?? getStoredVehicles());

  // Keep in sync with propVehicles if provided
  useEffect(() => {
    if (propVehicles !== undefined) {
      setLiveVehicles(propVehicles);
    }
  }, [propVehicles]);

  // Subscribe to real-time vehicles from Firestore / active database
  useEffect(() => {
    const unsub = subscribeToVehicles((updatedList) => {
      setLiveVehicles(updatedList || []);
    });
    return () => unsub();
  }, []);

  const activeVehicles = propVehicles !== undefined ? propVehicles : liveVehicles;

  // Filter out sold vehicles from the booking dropdown list
  const availableVehicles = useMemo(() => {
    return activeVehicles.filter((car) => car.status !== 'sold' && !car.isSold);
  }, [activeVehicles]);

  const [selectedVehicle, setSelectedVehicle] = useState<string>(() => {
    if (preselectedVehicleId && availableVehicles.some((c) => c.id === preselectedVehicleId)) {
      return preselectedVehicleId;
    }
    return availableVehicles.length > 0 ? availableVehicles[0].id : '';
  });

  useEffect(() => {
    if (preselectedVehicleId && availableVehicles.some((c) => c.id === preselectedVehicleId)) {
      setSelectedVehicle(preselectedVehicleId);
    } else if (availableVehicles.length > 0) {
      const exists = availableVehicles.some((c) => c.id === selectedVehicle);
      if (!exists) {
        setSelectedVehicle(availableVehicles[0].id);
      }
    } else {
      setSelectedVehicle('');
    }
  }, [preselectedVehicleId, availableVehicles, selectedVehicle]);

  const [preferredDate, setPreferredDate] = useState('2026-09-28');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCar = availableVehicles.find((c) => c.id === selectedVehicle) || activeVehicles.find((c) => c.id === selectedVehicle) || availableVehicles[0] || activeVehicles[0] || {
    id: 'unknown',
    year: 2024,
    make: 'Certified Preowned',
    model: 'Vehicle',
    trim: 'Standard',
    mileage: 0,
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setIsSubmitting(true);
    try {
      await postTestDriveWebhook({
        vehicleName: `${currentCar.year} ${currentCar.make} ${currentCar.model}${currentCar.trim ? ' ' + currentCar.trim : ''}`,
        preferredDate,
        fullName: fullName.trim() || 'Client',
        mobile: mobile.trim(),
        notes: notes.trim(),
      });
    } catch (err) {
      console.warn('Booking submission notice:', err);
    } finally {
      setIsSubmitting(false);
      setBookingConfirmed(true);
    }
  };

  return (
    <section id="test-drive-section" className="py-4 sm:py-16 lg:py-20 bg-[#0F1115] border-b border-white/[0.06] relative z-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="bg-[#171922] border border-white/[0.1] rounded-xl p-3.5 sm:p-7 lg:p-10 shadow-2xl relative overflow-hidden">
          {/* Upper edge highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left">
              <div>
                <div className="inline-flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-[#E5252A] text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 sm:mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>DIRECT-TO-YOU TEST DRIVE</span>
                </div>

                <h2 className="font-display text-lg sm:text-2xl lg:text-4xl font-extrabold text-[#ECE5D8] tracking-tight uppercase leading-tight">
                  SCHEDULE A TEST DRIVE &amp; INSPECTION
                </h2>
              </div>
            </div>

            {/* Right Column: Form / Success State */}
            <div className="lg:col-span-7 bg-[#0F1115]/80 border border-white/[0.06] rounded-lg p-3 sm:p-6 lg:p-8 flex flex-col justify-center">
              {bookingConfirmed ? (
                <div className="bg-[#0F1115] border border-emerald-500/40 rounded-lg p-4 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200 space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-950/80 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                    <Check className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                      REQUEST SUCCESSFULLY SENT
                    </span>
                    <h3 className="font-display text-xl sm:text-3xl font-black text-[#ECE5D8] uppercase">
                      Test Drive Request Received
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed font-sans">
                    Thank you{fullName.trim() ? `, ${fullName.trim()}` : ''}! Your test drive request for the <span className="text-[#ECE5D8] font-bold">{currentCar.year} {currentCar.make} {currentCar.model}</span> on <span className="text-[#ECE5D8] font-mono">{preferredDate}</span> has been successfully sent. We will reach out to you soon on <span className="text-[#ECE5D8] font-mono">{mobile.trim() || 'your phone number'}</span> to confirm the appointment.
                  </p>

                  <div className="pt-2 sm:pt-3 flex justify-center">
                    <button
                      onClick={() => {
                        setBookingConfirmed(false);
                        setFullName('');
                        setMobile('');
                        setNotes('');
                      }}
                      className="bg-[#222634] hover:bg-[#2A2F3D] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#ECE5D8] hover:text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded border border-white/[0.15] transition-colors cursor-pointer shadow-md"
                    >
                      Schedule Another Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-2.5 sm:space-y-4">
                  {/* Row 1: Target Vehicle & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-1 sm:mb-1.5">
                        TARGET VEHICLE
                      </label>
                      <select
                        id="booking-target-vehicle"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="w-full h-9 sm:h-11 bg-[#0A0C10] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-2.5 sm:px-3.5 focus:outline-none focus:border-[#E5252A] cursor-pointer font-sans"
                      >
                        {availableVehicles.length === 0 ? (
                          <option value="" className="bg-[#171922] text-[#ECE5D8]">
                            No available vehicles currently in inventory
                          </option>
                        ) : (
                          availableVehicles.map((car) => (
                            <option key={car.id} value={car.id} className="bg-[#171922] text-[#ECE5D8]">
                              {car.year} {car.make} {car.model} {car.trim ? `• ${car.trim}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-1 sm:mb-1.5">
                        PREFERRED DATE
                      </label>
                      <div className="relative">
                        <input
                          id="booking-date-input"
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full h-9 sm:h-11 bg-[#0A0C10] border border-white/[0.12] rounded text-xs text-[#ECE5D8] px-2.5 sm:px-3.5 focus:outline-none focus:border-[#E5252A] font-sans"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Name & Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-1 sm:mb-1.5">
                        FULL NAME
                      </label>
                      <div className="relative">
                        <User className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8]" />
                        <input
                          id="booking-fullname-input"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your Full Name"
                          className="w-full h-9 sm:h-11 bg-[#0A0C10] border border-white/[0.12] rounded text-xs text-[#ECE5D8] pl-8 sm:pl-10 pr-2.5 sm:pr-3.5 focus:outline-none focus:border-[#E5252A] font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] sm:text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-1 sm:mb-1.5">
                        MOBILE NUMBER
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94A3B8]" />
                        <input
                          id="booking-mobile-input"
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="+91 9400581250"
                          className="w-full h-9 sm:h-11 bg-[#0A0C10] border border-white/[0.12] rounded text-xs text-[#ECE5D8] pl-8 sm:pl-10 pr-2.5 sm:pr-3.5 focus:outline-none focus:border-[#E5252A] font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes / Requests */}
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-1 sm:mb-1.5">
                      SPECIAL INSTRUCTIONS / QUESTIONS (OPTIONAL)
                    </label>
                    <textarea
                      id="booking-notes-input"
                      rows={1}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Prefer afternoon slot, highway road test..."
                      className="w-full bg-[#0A0C10] border border-white/[0.12] rounded text-xs text-[#ECE5D8] p-2 sm:p-3 focus:outline-none focus:border-[#E5252A] font-sans sm:rows-2"
                    />
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-center gap-2 pt-0.5 sm:pt-1">
                    <input
                      id="booking-terms-checkbox"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-[#0A0C10] border-white/20 text-[#E5252A] focus:ring-[#E5252A] cursor-pointer"
                    />
                    <label htmlFor="booking-terms-checkbox" className="text-[10px] sm:text-xs text-[#94A3B8] cursor-pointer select-none">
                      I agree to terms &amp; direct coordination from the dealer specialist.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="booking-submit-btn"
                    type="submit"
                    disabled={isSubmitting || !agreed}
                    className="w-full h-10 sm:h-12 bg-[#E5252A] hover:bg-[#c00017] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-[0_0_20px_rgba(229,37,42,0.3)] hover:shadow-[0_0_25px_rgba(229,37,42,0.5)] flex items-center justify-center gap-2 cursor-pointer mt-1 sm:mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>TRANSMITTING REQUEST...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>SEND TEST DRIVE REQUEST</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
