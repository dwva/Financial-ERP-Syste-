import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Lock, Mail } from 'lucide-react';
import PasswordReset from '@/components/PasswordReset';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { login, user, loading: authLoading, resetPassword, findUserByEmailOrIdentifier } = useAuth();
  const navigate = useNavigate();

  // Handle automatic redirection after successful login based on user role
  useEffect(() => {
    if (user) {
      // Automatically redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await login(identifier, password);
      if (success) {
        // Show success message
        toast.success('Login successful!');
        // Clear the form fields
        setIdentifier('');
        setPassword('');
        // Automatic redirection will happen in the useEffect when user state changes
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message === 'User not found') {
        errorMessage = 'No user found with this identifier. Please check your email, username, or mobile number.';
      } else if (error.message === 'Password reset required. Please contact admin.') {
        // Handle password reset required case
        const userResult = await findUserByEmailOrIdentifier(identifier);
        if (userResult && userResult.email) {
          setUserEmail(userResult.email);
          setShowPasswordReset(true);
          return; // Exit early to show password reset modal
        } else {
          errorMessage = 'Password reset required. Please contact admin.';
        }
      } else if (error.message === 'Invalid credentials. Please check your email and password.') {
        errorMessage = 'Invalid credentials. Please check your identifier and password.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format. Try using your username or mobile number instead.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please check your identifier.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid credentials. Please check your identifier and password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordReset = async (newPassword: string) => {
    try {
      await resetPassword(userEmail, newPassword);
      setShowPasswordReset(false);
      toast.success('Password reset successful! Please log in with your new password.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    }
  };

  // If authentication is still loading, show a loading indicator
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img 
              src="/mio[1].png" 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-xl text-center">Financial ERP System</CardTitle>
          <CardDescription className="text-center text-sm">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm">Email, Mobile Number, or Username</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email, mobile number, or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 text-sm h-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-sm h-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordReset 
          email={userEmail} 
          onPasswordReset={handlePasswordReset}
          onCancel={() => setShowPasswordReset(false)}
        />
      )}
    </div>
  );
};

export default Login;