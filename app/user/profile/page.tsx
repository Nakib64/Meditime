"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Activity,
  Clock,
  Edit,
  Save,
  Eye,
  EyeOff,
  Camera,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Stethoscope,
  ShieldCheck,
  Award,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

const profileSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phoneNumber: z.string().length(11, "Phone number must be exactly 11 digits").regex(/^[0-9]+$/, "Phone number must contain only digits"),
    gender: z.enum(["male", "female", "other"], { error: "Gender is required" }),
    bloodGroup: z.string().optional(),
    age: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().min(1, "Age must be greater than 0").max(150, "Age must be less than 150")
    ),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    confirmPassword: z.string().optional(),
    currentPassword: z.string().optional().or(z.literal("")),
    photo: z.string().optional(),
  })
  .refine((data) => {
    if (data.password && data.password.length > 0) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.password && data.password.length > 0) {
      return !!data.currentPassword && data.currentPassword.length > 0;
    }
    return true;
  }, {
    message: "Current password is required to change password",
    path: ["currentPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  gender?: string;
  bloodGroup?: string;
  age?: number;
  photo?: string;
  createdAt?: string;
}

interface Appointment {
  _id: string;
  serialNumber?: string;
  patientName: string;
  mobileNumber: string;
  appointmentDate: string;
  hospitalName: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  doctorId?: {
    name: string;
    nameBn?: string;
    qualification?: string;
    qualificationBn?: string;
    hospital?: string;
    hospitalBn?: string;
  };
  createdAt: string;
}

export default function UserProfilePage() {
  const { language } = useLanguage() as { language: "en" | "bn" };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }

    try {
      const parsedData = JSON.parse(userData);
      setUser(parsedData);

      setValue("fullName", parsedData.fullName || "");
      setValue("email", parsedData.email || "");
      setValue("phoneNumber", (parsedData.phoneNumber || "").replace(/^\+?88/, "") || "");
      setValue("gender", (parsedData.gender as "male" | "female" | "other") || "male");
      setValue("bloodGroup", parsedData.bloodGroup || "");
      setValue("age", (parsedData.age || "") as any);
      setValue("photo", parsedData.photo || "");

      if (parsedData.photo) {
        setImagePreview(parsedData.photo);
      }

      if (parsedData.id) {
        fetchAppointments(parsedData.id);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router, setValue]);

  const fetchAppointments = async (userId: string) => {
    setAppointmentsLoading(true);
    try {
      const response = await fetch(`/api/appointments?userId=${userId}`);
      const data = await response.json();
      if (response.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm shadow-amber-500/10",
      confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm shadow-emerald-500/10",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm shadow-rose-500/10",
      completed: "bg-blue-50 text-blue-700 border-blue-200/50 shadow-sm shadow-blue-500/10",
    };

    const labels = {
      pending: language === 'bn' ? "অপেক্ষমান" : "Pending",
      confirmed: language === 'bn' ? "নিশ্চিত" : "Confirmed",
      cancelled: language === 'bn' ? "বাতিল" : "Cancelled",
      completed: language === 'bn' ? "সম্পন্ন" : "Completed",
    };

    const icons = {
      pending: Clock,
      confirmed: ShieldCheck,
      cancelled: XCircle,
      completed: CheckCircle,
    };

    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${styles[status as keyof typeof styles] || styles.pending} transition-all hover:scale-105`}
      >
        <Icon className="h-3.5 w-3.5" />
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast.error("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("Image size must be less than 10MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }
    const data = await response.json();
    return data.url;
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      let photoUrl = data.photo;
      if (selectedImage) {
        setIsUploading(true);
        try {
          photoUrl = await uploadImage(selectedImage);
          setValue("photo", photoUrl);
        } catch (error: any) {
          showToast.error(error.message || "Failed to upload image.");
          return;
        } finally {
          setIsUploading(false);
        }
      }

      let formattedPhone = data.phoneNumber;
      if (!formattedPhone.startsWith("+880")) {
        const cleanPhone = formattedPhone.replace(/^0+/, '');
        formattedPhone = `+880${cleanPhone}`;
      }

      const updateData: any = {
        userId: user.id,
        fullName: data.fullName,
        email: data.email || "",
        phoneNumber: formattedPhone,
        gender: data.gender,
        bloodGroup: data.bloodGroup || "",
        age: data.age,
        photo: photoUrl || "",
      };

      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
        updateData.currentPassword = data.currentPassword;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.user) {
          localStorage.setItem("user", JSON.stringify(result.user));
          window.dispatchEvent(new Event("userLogin"));
          setUser(result.user);
          if (result.user.photo) setImagePreview(result.user.photo);
          setValue("phoneNumber", (result.user.phoneNumber || "").replace(/^\+?88/, "") || "");
        }
        showToast.success("Profile updated successfully!");
        setIsEditing(false);
        setSelectedImage(null);
        setValue("password", "");
        setValue("confirmPassword", "");
        setValue("currentPassword", "");
      } else {
        showToast.error(result.error || "Failed to update profile");
      }
    } catch (error: any) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Profile Section */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="h-32 w-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transition-transform group-hover:scale-105 duration-300">
              {imagePreview ? (
                <Image src={imagePreview} alt={user.fullName} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-black">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-all shadow-xl active:scale-90">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                {isEditing ? (
                  <Input
                    {...register("fullName")}
                    className="text-4xl font-black border-none p-0 h-auto focus-visible:ring-0 bg-transparent w-full"
                    placeholder="Full Name"
                  />
                ) : user.fullName}
              </h1>
            </div>
            <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2" >
              <Mail className="h-4 w-4" />
              {isEditing ? (
                <Input
                  {...register("email")}
                  className="text-gray-500 border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                  placeholder={language === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}
                />
              ) : (user.email || (language === 'bn' ? 'কোনো ইমেইল প্রদান করা হয়নি' : "No email provided"))}
            </p>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
              >
                <Edit className="h-4 w-4 mr-2" />
                {language === "bn" ? "প্রোফাইল সম্পাদন" : "Edit Profile"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedImage(null);
                  setImagePreview(user.photo || null);
                  setValue("fullName", user.fullName || "");
                  setValue("email", user.email || "");
                  setValue("phoneNumber", (user.phoneNumber || "").replace(/^\+?88/, "") || "");
                  setValue("gender", (user.gender as "male" | "female" | "other") || "male");
                  setValue("bloodGroup", user.bloodGroup || "");
                  setValue("age", (user.age || "") as any);
                  setValue("photo", user.photo || "");
                }}
                className="rounded-2xl px-6 h-12 font-bold hover:bg-gray-50 transition-all"
              >
                <X className="h-4 w-4 mr-2" />
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form / Info */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 rounded-3xl border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {language === "bn" ? "ফোন নম্বর" : "Phone Number"}
                  </Label>
                  <div className="relative">
                    {isEditing ? (
                      <div className="relative flex items-center w-full">
                        <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                          <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                          <span>+88</span>
                        </span>
                        <Input
                          type="tel"
                          maxLength={11}
                          {...register("phoneNumber", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                            }
                          })}
                          className="pl-[5rem] h-14 w-full rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                        />
                      </div>
                    ) : (
                      <div className="relative flex items-center w-full">
                        <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                          <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                          <span>+88</span>
                        </span>
                        <div className="pl-[5rem] h-14 w-full flex items-center text-gray-900 font-bold bg-gray-50/50 rounded-2xl px-4 border border-transparent">
                          {user.phoneNumber ? user.phoneNumber.replace(/^\+?88/, "") : ""}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.phoneNumber && <p className="text-[10px] text-rose-500 font-bold uppercase">{language === 'bn' ? "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX" : "Please provide 11 digits number (starting with 01). Example: 01XXXXXXXXX"}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {language === "bn" ? "লিঙ্গ" : "Gender"}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <Select {...register("gender")} className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium">
                        <option value="male">{language === "bn" ? "পুরুষ" : "Male"}</option>
                        <option value="female">{language === "bn" ? "মহিলা" : "Female"}</option>
                        <option value="other">{language === "bn" ? "অন্যান্য" : "Other"}</option>
                      </Select>
                    ) : (
                      <div className="pl-12 h-14 flex items-center text-gray-900 font-bold bg-gray-50/50 rounded-2xl px-4 border border-transparent capitalize">
                        {language === 'bn' ? (user.gender === 'male' ? 'পুরুষ' : user.gender === 'female' ? 'মহিলা' : 'অন্যান্য') : user.gender}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {language === "bn" ? "রক্তের গ্রুপ" : "Blood Group"}
                  </Label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <Select {...register("bloodGroup")} className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium">
                        <option value="">{language === "bn" ? "নির্বাচন করুন" : "Select"}</option>
                        {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </Select>
                    ) : (
                      <div className="pl-12 h-14 flex items-center text-gray-900 font-bold bg-gray-50/50 rounded-2xl px-4 border border-transparent">
                        {user.bloodGroup || "—"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    {language === "bn" ? "বয়স" : "Age"}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {isEditing ? (
                      <Input {...register("age", { valueAsNumber: true })} type="number" className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium" />
                    ) : (
                      <div className="pl-12 h-14 flex items-center text-gray-900 font-bold bg-gray-50/50 rounded-2xl px-4 border border-transparent">
                        {user.age || "—"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-6 border-t space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {language === "bn" ? "নিরাপত্তা সেটিংস" : "Security Settings"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 relative md:col-span-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</Label>
                      <Input {...register("currentPassword")} type={showCurrentPassword ? "text" : "password"} className="h-12 rounded-xl bg-gray-50 border-gray-100 placeholder:text-gray-300" placeholder={language === 'bn' ? 'বর্তমান পাসওয়ার্ড লিখুন' : '••••••••'} />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-[42px] text-gray-400 hover:text-primary">
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {errors.currentPassword && <p className="text-[10px] text-rose-500 font-bold uppercase">{errors.currentPassword.message}</p>}
                    </div>
                    <div className="space-y-2 relative">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
                      <Input {...register("password")} type={showPassword ? "text" : "password"} className="h-12 rounded-xl bg-gray-50 border-gray-100" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[42px] text-gray-400 hover:text-primary">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="space-y-2 relative">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">{language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}</Label>
                      <Input {...register("confirmPassword")} type={showConfirmPassword ? "text" : "password"} className="h-12 rounded-xl bg-gray-50 border-gray-100" placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-[42px] text-gray-400 hover:text-primary">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 active:scale-[0.98] transition-all">
                    {isSaving ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" /> : (language === "bn" ? "পরিবর্তন সংরক্ষণ করুন" : "Save All Changes")}
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Appointments Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Stethoscope className="h-7 w-7 text-primary" />
                {language === "bn" ? "সাম্প্রতিক অ্যাপয়েন্টমেন্ট" : "Recent Appointments"}
              </h2>
              <Button variant="link" onClick={() => router.push('/appointments')} className="text-primary font-black uppercase text-xs tracking-widest">
                {language === "bn" ? "সব দেখুন" : "View Full History"}
              </Button>
            </div>

            <div className="space-y-4">
              {appointmentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />)}
                </div>
              ) : appointments.length === 0 ? (
                <Card className="p-12 text-center rounded-3xl border-dashed border-gray-200">
                  <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Calendar className="h-10 w-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-bold">{language === "bn" ? "কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি" : "No appointments found yet."}</p>
                  <Button onClick={() => router.push('/doctor')} className="mt-6 rounded-xl font-bold" variant="outline">
                    {language === "bn" ? "এখনই বুক করুন" : "Book Your First Appointment"}
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div key={appointment._id} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <Stethoscope className="h-8 w-8" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors" >
                              {language === 'bn'
                                ? (appointment.doctorId?.nameBn || '')
                                : (appointment.doctorId?.name || 'Doctor')}
                            </h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1" >
                              <MapPin className="h-3 w-3" />
                              {language === 'bn' ? (appointment.doctorId?.hospitalBn || '') : (appointment.hospitalName || '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">{format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'তারিখ' : 'Date'}</p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="space-y-8">
          {/* Quick Stats Card */}
          <Card className="p-8 rounded-3xl bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {language === 'bn' ? 'কার্যকলাপ' : 'Activity Stats'}
            </h3>

            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-5xl font-black tracking-tighter">{appointments.length}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{language === 'bn' ? 'মোট বুকিং' : 'Total Bookings'}</p>
                </div>
                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-2xl font-black text-emerald-400">{appointments.filter(a => a.status === 'completed').length}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{language === 'bn' ? 'সম্পন্ন' : 'Completed'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-2xl font-black text-amber-400">{appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{language === 'bn' ? 'আসন্ন' : 'Upcoming'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="p-8 rounded-3xl border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
              {language === 'bn' ? 'দ্রুত ব্যবস্থা' : 'Quick Actions'}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => router.push('/doctor')} className="w-full h-14 rounded-2xl justify-start px-6 gap-4 font-bold group" variant="outline">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Calendar className="h-4 w-4" />
                </div>
                {language === "bn" ? "নতুন অ্যাপয়েন্টমেন্ট" : "Book New Appointment"}
              </Button>
              <Button onClick={() => router.push('/user/dashboard')} className="w-full h-14 rounded-2xl justify-start px-6 gap-4 font-bold group" variant="outline">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                {language === "bn" ? "সব বুকিং দেখুন" : "View All Bookings"}
              </Button>
            </div>
          </Card>

          {/* Support Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/20">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-xl font-black tracking-tight mb-2" >
              {language === 'bn' ? 'সাহায্য প্রয়োজন?' : 'Need Help?'}
            </h4>
            <p className="text-sm font-medium text-white/70 mb-6" >
              {language === 'bn' ? 'আমাদের ২৪/৭ সাপোর্ট টিম আপনার মেডিকেল অ্যাপয়েন্টমেন্টে সহায়তা করতে এখানে আছে।' : 'Our 24/7 support team is here to assist with your medical appointments.'}
            </p>
            <Button
              className="w-full rounded-xl bg-white text-primary font-black hover:bg-white/90 active:scale-95 transition-all"
              onClick={() => window.open('https://wa.me/01610384444', '_blank')}

            >
              {language === 'bn' ? 'সাপোর্টের সাথে যোগাযোগ করুন' : 'Contact Support'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
