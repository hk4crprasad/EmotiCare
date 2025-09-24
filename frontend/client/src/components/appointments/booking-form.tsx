import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isAfter } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, MapPin, Video, Loader2 } from "lucide-react";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counselors: any[];
}

export default function BookingForm({ open, onOpenChange, counselors }: BookingFormProps) {
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("counseling");
  const [mode, setMode] = useState("in-person");
  const [reason, setReason] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("medium");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available slots when counselor and date are selected
  const { data: availableSlots = [] } = useQuery({
    queryKey: ['/api/v1/appointments/available-slots', selectedCounselor, selectedDate],
    queryFn: () => selectedCounselor && selectedDate 
      ? api.getAvailableSlots(selectedCounselor, format(selectedDate, 'yyyy-MM-dd'))
      : Promise.resolve([]),
    enabled: !!(selectedCounselor && selectedDate),
  });

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: api.bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/appointments/my-appointments'] });
      toast({
        title: "Appointment booked successfully",
        description: "You will receive a confirmation email shortly.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to book appointment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedCounselor("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setAppointmentType("counseling");
    setMode("in-person");
    setReason("");
    setUrgencyLevel("medium");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      toast({
        title: "Please fill all required fields",
        description: "Counselor, date, and time are required.",
        variant: "destructive",
      });
      return;
    }

    const endTime = selectedTime.split(':').map(n => parseInt(n));
    endTime[0] += 1; // Add 1 hour for end time
    const endTimeStr = endTime.map(n => n.toString().padStart(2, '0')).join(':');

    bookMutation.mutate({
      counselor_id: selectedCounselor,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      end_time: endTimeStr,
      appointment_type: appointmentType,
      mode,
      reason,
      urgency_level: urgencyLevel,
    });
  };

  const availableTimeSlots = availableSlots.filter((slot: any) => slot.available);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-book-appointment">
          {/* Counselor Selection */}
          <div className="space-y-2">
            <Label>Select Counselor *</Label>
            <Select value={selectedCounselor} onValueChange={setSelectedCounselor} data-testid="select-counselor">
              <SelectTrigger>
                <SelectValue placeholder="Choose a counselor" />
              </SelectTrigger>
              <SelectContent>
                {counselors.map((counselor) => (
                  <SelectItem key={counselor.id} value={counselor.id}>
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{counselor.name}</p>
                        <p className="text-sm text-muted-foreground">{counselor.specialization}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            ⭐ {counselor.rating}
                          </Badge>
                          {counselor.available_today && (
                            <Badge variant="outline" className="text-xs bg-chart-2/10 text-chart-2">
                              Available today
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date *</Label>
              <div className="border border-border rounded-lg p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => 
                    date < new Date() || 
                    date > addDays(new Date(), 30)
                  }
                  className="w-full"
                  data-testid="calendar-date-picker"
                />
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label>Available Times *</Label>
              {selectedCounselor && selectedDate ? (
                availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availableTimeSlots.map((slot: any) => (
                      <Button
                        key={slot.start_time}
                        type="button"
                        variant={selectedTime === slot.start_time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot.start_time)}
                        data-testid={`time-slot-${slot.start_time}`}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {slot.start_time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
                    No available slots for this date
                  </div>
                )
              ) : (
                <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
                  Please select counselor and date first
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <div>
              <Label>Appointment Type</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType} data-testid="select-appointment-type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counseling">Individual Counseling</SelectItem>
                  <SelectItem value="therapy">Therapy Session</SelectItem>
                  <SelectItem value="consultation">Mental Health Consultation</SelectItem>
                  <SelectItem value="assessment">Mental Health Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Session Mode</Label>
              <RadioGroup value={mode} onValueChange={setMode} className="flex space-x-6 mt-2" data-testid="radio-session-mode">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in-person" id="in-person" />
                  <Label htmlFor="in-person" className="flex items-center space-x-2 cursor-pointer">
                    <MapPin className="w-4 h-4" />
                    <span>In-person</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="virtual" id="virtual" />
                  <Label htmlFor="virtual" className="flex items-center space-x-2 cursor-pointer">
                    <Video className="w-4 h-4" />
                    <span>Virtual</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Urgency Level</Label>
              <Select value={urgencyLevel} onValueChange={setUrgencyLevel} data-testid="select-urgency">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Routine appointment</SelectItem>
                  <SelectItem value="medium">Medium - Some concerns</SelectItem>
                  <SelectItem value="high">High - Urgent need for support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                placeholder="Please describe what you'd like to discuss in this session..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-reason"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-booking"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={bookMutation.isPending || !selectedCounselor || !selectedDate || !selectedTime}
              data-testid="button-confirm-booking"
            >
              {bookMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Book Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
