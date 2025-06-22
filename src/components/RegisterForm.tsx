"use client"

import { useState, useEffect, useMemo } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AtSign,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  MapPin,
  User,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  UserCircle,
} from "lucide-react"
import { useAuthStore } from "@/store/AuthStore"
import { toast } from "react-toastify"
import { GeoStore } from "@/store/GeoStore"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"

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
    age: z.number().min(1, { message: "Age is required" }).max(120, { message: "Age must be less than 120" }),
    gender: z.number().min(0).max(3, { message: "Please select a valid gender" }),
  })
  .superRefine((data, ctx) => {
    if (data.provinceCode) {
      if (data.districtCode === "") {
        ctx.addIssue({
          code: "custom",
          message: "District is required if province is selected",
          path: ["districtCode"],
        })
      }
      if (data.wardCode === "") {
        ctx.addIssue({
          code: "custom",
          message: "Ward is required if province is selected",
          path: ["wardCode"],
        })
      }
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess: () => void
}

// Gender color map
const genderOptions = [
  { value: 0, label: "None", color: "text-gray-400" },
  { value: 1, label: "Male", color: "text-blue-500" },
  { value: 2, label: "Female", color: "text-pink-500" },
  { value: 3, label: "Other", color: "text-purple-500" },
];

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const registerUser = useAuthStore((state) => state.register)

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
  } = GeoStore()

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
      age: undefined,
      gender: 0,
    },
  })

  const provinceCode = watch("provinceCode")
  const districtCode = watch("districtCode")
  const wardCode = watch("wardCode")

  const [selectedRole, setSelectedRole] = useState("1")
  const [showAddress, setShowAddress] = useState(false)
  const [isProvinceOpen, setIsProvinceOpen] = useState(false)

  // Local search state for address dropdowns
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  // Helper for diacritic-insensitive search
  function normalizeString(str: string) {
    // Replace đ/Đ with d/D before removing diacritics
    return str
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }
  const normalizedProvinceSearch = normalizeString(provinceSearch);
  const normalizedDistrictSearch = normalizeString(districtSearch);
  const normalizedWardSearch = normalizeString(wardSearch);
  const filteredProvinces = useMemo(() =>
    provinces.filter(p => normalizeString(p.name).includes(normalizedProvinceSearch)),
    [normalizedProvinceSearch, provinces]
  );
  const filteredDistricts = useMemo(() =>
    districts.filter(d => normalizeString(d.name).includes(normalizedDistrictSearch)),
    [normalizedDistrictSearch, districts]
  );
  const filteredWards = useMemo(() =>
    wards.filter(w => normalizeString(w.name).includes(normalizedWardSearch)),
    [normalizedWardSearch, wards]
  );

  useEffect(() => {
    if (isProvinceOpen && provinces.length === 0) {
      fetchProvinces()
    }
  }, [isProvinceOpen, provinces.length, fetchProvinces])

  useEffect(() => {
    if (!provinceCode) return;
    if (selectedProvince !== provinceCode) {
      setSelectedProvince(provinceCode);
      GeoStore.setState({ districts: [], wards: [] });
      setValue("districtCode", "");
      setValue("wardCode", "");
      fetchDistricts(provinceCode);
    }
  }, [provinceCode, selectedProvince, setSelectedProvince, fetchDistricts, setValue]);

  useEffect(() => {
    if (!provinceCode || !districtCode) return;
    if (selectedDistrict !== districtCode) {
      setSelectedDistrict(districtCode);
      setValue("wardCode", "");
      fetchWards(provinceCode, districtCode);
    }
  }, [provinceCode, districtCode, selectedDistrict, setSelectedDistrict, fetchWards, setValue]);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const step1Fields = ["firstName", "lastName", "email", "role"] as const
    const isValid = await trigger(step1Fields)
      if (isValid) setCurrentStep(2)
    } else if (currentStep === 2) {
      const step2Fields = ["password", "confirmPassword"] as const
      const isValid = await trigger(step2Fields)
      if (isValid) setCurrentStep(3)
    }
  }

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    try {
      if (data.provinceCode || data.districtCode || data.wardCode || data.location) {
        const address = {
          provinceCode: Number.parseInt(data.provinceCode || "0"),
          districtCode: Number.parseInt(data.districtCode || "0"),
          wardCode: Number.parseInt(data.wardCode || "0"),
          placeId: data.location || "string",
        }

        if (address.provinceCode && address.districtCode && address.wardCode) {
          const success = await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.password,
            Number.parseInt(data.role),
            address,
            data.age,
            data.gender,
          )
          handleRegistrationResult(success)
        } else {
          const success = await registerUser(
            data.firstName,
            data.lastName,
            data.email,
            data.password,
            Number.parseInt(data.role),
            undefined,
            data.age,
            data.gender,
          )
          handleRegistrationResult(success)
        }
      } else {
        const success = await registerUser(
          data.firstName,
          data.lastName,
          data.email,
          data.password,
          Number.parseInt(data.role),
          undefined,
          data.age,
          data.gender,
        )
        handleRegistrationResult(success)
      }
    } catch (error) {
      console.error("Registration failed:", error)
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleRegistrationResult(success: boolean) {
    if (success) {
      toast.success("Registration successful! Please login.")
      onSuccess()
    } else {
      const error = useAuthStore.getState().error
      toast.error(error || "Registration failed. Please try again.")
    }
  }

  const clearAddressFields = () => {
    setValue("provinceCode", "")
    setValue("districtCode", "")
    setValue("wardCode", "")
    setValue("location", "")
    GeoStore.setState({ districts: [], wards: [] })
    setSelectedProvince(null)
    setSelectedDistrict(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className="flex items-center cursor-pointer" onClick={() => setCurrentStep(1)}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              currentStep === 1 ? "bg-violet-500 text-white" : currentStep > 1 ? "bg-violet-200 text-violet-700" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <span className="ml-2 text-sm text-gray-600">Basic Info</span>
        </div>
        <div
          className={`w-8 h-0.5 transition-all duration-300 ${currentStep >= 2 ? "bg-sky-500" : "bg-gray-200"}`}
        />
        <div className={`flex items-center cursor-pointer ${currentStep > 1 ? '' : 'pointer-events-none opacity-60'}`} onClick={() => currentStep > 1 && setCurrentStep(2)}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              currentStep === 2 ? "bg-sky-500 text-white" : currentStep > 2 ? "bg-sky-200 text-sky-700" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span className="ml-2 text-sm text-gray-600">Password & Personal</span>
        </div>
        <div
          className={`w-8 h-0.5 transition-all duration-300 ${currentStep >= 3 ? "bg-fuchsia-500" : "bg-gray-200"}`}
        />
        <div className={`flex items-center cursor-pointer ${currentStep > 2 ? '' : 'pointer-events-none opacity-60'}`} onClick={() => currentStep > 2 && setCurrentStep(3)}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              currentStep === 3 ? "bg-fuchsia-500 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
          <span className="ml-2 text-sm text-gray-600">Address (Optional)</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            // Only handle Enter if not on a button or textarea
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "TEXTAREA" || tag === "BUTTON") return;
            if (currentStep === 1) {
              e.preventDefault();
              const step1Fields = ["firstName", "lastName", "email", "role"] as const;
              const isValid = await trigger(step1Fields);
              if (isValid) handleNextStep();
            } else if (currentStep === 2) {
              e.preventDefault();
              const step2Fields = ["password", "confirmPassword"] as const;
              const isValid = await trigger(step2Fields);
              if (isValid) handleNextStep();
            }
            // For step 3, let the form submit naturally
          }
        }}
      >
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-orange-500" />
                  Account Type
                </Label>
                <Tabs
                  value={selectedRole}
                  onValueChange={(value) => {
                    setSelectedRole(value)
                    setValue("role", value)
                  }}
                  className="w-full"
                >
                  <TabsList className="flex w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-1 gap-1 h-11">
                    <TabsTrigger
                      value="1"
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-gray-700
                                transition-all duration-300 ease-in-out
                                data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Fitness Enthusiast
                    </TabsTrigger>
                    <TabsTrigger
                      value="2"
                      className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-gray-700
                                transition-all duration-300 ease-in-out
                                data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Personal Trainer
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-semibold text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white"
                    {...formRegister("firstName")}
                  />
                  {errors.firstName && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.firstName.message}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-semibold text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white"
                    {...formRegister("lastName")}
                  />
                  {errors.lastName && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.lastName.message}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AtSign size={16} className="text-orange-500" />
                  Email Address
                </Label>
                <Input
                  id="register-email"
                  placeholder="Enter your email"
                  className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white"
                  {...formRegister("email")}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 font-medium"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group mt-6"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              </motion.div>
          ) : currentStep === 2 ? (
                  <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Password Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="register-password"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <Lock size={16} className="text-orange-500" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white pr-12"
                      {...formRegister("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white pr-12"
                      {...formRegister("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.confirmPassword.message}
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 group"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                  Back
                </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                  className="flex-1 h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 w-full">
                  <Label htmlFor="age" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} className="text-orange-500" />
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min={6}
                    max={150}
                    placeholder="25"
                    className="h-11 px-4 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-gray-50/50 focus:bg-white w-full text-center flex items-center"
                    {...formRegister("age", { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.age.message}
                    </motion.p>
                  )}
                </div>
                <div className="space-y-2 w-full">
                  <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserCircle size={16} className="text-orange-500" />
                    Gender
                  </Label>
                  <Select value={String(watch("gender"))} onValueChange={(value) => setValue("gender", Number(value))}>
                    <SelectTrigger className="h-11 px-4 border-2 border-gray-200 focus:border-orange-400 rounded-xl w-full flex items-center justify-center bg-gray-50/50 focus:bg-white text-center"
                      style={{ minHeight: 44 }}
                    >
                      <SelectValue
                        placeholder="Select gender"
                        className="w-full text-center flex items-center justify-center"
                      >
                        {(() => {
                          const selected = genderOptions.find(opt => String(opt.value) === String(watch("gender")));
                          return selected ? (
                            <span className={`font-semibold ${selected.color}`}>{selected.label}</span>
                          ) : null;
                        })()}
                      </SelectValue>
                      <ChevronDown className="h-4 w-4 opacity-50 absolute right-3" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-gray-200">
                      {genderOptions.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)} className={`rounded-lg text-center font-semibold ${opt.color}`}>
                          {opt.label}
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500 font-medium"
                    >
                      {errors.gender.message}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Address Toggle */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl border border-orange-100 cursor-pointer"
              >
                <Checkbox
                  id="enable-address"
                  checked={showAddress}
                  onCheckedChange={(checked) => {
                    const shouldShow = !!checked;
                    setShowAddress(shouldShow);
                    if (!shouldShow) clearAddressFields();
                  }}
                  className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 rounded-md"
                />
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-orange-500" />
                  <Label htmlFor="enable-address" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Add Address (Optional)
                  </Label>
                </div>
              </motion.div>

              {/* Address Fields */}
              <AnimatePresence>
                {showAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="space-y-2 w-full">
                          <Label htmlFor="province" className="text-xs font-semibold text-gray-700">
                            Province
                          </Label>
                          <Select
                            value={provinceCode}
                            onValueChange={(value) => {
                              setValue("provinceCode", value)
                              trigger("provinceCode")
                              setProvinceSearch("");
                            }}
                            onOpenChange={setIsProvinceOpen}
                            disabled={!showAddress}
                          >
                            <SelectTrigger className="h-11 px-4 border-2 border-gray-200 focus:border-orange-400 rounded-xl w-full flex items-center justify-center bg-white text-center">
                              <SelectValue placeholder="Select province" className="w-full text-center" />
                              <ChevronDown className="h-4 w-4 opacity-50 absolute right-3" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-2 border-gray-200">
                              <div className="px-2 py-1">
                                <input
                                  type="text"
                                  value={provinceSearch}
                                  onChange={e => setProvinceSearch(e.target.value)}
                                  placeholder="Search province..."
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                              </div>
                              {filteredProvinces.map((province) => (
                                <SelectItem key={province.code} value={String(province.code)} className="rounded-md text-center">
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 w-full">
                          <Label htmlFor="district" className="text-xs font-semibold text-gray-700">
                            District
                          </Label>
                          <Select
                            value={districtCode}
                            onValueChange={(value) => {
                              setValue("districtCode", value)
                              trigger("districtCode")
                              setDistrictSearch("");
                            }}
                            disabled={!showAddress || !selectedProvince || districts.length === 0}
                          >
                            <SelectTrigger className="h-11 px-4 border-2 border-gray-200 focus:border-orange-400 rounded-xl w-full flex items-center justify-center bg-white text-center">
                              <SelectValue placeholder="Select district" className="w-full text-center" />
                              <ChevronDown className="h-4 w-4 opacity-50 absolute right-3" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-2 border-gray-200">
                              <div className="px-2 py-1">
                                <input
                                  type="text"
                                  value={districtSearch}
                                  onChange={e => setDistrictSearch(e.target.value)}
                                  placeholder="Search district..."
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                              </div>
                              {filteredDistricts.map((district) => (
                                <SelectItem key={district.code} value={String(district.code)} className="rounded-md text-center">
                                  {district.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 w-full">
                          <Label htmlFor="ward" className="text-xs font-semibold text-gray-700">
                            Ward
                          </Label>
                          <Select
                            value={wardCode}
                            onValueChange={(value) => {
                              setValue("wardCode", value)
                              trigger("wardCode")
                              setWardSearch("");
                            }}
                            disabled={!showAddress || !selectedDistrict || wards.length === 0}
                          >
                            <SelectTrigger className="h-11 px-4 border-2 border-gray-200 focus:border-orange-400 rounded-xl w-full flex items-center justify-center bg-white text-center">
                              <SelectValue placeholder="Select ward" className="w-full text-center" />
                              <ChevronDown className="h-4 w-4 opacity-50 absolute right-3" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-2 border-gray-200">
                              <div className="px-2 py-1">
                                <input
                                  type="text"
                                  value={wardSearch}
                                  onChange={e => setWardSearch(e.target.value)}
                                  placeholder="Search ward..."
                                  className="w-full px-2 py-1 border rounded mb-2 text-sm"
                                />
                              </div>
                              {filteredWards.map((ward) => (
                                <SelectItem key={ward.code} value={String(ward.code)} className="rounded-md text-center">
                                  {ward.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 w-full">
                          <Label htmlFor="location" className="text-xs font-semibold text-gray-700">
                            Street Address
                          </Label>
                          <Input
                            id="location"
                            placeholder="104 Nguyễn Chí Thanh"
                            className="h-11 border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 rounded-xl transition-all duration-300 bg-white w-full text-center"
                            {...formRegister("location")}
                            disabled={!showAddress || !provinceCode || !districtCode || !wardCode}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 group"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  )
}
