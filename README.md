# Financial ERP System

A comprehensive financial management system for enterprises with user dashboards, expense tracking, and admin analytics.

## Features

- User authentication and role-based access control
- Expense tracking with receipt uploads
- Admin dashboard with analytics and reporting
- User profile management
- Real-time data synchronization
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: Shadcn UI, Tailwind CSS
- **State Management**: React Context API
- **Backend**: Firebase (Authentication & Firestore)
- **Charts**: Recharts
- **Notifications**: React Toastify

## Firebase Integration

This application uses Firebase for authentication and data storage. The Firebase project is already configured with the following services:

1. **Firebase Authentication**: Email/password authentication
2. **Firestore Database**: Real-time data storage for employees and expenses
3. **Firebase Analytics**: Usage tracking and insights

### Firebase Configuration

The application is already configured with your Firebase project credentials:

- Project ID: `financial-erp-system`
- Authentication: Enabled for email/password
- Firestore: Enabled with security rules

### Default Users

The system comes with pre-configured users for testing:

- **Admin**: admin@company.com / admin123
- **Regular User**: user@company.com / user123

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and Firebase config
├── pages/               # Page components
├── scripts/             # Utility scripts
├── services/            # API and Firebase service functions
└── App.tsx              # Main application component
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Firebase Data Structure

### Employees Collection
```
{
  id: string,
  email: string,
  password: string,
  name: string (optional),
  sector: string (optional),
  age: number (optional),
  status: string (employee|founder|manager|intern|admin)
}
```

### Expenses Collection
```
{
  id: string,
  userId: string,
  amount: number,
  description: string,
  file: string (base64 or URL),
  fileName: string,
  timestamp: string (YYYY-MM-DD),
  date: string (YYYY-MM-DD),
  company: string,
  sector: string
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.