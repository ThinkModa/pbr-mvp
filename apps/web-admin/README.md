# PBR MVP - Web Admin Dashboard

A modern admin dashboard built with React, TypeScript, and Tailwind CSS using the Catalyst UI kit.

## Features

- **Modern Design**: Clean, professional interface using Catalyst UI components
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Built-in dark/light theme switching
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom PBR brand colors

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Catalyst UI** - Professional UI component library
- **Headless UI** - Unstyled, accessible UI components

## Project Structure

```
apps/web-admin/
├── src/
│   ├── components/          # Catalyst UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── sidebar.tsx
│   │   ├── sidebar-layout.tsx
│   │   └── navbar.tsx
│   ├── pages/              # Application pages
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx
│   ├── App.tsx             # Main app component
│   ├── index.tsx           # App entry point
│   └── index.css           # Global styles
├── package.json
├── tailwind.config.js      # Tailwind configuration
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server

The admin dashboard runs on `http://localhost:3001` by default.

## Design System

### Brand Colors

The admin uses PBR brand colors defined in `tailwind.config.js`:

- **Primary**: `#D29507` (Golden yellow)
- **Secondary**: `#265451` (Dark teal)  
- **Accent**: `#933B25` (Terracotta)
- **Background**: `#FBF6F1` (Light cream)

### Components

All UI components are based on the Catalyst UI kit and include:

- **Button** - Multiple variants (solid, outline, plain) with color options
- **Input** - Form inputs with proper focus states and validation
- **Sidebar** - Navigation sidebar with collapsible sections
- **SidebarLayout** - Main layout with sidebar and content area
- **Navbar** - Top navigation bar

## Pages

### Login Page (`/login`)
- Clean, centered login form
- Email and password validation
- Remember me functionality
- Forgot password link

### Dashboard (`/admin`)
- Overview statistics cards
- Recent activity feed
- Navigation sidebar
- Responsive grid layout

## Customization

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add routing logic in `App.tsx`
3. Update sidebar navigation in `DashboardPage.tsx`

### Styling

- Use Tailwind utility classes for styling
- Custom colors are available as `pbr-primary`, `pbr-secondary`, etc.
- Dark mode classes are automatically applied

### Components

- All components are in `src/components/`
- Based on Catalyst UI patterns
- Fully typed with TypeScript
- Accessible by default

## Integration

This admin dashboard integrates with:

- **Database**: Uses `@pbr/database` package for data access
- **Shared UI**: Can import components from `@pbr/ui` if needed
- **API**: Ready for integration with `@pbr/api` package

## Deployment

The admin dashboard can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Connect to Git repository
- **AWS S3**: Upload build files to S3 bucket

## Development

### Code Style

- Use TypeScript for all components
- Follow React best practices
- Use Tailwind classes for styling
- Keep components small and focused

### Adding Features

1. Create new components in appropriate directories
2. Update navigation if needed
3. Add proper TypeScript types
4. Test responsive behavior
5. Ensure accessibility compliance

## Support

For questions or issues with the admin dashboard, refer to:

- [Catalyst UI Documentation](https://catalyst.tailwindui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
