import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, Phone, Video, MapPin, Check, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

interface Counselor {
  id: string;
  name: string;
  full_name?: string;
  specialization: string[];
  specializations?: string[];
  rating: number;
  availability: string[];
  type: 'on-campus' | 'online' | 'helpline';
  role?: string;
  languages: string[];
  nextAvailable: string;
  is_available?: boolean;
}

interface Appointment {
  id: string;
  counselorId: string;
  counselor_id?: string;
  date: string;
  appointment_date?: string;
  time: string;
  start_time?: string;
  type: 'video' | 'phone' | 'in-person';
  mode?: string;
  status: 'confirmed' | 'pending' | 'completed';
  urgency_level?: string;
}

export function BookingSystem() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [appointmentType, setAppointmentType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'crisis'>('low');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Load counselors and appointments on component mount
  useEffect(() => {
    loadCounselors();
    loadMyAppointments();
  }, []);

  const loadCounselors = async () => {
    try {
      setIsLoading(true);
      const counselorsData = await apiService.getCounselors();
      setCounselors(counselorsData as Counselor[]);
    } catch (error) {
      console.error('Failed to load counselors:', error);
      toast.error('Failed to load counselors');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyAppointments = async () => {
    try {
      const appointments = await apiService.getMyAppointments();
      setMyAppointments(appointments as Appointment[]);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load your appointments');
    }
  };

  const loadAvailableSlots = async (counselorId: string, date: string) => {
    try {
      const slots = await apiService.getAvailableSlots(counselorId, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load available slots:', error);
      toast.error('Failed to load available time slots');
    }
  };

  const handleBooking = async () => {
    if (!selectedCounselor || !selectedDate || !selectedTime || !sessionType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        counselor_id: selectedCounselor.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: selectedTime, // Will be calculated on backend
        appointment_type: 'counseling',
        mode: sessionType,
        reason: notes || 'General counseling session',
        urgency_level: 'medium',
        notes: notes
      };

      await apiService.bookAppointment(bookingData);
      setIsBooked(true);
      toast.success('Appointment booked successfully!');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      toast.error('Please select counselor, date, and time');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the appointment');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        counselor_id: selectedCounselor.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: addHourToTime(selectedTime), // Add helper function
        appointment_type: 'counseling',
        mode: appointmentType,
        reason: reason,
        urgency_level: urgency,
        notes: '',
      };

      await apiService.bookAppointment(bookingData);
      setIsBooked(true);
      toast.success('Appointment booked successfully!');
      
      // Reset form
      setSelectedCounselor(null);
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      
      // Refresh appointments
      loadMyAppointments();
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const addHourToTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'crisis':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">Book Counseling Session</h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Schedule a confidential appointment with our licensed counselors or access immediate support.
        </p>
      </div>

      {isBooked ? (
        <Card className="p-6 sm:p-8 text-center bg-green-50 border-green-200">
          <Check className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-green-800">Appointment Confirmed!</h2>
          <p className="text-sm sm:text-base text-green-700 mb-4 leading-relaxed">
            Your session with {selectedCounselor?.name} has been scheduled. 
            You'll receive a confirmation email with session details.
          </p>
          <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
            Session: {selectedDate} at {selectedTime}
          </Badge>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Counselor Selection */}
          <div className="lg:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Choose Your Support</h2>
            <div className="grid gap-3 sm:gap-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm sm:text-base text-gray-600">Loading counselors...</p>
                </div>
              ) : counselors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm sm:text-base text-gray-600">No counselors available at the moment.</p>
                </div>
              ) : (
                counselors.map((counselor: any) => (
                  <Card 
                    key={counselor.id}
                    className={`p-3 sm:p-4 cursor-pointer transition-all ${
                      selectedCounselor?.id === counselor.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCounselor(counselor)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h3 className="font-medium text-base sm:text-lg mb-1">{counselor.full_name || counselor.name}</h3>
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
                          <span>⭐ {counselor.rating || '4.5'}</span>
                          <span>•</span>
                          <span>{counselor.role === 'counselor' ? 'Counselor' : counselor.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:ml-4">
                        {counselor.is_available && (
                          <>
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                            <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(counselor.specializations || ['General Counseling']).map((spec: string) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(counselor.languages || ['English']).map((lang: string) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>
                          {counselor.is_available 
                            ? 'Available now' 
                            : 'Next available: Contact for schedule'
                          }
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Booking Form */}
          {/* Booking Form */}
          <div className="lg:sticky lg:top-4">
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Schedule Details</h3>
              
              {selectedCounselor ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm sm:text-base mb-2">Selected Counselor</h4>
                    <p className="text-sm font-medium text-gray-900">{selectedCounselor.full_name || selectedCounselor.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedCounselor.role === 'counselor' ? 'Licensed Counselor' : selectedCounselor.type}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Date</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Time</label>
                    <select 
                      value={selectedTime} 
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select a time</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Session Type</label>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {['video', 'phone', 'in-person'].map((type) => (
                        <label key={type} className="flex items-center space-x-3 p-2 sm:p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="sessionType"
                            value={type}
                            checked={sessionType === type}
                            onChange={(e) => setSessionType(e.target.value as 'video' | 'phone' | 'in-person')}
                            className="w-4 h-4 text-primary"
                          />
                          <div className="flex items-center space-x-2">
                            {type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                            {type === 'phone' && <Phone className="h-4 w-4 text-red-500" />}
                            {type === 'in-person' && <MapPin className="h-4 w-4 text-green-500" />}
                            <span className="text-sm sm:text-base capitalize">{type === 'in-person' ? 'In Person' : type}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific concerns or preferences..."
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-sm resize-none h-20 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <Button 
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedTime || !sessionType || isBooking}
                    className="w-full py-3 text-sm sm:text-base font-medium"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Booking...
                      </>
                    ) : (
                      'Book Appointment'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm sm:text-base text-gray-500 mb-4">Please select a counselor to continue</p>
                  <div className="text-xs sm:text-sm text-gray-400">
                    Choose from our available counselors on the left to schedule your appointment.
                  </div>
                </div>
              )}
            </Card>

            {/* Emergency Contact */}
            <Card className="mt-4 sm:mt-6 p-4 sm:p-6 bg-red-50 border-red-200">
              <h4 className="font-medium text-sm sm:text-base text-red-800 mb-2">Need Immediate Help?</h4>
              <p className="text-xs sm:text-sm text-red-700 mb-3 leading-relaxed">
                If you're experiencing a mental health emergency, please contact:
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-xs sm:text-sm border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => window.open('tel:988', '_self')}
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Call 988 (Suicide & Crisis Lifeline)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-xs sm:text-sm border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => window.open('tel:911', '_self')}
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Call 911 (Emergency Services)
                </Button>
              </div>
            </Card>
          </div>            {/* My Appointments */}
            {myAppointments.length > 0 && (
              <Card className="p-4 mt-4">
                <h3 className="text-lg mb-3">Upcoming Appointments</h3>
                {myAppointments.map((appointment: any) => {
                  const counselor = counselors.find((c: any) => c.id === appointment.counselor_id);
                  return (
                    <div key={appointment.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="font-medium">{counselor?.full_name || 'Counselor'}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{appointment.mode}</Badge>
                        <Badge className={getUrgencyColor(appointment.urgency_level)}>
                          {appointment.urgency_level}
                        </Badge>
                        <Badge 
                          className={
                            appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}