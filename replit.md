# SR Logistics Fleet Management System

## Overview

SR Logistics is a comprehensive fleet management web application designed to streamline operations for transportation companies. The system provides role-based access for administrators and drivers, enabling efficient vehicle management, trip coordination, and real-time location tracking. Built with modern web technologies, it offers a responsive, user-friendly interface for managing fleet operations from assignment to completion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a React-based Single Page Application (SPA) architecture with TypeScript for type safety. The frontend is built using Vite as the build tool and bundler, providing fast development and optimized production builds. The routing system uses Wouter for client-side navigation, offering a lightweight alternative to React Router.

The UI is built with a comprehensive design system using:
- **Tailwind CSS** for utility-first styling with custom design tokens
- **shadcn/ui** component library for consistent, accessible UI components
- **Radix UI** primitives for low-level accessibility and behavior
- **Framer Motion** for smooth animations and transitions
- **Lucide Icons** for consistent iconography

The application follows a component-based architecture with clear separation between presentation and business logic. State management is handled through React hooks and context for user authentication state.

### Backend Architecture
The backend follows a REST API architecture built with Express.js and TypeScript. The server implements a layered architecture pattern:

- **Route Layer**: Handles HTTP requests and responses with proper error handling
- **Storage Layer**: Abstracts data access through a repository pattern interface
- **Schema Layer**: Defines data models and validation using Zod schemas

The API provides endpoints for:
- Authentication (login/register)
- User management
- Vehicle CRUD operations
- Trip management and tracking
- Location data for real-time tracking

### Authentication & Authorization
The system implements a role-based authentication system with two distinct user roles:
- **Admin**: Full access to vehicle management, driver management, and trip oversight
- **Driver**: Limited access to assigned trips and location updates

Authentication uses bcrypt for password hashing and session-based authentication. The frontend maintains authentication state through React context, with protected routes based on user roles.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database interactions. The database schema includes:

- **Users table**: Stores admin and driver accounts with role-based access
- **Vehicles table**: Manages fleet inventory with status tracking
- **Trips table**: Coordinates trip assignments and status updates
- **Locations table**: Stores real-time tracking data for active trips

Drizzle provides schema-first development with automatic TypeScript types and migration management. The system supports both development (in-memory) and production (PostgreSQL) storage implementations.

### Real-time Features
The application is designed to support real-time location tracking during trips, though the WebSocket implementation is prepared for but not yet fully integrated. The architecture supports:
- Live location updates during active trips
- Real-time trip status changes
- Push notifications for trip assignments and completions

### Development & Deployment
The application uses a monorepo structure with shared TypeScript types between frontend and backend. The build process creates optimized bundles for both client and server, with the server bundle including all dependencies for deployment.

Development features include:
- Hot module replacement for fast development cycles
- TypeScript compilation with strict type checking
- ESLint and Prettier for code consistency
- Environment-based configuration management

## External Dependencies

### Database Services
- **Neon Database**: Cloud PostgreSQL provider for production database hosting
- **Drizzle Kit**: Database migration and schema management tools

### UI & Design Libraries
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Pre-built accessible component library
- **Radix UI**: Low-level UI primitives for accessibility
- **Framer Motion**: Animation library for smooth user interactions
- **Lucide Icons**: Consistent icon set for the application

### Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Static type checking for improved code quality
- **Zod**: Schema validation library for runtime type safety
- **React Hook Form**: Form handling with validation integration
- **TanStack Query**: Data fetching and caching for API interactions

### Authentication & Security
- **bcrypt**: Password hashing for secure authentication
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Production Services
The application is configured to work with cloud database providers like Neon for PostgreSQL hosting. Environment variables manage database connections and other configuration settings for different deployment environments.