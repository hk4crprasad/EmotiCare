# Overview

EmotiCare is a digital mental health and psychological support system designed for students. It provides a comprehensive platform combining AI-powered chat support, mental health assessments, appointment scheduling with counselors, educational resources, and emergency support features. The application is built as a full-stack web application with a React frontend and Express.js backend, designed to help students access mental health services and track their psychological well-being.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 using TypeScript and follows a component-based architecture. The UI leverages Radix UI primitives with shadcn/ui components for a consistent design system. State management is handled through React Query (@tanstack/react-query) for server state and React hooks for local state. The application uses Wouter for client-side routing and implements a responsive design with Tailwind CSS.

Key frontend patterns:
- **Custom hooks pattern**: Centralized logic for authentication (`use-auth`), chat functionality (`use-chat`), and UI interactions (`use-toast`, `use-mobile`)
- **Component composition**: Reusable UI components with consistent styling and behavior
- **Type-safe development**: Full TypeScript implementation with shared types between frontend and backend

## Backend Architecture
The server uses Express.js with TypeScript running in ESM mode. The architecture follows a modular approach with separate concerns for routing, storage, and middleware. The backend implements:

- **Storage abstraction**: Interface-based storage system currently using in-memory storage (`MemStorage`) with plans for database integration
- **Middleware-based logging**: Request/response logging with performance tracking
- **Development tooling**: Vite integration for hot module replacement and development experience

## Data Storage Solutions
The application is configured for PostgreSQL with Drizzle ORM for type-safe database operations. The current implementation includes:

- **Schema definition**: Centralized schema in `shared/schema.ts` with Zod validation
- **Migration support**: Drizzle Kit configuration for database migrations
- **Connection management**: Neon Database serverless driver for PostgreSQL connectivity
- **Type safety**: Full TypeScript integration with database schema inference

Database design follows a user-centric model with extensible schema for mental health data tracking.

## Authentication and Authorization
Authentication is implemented using JWT tokens with localStorage persistence. The system includes:

- **Token-based auth**: JWT tokens with automatic refresh handling
- **Role-based access**: Support for different user roles (students, counselors, administrators)
- **Protected routes**: Client-side route protection with authentication checks
- **Session management**: Automatic logout on token expiration with redirect handling

## External Dependencies

### Core Technologies
- **React ecosystem**: React 18, React Router (Wouter), React Query for state management
- **UI framework**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens and responsive design
- **Backend**: Express.js with TypeScript, Vite for development tooling

### Database and ORM
- **PostgreSQL**: Primary database with Neon serverless driver (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database operations with schema management
- **Session storage**: connect-pg-simple for PostgreSQL session management

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Build tool and development server with HMR
- **ESBuild**: Production bundling for server-side code
- **Replit integration**: Development environment optimizations

### Utility Libraries
- **Form handling**: React Hook Form with Zod validation resolvers
- **Date manipulation**: date-fns for date/time operations
- **Styling utilities**: clsx and tailwind-merge for conditional styling
- **Icons**: Lucide React for consistent iconography

The application architecture emphasizes type safety, developer experience, and scalability while maintaining a clean separation of concerns between client and server components.