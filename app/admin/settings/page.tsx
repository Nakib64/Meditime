"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { User, Mail, Shield, Lock, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    phoneNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/auth/verify");
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            email: data.user.email || "",
            username: data.user.username || "",
            phoneNumber: data.user.phoneNumber || "",
          }));
          const nums = data.user.phoneNumber
            ? data.user.phoneNumber.split(",").map((n: string) => n.trim()).filter(Boolean)
            : [""];
          setPhoneNumbers(nums.length > 0 ? nums : [""]);
        }
      } catch (err) {
        console.error("Failed to load admin profile info:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return showToast.error("New passwords do not match");
    }

    const updatedPhoneNumber = phoneNumbers.map(n => n.trim()).filter(Boolean).join(",");

    setLoading(true);
    try {
      const response = await fetch("/api/admin/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phoneNumber: updatedPhoneNumber,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success("Profile updated successfully");
        setFormData(prev => ({
          ...prev,
          phoneNumber: result.user.phoneNumber || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        showToast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Admin Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your administrative credentials and security</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>
          
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Account Information
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-10 h-11 rounded-xl"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  placeholder="admin_username"
                  className="pl-10 h-11 rounded-xl"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <Label>Phone Numbers (For SMS OTP Verification)</Label>
              <div className="space-y-3">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="tel"
                        placeholder="01XXXXXXXXX (11 digits)"
                        className="h-11 rounded-xl"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                          const updated = [...phoneNumbers];
                          updated[index] = val;
                          setPhoneNumbers(updated);
                        }}
                        required
                      />
                    </div>
                    {phoneNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl animate-fade-in"
                        onClick={() => {
                          const updated = phoneNumbers.filter((_, i) => i !== index);
                          setPhoneNumbers(updated);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 text-primary border-primary/20 hover:bg-primary/5 rounded-xl h-10"
                onClick={() => setPhoneNumbers([...phoneNumbers, ""])}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Phone Number
              </Button>
              <p className="text-xs text-gray-500 mt-1">Each phone number must be an 11-digit Bangladeshi number starting with 01 (e.g. 01712345678). Used for SMS verification upon login.</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full"></div>
          
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-amber-900">
            <Lock className="h-5 w-5 text-amber-500" />
            Security & Password
          </h2>
          
          <div className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6">
              <p className="text-sm text-amber-800">
                To update your credentials or password, you must provide your current password for security verification.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2 max-w-md">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pl-10 h-11 rounded-xl"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password (optional)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 rounded-xl"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="h-12 px-8 rounded-xl border-gray-200"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-12 px-8 rounded-xl bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
