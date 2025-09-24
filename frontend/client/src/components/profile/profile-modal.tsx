import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, updateProfile, changePassword, isUpdateProfileLoading, isChangePasswordLoading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      return;
    }
    changePassword({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Information */}
          <form onSubmit={handleUpdateProfile} className="space-y-4" data-testid="form-update-profile">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  data-testid="input-fullname"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isUpdateProfileLoading}
                data-testid="button-update-profile"
              >
                {isUpdateProfileLoading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>

          <Separator />

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-4" data-testid="form-change-password">
            <h3 className="text-lg font-medium">Change Password</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  required
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button 
                type="submit" 
                variant="secondary" 
                className="w-full" 
                disabled={isChangePasswordLoading || passwordData.new_password !== passwordData.confirm_password}
                data-testid="button-change-password"
              >
                {isChangePasswordLoading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
