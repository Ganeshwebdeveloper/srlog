# SR Logistics Fleet Management App - Design Guidelines

## Design Approach
**System-Based Approach**: Given the utility-focused nature of fleet management (data-heavy dashboards, real-time tracking, CRUD operations), I'm selecting a design system approach using **Material Design** principles with modern adaptations for professional fleet management applications.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Primary: 220 85% 45% (Professional blue for trust and reliability)
- Primary Light: 220 75% 60%
- Primary Dark: 220 90% 35%

**Supporting Colors:**
- Success: 142 76% 36% (Trip completion, successful actions)
- Warning: 38 92% 50% (Vehicle maintenance alerts)
- Error: 0 84% 60% (Critical alerts, failed operations)
- Info: 204 94% 94% (Information states)

**Neutral Palette:**
- Background: 220 14% 96% (Light mode)
- Background Dark: 220 13% 9% (Dark mode)
- Surface: 0 0% 100% (Cards, modals)
- Text Primary: 220 9% 15%
- Text Secondary: 220 9% 46%

### B. Typography
**Font System**: Inter (Google Fonts)
- Headings: Inter 600-700 weight
- Body: Inter 400-500 weight
- Data/Numbers: Inter 500 weight (for clarity in dashboards)
- Labels: Inter 500 weight, uppercase tracking

### C. Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section margins: m-8, m-12
- Card spacing: p-6
- Grid gaps: gap-4, gap-6

### D. Component Library

**Navigation:**
- Admin: Collapsible sidebar with role-based menu items
- Driver: Bottom navigation for mobile-first experience
- Breadcrumbs for deep navigation paths

**Data Display:**
- Cards with subtle shadows and rounded corners (rounded-lg)
- Tables with zebra striping and hover states
- Status badges with semantic colors
- Progress indicators for trip completion

**Forms:**
- Floating labels for modern input experience
- Grouped form sections with clear visual separation
- Inline validation with immediate feedback

**Maps & Tracking:**
- Full-width map component with overlay controls
- Vehicle markers with status-based colors
- Route visualization with animated progress

**Overlays:**
- Slide-out panels for detailed views
- Modal dialogs for CRUD operations
- Toast notifications positioned top-right

### E. Role-Specific Design Patterns

**Admin Dashboard:**
- Dense information layout with metric cards
- Live updating elements with subtle pulse animations
- Multi-column layouts utilizing full screen width
- Advanced filtering and search capabilities

**Driver Interface:**
- Card-based trip display with clear CTAs
- Large touch targets for mobile use
- Simplified navigation focused on core tasks
- Trip status prominently displayed

## Visual Hierarchy
- Use elevation (shadows) to establish component hierarchy
- Typography scale: H1 (2xl), H2 (xl), H3 (lg), Body (base)
- Color intensity to indicate importance and status
- Consistent icon usage from Lucide React library

## Responsive Behavior
- Mobile-first approach with breakpoints at sm, md, lg, xl
- Admin dashboard: Collapsible sidebar becomes overlay on mobile
- Driver interface: Optimized for mobile with bottom navigation
- Map components: Full viewport on mobile, contained on desktop

## Real-time Visual Feedback
- Subtle animations for status changes (200ms transitions)
- Live indicators using small pulsing dots
- Progressive loading states for data-heavy components
- Color-coded status indicators throughout the interface

This design system prioritizes functionality and data clarity while maintaining a modern, professional appearance suitable for fleet management operations.