// src/components/RegisterForm.tsx
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Lock, User, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/AuthStore";
import { toast } from "react-toastify";
import { useLocationStore } from "@/store/useLocationStore";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    username: z
      .string()
      .min(2, { message: "Username must be at least 2 characters" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    provinceCode: z.string(),
    districtCode: z.string(),
    wardCode: z.string(),
    location: z.string().optional(),
    role: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.provinceCode !== "") {
      if (data.districtCode === "") {
        ctx.addIssue({
          code: "custom",
          message: "District is required if province is selected",
          path: ["districtCode"],
        });
      }
      if (data.wardCode === "") {
        ctx.addIssue({
          code: "custom",
          message: "Ward is required if province is selected",
          path: ["wardCode"],
        });
      }
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });


type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const registerUser = useAuthStore((state) => state.register);

  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    fetchProvinces,
    fetchDistricts,
    fetchWards,
    setSelectedProvince,
    setSelectedDistrict,
  } = useLocationStore();

  const {
    register: formRegister,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    trigger,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      provinceCode: "",
      districtCode: "",
      wardCode: "",
      role: "1",
    },
  });

  const provinceCode = watch("provinceCode");
  const districtCode = watch("districtCode");
  const wardCode = watch("wardCode");

  const [selectedRole, setSelectedRole] = useState("1");

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  useEffect(() => {
    if (provinceCode) {
      setSelectedProvince(provinceCode);
      useLocationStore.setState({ districts: [], wards: [] });
      setValue("districtCode", "");
      setValue("wardCode", "");
      fetchDistricts(provinceCode);
    }
  }, [provinceCode, setSelectedProvince, fetchDistricts, setValue]);

  useEffect(() => {
    if (provinceCode && districtCode) {
      setSelectedDistrict(districtCode);
      setValue("wardCode", "");
      fetchWards(provinceCode, districtCode);
    }
  }, [provinceCode, districtCode, setSelectedDistrict, fetchWards, setValue]);

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const address = {
        provinceCode: parseInt(data.provinceCode),
        districtCode: parseInt(data.districtCode),
        wardCode: parseInt(data.wardCode),
        placeId: data.location || "string",
      };

      let success;
      if (
        address.provinceCode === 0 ||
        address.districtCode === 0 ||
        address.wardCode === 0 ||
        address.provinceCode === null ||
        address.districtCode === null ||
        address.wardCode === null ||
        isNaN(address.provinceCode) ||
        isNaN(address.districtCode) ||
        isNaN(address.wardCode)
      ) {
        success = await registerUser(
          data.firstName,
          data.lastName,
          data.email,
          data.password,
          parseInt(data.role),
          data.username
        );
      } else {
        success = await registerUser(
          data.firstName,
          data.lastName,
          data.email,
          data.password,
          parseInt(data.role),
          data.username,
          address
        );
      }
     
      if (success) {
        toast.success("Registration successful! Please login.");
        onSuccess();
      } else {
        // Get error from store and display it
        const error = useAuthStore.getState().error;
        toast.error(error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Role Selection Tabs */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full">
          <TabsList className="flex w-full rounded-md bg-[#fffff] border p-1 gap-2">
            <TabsTrigger
              value="1"
              className="w-full rounded-md px-2 py-1 text-sm font-medium text-gray-700
                        transition-all duration-400 ease-in-out
                        data-[state=active]:bg-[#de9151] data-[state=active]:text-white"
            >
              User
            </TabsTrigger>
            <TabsTrigger
              value="2"
              className="w-full rounded-md px-2 py-1 text-sm font-medium text-gray-700
                        transition-all duration-400 ease-in-out
                        data-[state=active]:bg-[#de9151] data-[state=active]:text-white"
            >
              Personal Trainer (PT)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* First Name and Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            placeholder="First Name"
            {...formRegister("firstName")}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            placeholder="Last Name"
            {...formRegister("lastName")}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <AtSign size={18} />
          </div>
          <Input
            id="register-email"
            placeholder="email@example.com"
            className="pl-10"
            {...formRegister("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <User size={18} />
          </div>
          <Input
            id="username"
            placeholder="username"
            className="pl-10"
            {...formRegister("username")}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      {/* Province and District */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Select
            value={provinceCode}
            onValueChange={(value) => {
              setValue("provinceCode", value);
              trigger("provinceCode");
            }}
          >
            <SelectTrigger id="province" className="w-full">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province.code} value={String(province.code)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provinceCode && (
            <p className="text-sm text-red-500">{errors.provinceCode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District</Label>
          <Select
            value={districtCode}
            onValueChange={(value) => {
              setValue("districtCode", value);
              trigger("districtCode");
            }}
            disabled={!selectedProvince || districts.length === 0}
          >
            <SelectTrigger id="district" className="w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.code} value={String(district.code)}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.districtCode && (
            <p className="text-sm text-red-500">{errors.districtCode.message}</p>
          )}
        </div>
      </div>

      {/* Ward and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ward">Ward</Label>
          <Select
            value={wardCode}
            onValueChange={(value) => {
              setValue("wardCode", value);
              trigger("wardCode");
            }}
            disabled={!selectedDistrict || wards.length === 0}
          >
            <SelectTrigger id="ward" className="w-full">
              <SelectValue placeholder="Select ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.code} value={String(ward.code)}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wardCode && (
            <p className="text-sm text-red-500">{errors.wardCode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            placeholder="104 Nguyễn Chí Thanh"
            {...formRegister("location")}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
          </div>
          <Input
            id="register-password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            {...formRegister("password")}
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={18} />
          </div>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            className="pl-10"
            {...formRegister("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#de9151] hover:bg-[#bf6922] text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
