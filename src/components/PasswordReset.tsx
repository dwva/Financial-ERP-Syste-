import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Lock } from 'lucide-react';

interface PasswordResetProps {
  email: string;
  onPasswordReset: (newPassword: string) => Promise<void>;
  onCancel: () => void;
}

const PasswordReset = ({ email, onPasswordReset, onCancel }: PasswordResetProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await onPasswordReset(newPassword);
      toast.success('Password reset successful! You can now log in with your new password.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center text-sm">
            Your account requires a password reset. Please create a new password.
          </CardDescription>
          <CardDescription className="text-center text-xs font-medium mt-2">
            Account: {email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="text-sm h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="text-sm h-10"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-10" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PasswordReset;