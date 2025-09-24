import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  Clock, 
  MapPin,
  Heart,
  Shield,
  Users,
  Headphones,
  ExternalLink
} from "lucide-react";

export default function Emergency() {
  // Get emergency resources
  const { data: emergencyData } = useQuery({
    queryKey: ['/api/v1/chat/emergency-resources'],
    queryFn: api.getEmergencyResources,
  });

  const crisisHotlines = [
    {
      name: "National Crisis Lifeline",
      number: "988",
      description: "24/7 support for anyone in emotional distress or suicidal crisis",
      available_24_7: true,
      features: ["Free", "Confidential", "Available in Spanish"]
    },
    {
      name: "Crisis Text Line",
      number: "741741",
      description: "Text HOME to connect with a crisis counselor",
      available_24_7: true,
      features: ["Text-based", "Anonymous", "Real-time support"]
    },
    {
      name: "National Sexual Assault Hotline",
      number: "1-800-656-4673",
      description: "Support for survivors of sexual violence",
      available_24_7: true,
      features: ["Free", "Confidential", "Trained counselors"]
    },
    {
      name: "National Domestic Violence Hotline",
      number: "1-800-799-7233",
      description: "Support for domestic violence survivors",
      available_24_7: true,
      features: ["Safe", "Confidential", "24/7 advocates"]
    }
  ];

  const campusResources = [
    {
      name: "Student Counseling Center",
      phone: "(555) 123-4567",
      description: "Professional counseling services for students",
      hours: "Mon-Fri 8AM-5PM",
      location: "Student Health Building, 2nd Floor"
    },
    {
      name: "Campus Security",
      phone: "(555) 987-6543",
      description: "24/7 campus safety and emergency response",
      hours: "Available 24/7",
      location: "Security Office, Administration Building"
    },
    {
      name: "Wellness Center",
      phone: "(555) 246-8135",
      description: "Mental health resources and peer support",
      hours: "Mon-Fri 9AM-6PM",
      location: "Student Union Building"
    }
  ];

  const warningSignsImmediate = [
    "Thoughts of hurting yourself or others",
    "Feeling like you want to die",
    "Feeling out of control",
    "Hearing voices or seeing things",
    "Unable to take care of yourself",
    "Severe agitation or panic"
  ];

  const warningSignsUrgent = [
    "Overwhelming anxiety or panic attacks",
    "Severe depression lasting weeks",
    "Dramatic mood changes",
    "Complete withdrawal from friends/family",
    "Substance abuse to cope",
    "Inability to function in daily activities"
  ];

  return (
    <div className="p-6 space-y-8" data-testid="page-emergency">
      {/* Header with Alert */}
      <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-6 mb-8">
        <div className="flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-destructive emergency-pulse flex-shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-destructive mb-2">🆘 Emergency Mental Health Resources</h1>
            <p className="text-muted-foreground text-lg">
              If you're experiencing a mental health crisis or having thoughts of self-harm, please reach out immediately. 
              Help is available 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* Immediate Crisis Action Buttons */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">🚨 Need Help Right Now?</CardTitle>
          <CardDescription>Take immediate action - don't wait</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-16 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-lg"
              asChild
              data-testid="button-call-911"
            >
              <a href="tel:911">
                <Phone className="w-6 h-6 mr-3" />
                Call 911
              </a>
            </Button>
            <Button
              className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
              asChild
              data-testid="button-call-crisis-lifeline"
            >
              <a href="tel:988">
                <Phone className="w-6 h-6 mr-3" />
                Crisis Lifeline: 988
              </a>
            </Button>
            <Button
              className="h-16 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold text-lg"
              asChild
              data-testid="button-text-crisis"
            >
              <a href="sms:741741?body=HOME">
                <MessageSquare className="w-6 h-6 mr-3" />
                Text: 741741
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Crisis Hotlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-destructive" />
                Crisis Hotlines
              </CardTitle>
              <CardDescription>Professional support available 24/7</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crisisHotlines.map((hotline, index) => (
                  <div key={index} className="border border-border rounded-lg p-4" data-testid={`hotline-${index}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-card-foreground">{hotline.name}</h4>
                        <p className="text-sm text-muted-foreground">{hotline.description}</p>
                      </div>
                      <div className="text-right">
                        <Button
                          className="text-xl font-bold text-destructive hover:text-destructive/80"
                          variant="ghost"
                          asChild
                          data-testid={`button-call-${hotline.number.replace(/[^\d]/g, '')}`}
                        >
                          <a href={`tel:${hotline.number}`}>{hotline.number}</a>
                        </Button>
                        {hotline.available_24_7 && (
                          <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">
                            24/7
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hotline.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campus Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Campus Support Resources
              </CardTitle>
              <CardDescription>Local support services at your institution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campusResources.map((resource, index) => (
                  <div key={index} className="border border-border rounded-lg p-4" data-testid={`campus-resource-${index}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-card-foreground">{resource.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        data-testid={`button-call-campus-${index}`}
                      >
                        <a href={`tel:${resource.phone}`}>
                          <Phone className="w-4 h-4 mr-2" />
                          {resource.phone}
                        </a>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{resource.hours}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{resource.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Warning Signs */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">⚠️ When to Seek Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-destructive mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Immediate Danger Signs
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {warningSignsImmediate.map((sign, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-muted-foreground">{sign}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-accent mb-2 flex items-center">
                    <Heart className="w-4 h-4 mr-2" />
                    Urgent Signs
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {warningSignsUrgent.map((sign, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span className="text-muted-foreground">{sign}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/chat">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-ai-chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with AI Assistant
                  </Button>
                </Link>
                <Link href="/appointments">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-book-appointment">
                    <Users className="w-4 h-4 mr-2" />
                    Book Counselor Appointment
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-view-resources">
                    <Headphones className="w-4 h-4 mr-2" />
                    Self-Help Resources
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  asChild
                  data-testid="button-find-therapist"
                >
                  <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Find Local Therapist
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Safety Planning */}
          <Card className="bg-chart-2/5 border-chart-2/20">
            <CardHeader>
              <CardTitle className="text-chart-2">🛡️ Safety Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p><strong>Create a safety plan:</strong></p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Identify your warning signs</li>
                  <li>• List coping strategies that work</li>
                  <li>• Keep emergency contacts handy</li>
                  <li>• Remove means of self-harm</li>
                  <li>• Identify trusted people to call</li>
                </ul>
                <Button size="sm" variant="outline" className="mt-3 w-full" data-testid="button-create-safety-plan">
                  Create My Safety Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Your Safety and Privacy</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                All crisis services are confidential and free. You don't need to give your real name to get help. 
                If you're in immediate physical danger, please call 911 or go to your nearest emergency room. 
                Remember: asking for help is a sign of strength, not weakness.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
