# Financial ERP System

A comprehensive financial management system for enterprises with user dashboards, expense tracking, and admin analytics.

## Features

- User authentication and role-based access control
- Expense tracking with receipt uploads
- Admin dashboard with analytics and reporting
- User profile management
- Real-time data synchronization
- Responsive design for all devices
- Message system with file attachments

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: Shadcn UI, Tailwind CSS
- **State Management**: React Context API
- **Backend**: Firebase (Authentication & Firestore)
- **File Storage**: Node.js Express Server with Multer
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

## Firebase Security Rules Fix

If you're seeing a warning about Firebase Realtime Database security rules, please refer to [FIREBASE_FIX_SUMMARY.md](FIREBASE_FIX_SUMMARY.md) for instructions on how to resolve this issue.

## File Attachment System

This application includes a messaging system with file attachment capabilities. Files are handled differently based on the environment:

### Development Mode
- Files are stored in the browser's sessionStorage
- File metadata is stored in localStorage
- No server-side storage is used

### Production Mode
- Files are stored on the server in the `public/message-attachments` directory
- A Node.js Express server handles file uploads
- File metadata is still stored in the browser

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

### Starting the Production Servers

For production deployment, you need to run both the frontend and the file server:

1. Start the file upload server:
   ```bash
   npm run server
   ```

2. Start the frontend application:
   ```bash
   npm run preview
   ```

Alternatively, you can use PM2 with the provided ecosystem.config.js:
```bash
npx pm2 start ecosystem.config.js
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
├── server/              # File upload server
└── App.tsx              # Main application component
```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run server`: Start file upload server
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