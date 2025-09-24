import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import BookingForm from "@/components/appointments/booking-form";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  User, 
  Star,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export default function Appointments() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/v1/appointments/my-appointments'],
    queryFn: api.getMyAppointments,
  });

  // Get counselors
  const { data: counselors = [] } = useQuery({
    queryKey: ['/api/v1/appointments/counselors'],
    queryFn: api.getCounselors,
  });

  // Cancel appointment
  const cancelMutation = useMutation({
    mutationFn: api.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/appointments/my-appointments'] });
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been successfully cancelled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel appointment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update appointment status
  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: string; data: any }) =>
      api.updateAppointment(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/appointments/my-appointments'] });
      toast({
        title: "Appointment updated",
        description: "Your appointment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update appointment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="w-4 h-4 text-chart-2" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-accent" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-chart-2/10 text-chart-2';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      case 'completed':
        return 'bg-muted/10 text-muted-foreground';
      default:
        return 'bg-accent/10 text-accent';
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const upcomingAppointments = appointments.filter((apt: any) => 
    apt.status === 'scheduled' && new Date(apt.appointment_date) >= new Date()
  );

  const pastAppointments = appointments.filter((apt: any) => 
    apt.status !== 'scheduled' || new Date(apt.appointment_date) < new Date()
  );

  return (
    <div className="p-6 space-y-8" data-testid="page-appointments">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
          <p className="text-muted-foreground">
            Book and manage your counseling appointments with our mental health professionals.
          </p>
        </div>
        <Button onClick={() => setShowBookingForm(true)} data-testid="button-book-appointment">
          <Calendar className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Upcoming Appointments
              </CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment: any) => (
                    <div 
                      key={appointment.id} 
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">
                              {appointment.counselor_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.appointment_type} • {appointment.mode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appointment.status)}
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatAppointmentDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.start_time} - {appointment.end_time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {appointment.mode === 'virtual' ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                          <span>{appointment.mode}</span>
                        </div>
                      </div>

                      {appointment.reason && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <strong>Reason:</strong> {appointment.reason}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        {appointment.mode === 'virtual' && (
                          <Button size="sm" data-testid="button-join-virtual">
                            <Video className="w-4 h-4 mr-2" />
                            Join Session
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateMutation.mutate({
                            appointmentId: appointment.id,
                            data: { status: 'cancelled', reason: 'Cancelled by patient' }
                          })}
                          disabled={updateMutation.isPending}
                          data-testid="button-reschedule"
                        >
                          Reschedule
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelMutation.mutate(appointment.id)}
                          disabled={cancelMutation.isPending}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No upcoming appointments</p>
                  <p className="text-sm text-muted-foreground">Book your first appointment to get started</p>
                  <Button 
                    onClick={() => setShowBookingForm(true)} 
                    className="mt-4"
                    data-testid="button-book-first-appointment"
                  >
                    Book Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>Your past appointments and sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastAppointments.slice(0, 5).map((appointment: any) => (
                    <div 
                      key={appointment.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      data-testid={`past-appointment-${appointment.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground text-sm">
                            {appointment.counselor_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatAppointmentDate(appointment.appointment_date)} at {appointment.start_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(appointment.status)} variant="secondary">
                          {appointment.status}
                        </Badge>
                        {appointment.status === 'completed' && (
                          <Button variant="ghost" size="sm" data-testid="button-view-notes">
                            View Notes
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Available Counselors */}
          <Card>
            <CardHeader>
              <CardTitle>Available Counselors</CardTitle>
              <CardDescription>Choose from our qualified mental health professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {counselors.slice(0, 3).map((counselor: any) => (
                  <div key={counselor.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {counselor.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{counselor.name}</p>
                        <p className="text-sm text-muted-foreground">{counselor.specialization}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-accent fill-current" />
                        <span className="text-sm font-medium">{counselor.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${counselor.available_today ? 'bg-chart-2' : 'bg-muted-foreground'}`}></div>
                        <span className="text-sm text-muted-foreground">
                          {counselor.available_today ? 'Available today' : 'Busy today'}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowBookingForm(true)}
                      data-testid={`button-select-${counselor.id}`}
                    >
                      Select Counselor
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="button-contact-support">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-chat-support">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with AI Assistant
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" data-testid="button-emergency">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Emergency Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Form Modal */}
      <BookingForm 
        open={showBookingForm}
        onOpenChange={setShowBookingForm}
        counselors={counselors}
      />
    </div>
  );
}
