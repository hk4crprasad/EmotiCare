import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  MapPin,
  Phone,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../lib/api';

interface Counselor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  available_today: boolean;
}

interface Appointment {
  id: string;
  counselor_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  appointment_type: string;
  mode?: string;
  reason?: string;
}

interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

export function AppointmentInterface() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingData, setBookingData] = useState({
    appointment_type: '',
    mode: '',
    reason: '',
    urgency_level: 'medium'
  });
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadCounselors();
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedCounselor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCounselor, selectedDate]);

  const loadCounselors = async () => {
    try {
      const counselors = await api.getCounselors();
      setCounselors(counselors);
    } catch (error) {
      console.error('Error loading counselors:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const appointments = await api.getMyAppointments();
      setAppointments(appointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedCounselor) return;
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const slots = await api.getAvailableSlots(selectedCounselor.id, dateString);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const bookAppointment = async () => {
    if (!selectedCounselor || !selectedSlot) return;

    setIsBooking(true);
    try {
      const appointmentData = {
        counselor_id: selectedCounselor.id,
        appointment_date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        ...bookingData
      };

      await api.bookAppointment(appointmentData);
      setShowBookingForm(false);
      setSelectedCounselor(null);
      setSelectedSlot(null);
      setBookingData({
        appointment_type: '',
        mode: '',
        reason: '',
        urgency_level: 'medium'
      });
      await loadAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await api.updateAppointment(appointmentId, { status: 'cancelled' });
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1>Appointments</h1>
        <p className="text-muted-foreground">
          Book sessions with qualified counselors for personalized support.
        </p>
      </div>

      <Tabs defaultValue="book" className="space-y-4">
        <TabsList>
          <TabsTrigger value="book">Book Appointment</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-6">
          {!showBookingForm ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose a Counselor</CardTitle>
                  <CardDescription>
                    Select a qualified mental health professional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {counselors.map((counselor) => (
                      <Card 
                        key={counselor.id}
                        className={`cursor-pointer transition-colors ${
                          selectedCounselor?.id === counselor.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedCounselor(counselor)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{counselor.name}</h3>
                              {counselor.available_today && (
                                <Badge className="bg-green-100 text-green-800">Available</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {counselor.specialization}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                              <span className="text-sm">{counselor.rating}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedCounselor && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date & Time</CardTitle>
                    <CardDescription>
                      Choose an available slot with {selectedCounselor.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Select Date
                        </Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Available Time Slots
                        </Label>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {availableSlots.length > 0 ? (
                            availableSlots.map((slot, index) => (
                              <Button
                                key={index}
                                variant={selectedSlot === slot ? "default" : "outline"}
                                className="w-full justify-start"
                                onClick={() => setSelectedSlot(slot)}
                                disabled={!slot.available}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {slot.start_time} - {slot.end_time}
                              </Button>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No available slots for this date. Please select another date.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedSlot && (
                      <div className="mt-6 pt-6 border-t">
                        <Button 
                          onClick={() => setShowBookingForm(true)}
                          className="w-full"
                        >
                          Continue to Booking Details
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Complete your appointment booking with {selectedCounselor?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Appointment Type</Label>
                    <Select
                      value={bookingData.appointment_type}
                      onValueChange={(value) => 
                        setBookingData(prev => ({ ...prev, appointment_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="counseling">Individual Counseling</SelectItem>
                        <SelectItem value="therapy">Therapy Session</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Session Mode</Label>
                    <Select
                      value={bookingData.mode}
                      onValueChange={(value) => 
                        setBookingData(prev => ({ ...prev, mode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="video">Video Call</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Urgency Level</Label>
                  <Select
                    value={bookingData.urgency_level}
                    onValueChange={(value) => 
                      setBookingData(prev => ({ ...prev, urgency_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Routine consultation</SelectItem>
                      <SelectItem value="medium">Medium - Some concern</SelectItem>
                      <SelectItem value="high">High - Urgent need</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Reason for Appointment</Label>
                  <Textarea
                    placeholder="Brief description of what you'd like to discuss..."
                    value={bookingData.reason}
                    onChange={(e) => 
                      setBookingData(prev => ({ ...prev, reason: e.target.value }))
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={bookAppointment}
                    disabled={isBooking || !bookingData.appointment_type || !bookingData.mode}
                    className="flex-1"
                  >
                    {isBooking ? 'Booking...' : 'Book Appointment'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length > 0 ? (
            <div className="space-y-4">
              {appointments
                .filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed')
                .map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{appointment.counselor_name}</h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {appointment.appointment_date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.start_time} - {appointment.end_time}
                            </div>
                            <div className="flex items-center gap-1">
                              {getModeIcon(appointment.mode || 'in-person')}
                              {appointment.mode || 'In-Person'}
                            </div>
                          </div>
                          <p className="text-sm">{appointment.appointment_type}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelAppointment(appointment.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-4">
                  Book your first appointment with a qualified counselor.
                </p>
                <Button onClick={() => setShowBookingForm(false)}>
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {appointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled').length > 0 ? (
            <div className="space-y-4">
              {appointments
                .filter(apt => apt.status === 'completed' || apt.status === 'cancelled')
                .map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{appointment.counselor_name}</h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {appointment.appointment_date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.start_time} - {appointment.end_time}
                            </div>
                          </div>
                          <p className="text-sm">{appointment.appointment_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {appointment.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No appointment history</h3>
                <p className="text-muted-foreground">
                  Your completed and cancelled appointments will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}