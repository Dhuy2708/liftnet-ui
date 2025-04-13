// src/components/RegisterForm.tsx
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Lock, User, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/store/AuthStore";
import { toast } from "react-toastify";
import { useLocationStore } from "@/store/useLocationStore";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" })
      .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least 1 number" }),
    confirmPassword: z.string(),
    provinceCode: z.string().optional(),
    districtCode: z.string().optional(),
    wardCode: z.string().optional(),
    location: z.string().optional(),
    role: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.provinceCode) {
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
  const [showAddress, setShowAddress] = useState(false);

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
      if (data.provinceCode || data.districtCode || data.wardCode || data.location) {
        const address = {
          provinceCode: parseInt(data.provinceCode || "0"),
          districtCode: parseInt(data.districtCode || "0"),
          wardCode: parseInt(data.wardCode || "0"),
          placeId: data.location || "string",
        };

        if (address.provinceCode && address.districtCode && address.wardCode) {
          const success = await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.password,
            parseInt(data.role),
            address
          );
          handleRegistrationResult(success);
        } else {
          const success = await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.password,
            parseInt(data.role),
            null
          );
          handleRegistrationResult(success);
        }
      } else {
        const success = await registerUser(
          data.firstName,
          data.lastName,
          data.email,
          data.password,
          parseInt(data.role),
          null
        );
        handleRegistrationResult(success);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRegistrationResult(success: boolean) {
    if (success) {
      toast.success("Registration successful! Please login.");
      onSuccess();
    } else {
      const error = useAuthStore.getState().error;
      toast.error(error || "Registration failed. Please try again.");
    }
  }

  const clearAddressFields = () => {
    setValue("provinceCode", "");
    setValue("districtCode", "");
    setValue("wardCode", "");
    setValue("location", "");
    useLocationStore.setState({ districts: [], wards: [] });
    setSelectedProvince("");
    setSelectedDistrict("");
  };

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

      {/* Address Section Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enable-address"
          checked={showAddress}
          onCheckedChange={(checked) => {
            setShowAddress(!!checked);
            if (!checked) {
              clearAddressFields();
            }
          }}
          className="data-[state=checked]:bg-[#de9151] data-[state=checked]:border-[#de9151]"
        />
        <Label 
          htmlFor="enable-address" 
          className="text-sm text-gray-600 cursor-pointer"
        >
          Address (Optional)
        </Label>
      </div>

      {/* Address Fields */}
      <div 
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${showAddress ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="space-y-4">
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
                disabled={!showAddress}
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
                disabled={!showAddress || !selectedProvince || districts.length === 0}
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
                disabled={!showAddress || !selectedDistrict || wards.length === 0}
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
                disabled={!showAddress || !provinceCode || !districtCode || !wardCode}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>
          </div>
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
