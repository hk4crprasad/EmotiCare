import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MessageCircle, Calendar, BookOpen, Users, Brain, Shield, Clock, Heart, Zap } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: any) => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onNavigate, isAuthenticated }: LandingPageProps) {
  const features = [
    {
      icon: MessageCircle,
      title: 'AI-Guided Support',
      description: 'Get instant help through our intelligent chatbot that provides coping strategies and crisis support.',
      action: () => onNavigate('chat'),
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Brain,
      title: 'Mental Health Assessment',
      description: 'Take scientifically-backed assessments to understand your mental health and get personalized recommendations.',
      action: () => onNavigate('assessment'),
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: Calendar,
      title: 'Confidential Booking',
      description: 'Schedule appointments with on-campus counselors or access mental health helplines privately.',
      action: () => onNavigate('booking'),
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: BookOpen,
      title: 'Resource Hub',
      description: 'Access videos, relaxation audio, and wellness guides available in regional languages.',
      action: () => onNavigate('resources'),
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: Users,
      title: 'Peer Support',
      description: 'Connect with other students in moderated forums with trained student volunteer support.',
      action: () => onNavigate('forum'),
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  const stats = [
    { number: '24/7', label: 'AI Support Available' },
    { number: '100%', label: 'Confidential & Secure' },
    { number: '15+', label: 'Regional Languages' },
    { number: '500+', label: 'Students Helped' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-12 sm:py-16 lg:py-20 xl:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <Badge className="mb-4 sm:mb-6 bg-blue-100 text-blue-800 text-xs sm:text-sm lg:text-base">
                Mental Health Support for Students
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl leading-tight font-bold mb-4 sm:mb-6 lg:mb-8 text-gray-900">
                Your Mental Wellness Journey Starts Here
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-2xl text-gray-600 mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
                A comprehensive digital platform providing stigma-free psychological support, 
                early intervention tools, and peer connections tailored for college students.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                {isAuthenticated ? (
                  <Button size="lg" onClick={() => onNavigate('chat')} className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4">
                    <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    Get Support Now
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => onNavigate('auth')} className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4">
                    Get Started
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={() => onNavigate('resources')} className="w-full sm:w-auto text-sm sm:text-base lg:text-lg px-6 lg:px-8 py-3 lg:py-4">
                  <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  Explore Resources
                </Button>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1642287342121-8857cd9d1f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudHMlMjBtZW50YWwlMjBoZWFsdGglMjBzdXBwb3J0fGVufDF8fHx8MTc1ODExNzAwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Students supporting each other"
                className="rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl w-full h-64 sm:h-80 lg:h-[500px] xl:h-[600px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold text-primary mb-1 sm:mb-2 lg:mb-4">{stat.number}</div>
                <div className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 xl:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6 xl:mb-8 text-gray-900">Complete Mental Health Support System</h2>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Our platform integrates multiple support mechanisms to provide comprehensive, 
              culturally-sensitive mental health care for college students.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8 xl:gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-4 sm:p-6 lg:p-8 hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={feature.action}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-lg ${feature.color} flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-2xl font-semibold mb-2 sm:mb-3 lg:mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-3 sm:mb-4 lg:mb-6 leading-relaxed">{feature.description}</p>
                  <Button variant="ghost" className="p-0 h-auto text-sm lg:text-base font-medium group-hover:text-primary transition-colors">
                    Learn More →
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-gray-900">Why EmotiCare?</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-green-100 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-gray-900">100% Confidential</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Your privacy is our priority. All interactions are encrypted and anonymous.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-blue-100 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-gray-900">24/7 Availability</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Get support whenever you need it, day or night.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-purple-100 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-gray-900">Evidence-Based</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Our tools are based on validated psychological screening methods (PHQ-9, GAD-7).</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-orange-100 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-gray-900">Culturally Sensitive</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Content available in multiple regional languages with cultural context.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 sm:p-8 rounded-xl sm:rounded-2xl text-white order-1 lg:order-2">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Crisis Support</h3>
              <p className="text-sm sm:text-base mb-4 sm:mb-6 opacity-90 leading-relaxed">If you're in immediate danger or having thoughts of self-harm, please reach out immediately:</p>
              <div className="space-y-3">
                <div className="bg-white/20 p-3 sm:p-4 rounded-lg">
                  <div className="font-medium text-sm sm:text-base">National Suicide Prevention Lifeline</div>
                  <div className="text-sm sm:text-base">988 (US) | 112 (India)</div>
                </div>
                <div className="bg-white/20 p-3 sm:p-4 rounded-lg">
                  <div className="font-medium text-sm sm:text-base">Campus Counseling Center</div>
                  <div className="text-sm sm:text-base">Available 24/7 via campus emergency line</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 leading-tight">Take the First Step Towards Better Mental Health</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed max-w-2xl mx-auto">
            Join thousands of students who have found support and community through EmotiCare.
          </p>
          {!isAuthenticated && (
            <Button size="lg" variant="secondary" onClick={() => onNavigate('auth')} className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto text-sm sm:text-base">
              <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Get Started Today
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}