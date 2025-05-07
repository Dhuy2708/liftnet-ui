import { create } from "zustand";

export interface GeoData {
  code: string;
  name: string;
  phoneCode?: string;
}

interface LocationSuggestion {
  description: string;
  placeId: string;
}

interface GeoStore {
  provinces: GeoData[];
  districts: GeoData[];
  wards: GeoData[];
  selectedProvince: string | null;
  selectedDistrict: string | null;
  fetchProvinces: () => Promise<void>;
  fetchDistricts: (provinceCode: string) => Promise<void>;
  fetchWards: (provinceCode: string, districtCode: string) => Promise<void>;
  setSelectedProvince: (province: string | null) => void;
  setSelectedDistrict: (district: string | null) => void;
  searchLocations: (searchText: string) => Promise<LocationSuggestion[]>;
}

export const GeoStore = create<GeoStore>(
  (set: (partial: Partial<GeoStore> | ((state: GeoStore) => Partial<GeoStore>)) => void) => ({
    provinces: [],
    districts: [],
    wards: [],
    selectedProvince: null,
    selectedDistrict: null,
    fetchProvinces: async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Geo/provinces/search`
        );
        const data = await response.json();
        const formattedProvinces: GeoData[] = [];
        if (data && data.datas && Array.isArray(data.datas)) {
          const provincesData = data.datas as Array<Record<string, unknown>>;
          provincesData.forEach((provinceObject) => {
            Object.keys(provinceObject).forEach((key) => {
              const province = provinceObject[key] as {
                code: number | string;
                name: string;
                phoneCode?: number | string;
              };
              if (province && province.code !== undefined && province.name) {
                formattedProvinces.push({
                  code: province.code.toString(),
                  name: province.name,
                  phoneCode: province.phoneCode?.toString() || "",
                });
              }
            });
          });
        }
        set({ provinces: formattedProvinces });
      } catch (error) {
        console.error("Error fetching provinces:", error);
        set({ provinces: [] });
      }
    },
    fetchDistricts: async (provinceCode: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Geo/districts/search?provinceCode=${provinceCode}`
        );
        const data = await response.json();
        const formattedDistricts: GeoData[] = [];
        if (data && data.datas && Array.isArray(data.datas)) {
          const districtsData = data.datas as Array<Record<string, unknown>>;
          districtsData.forEach((districtObject) => {
            Object.keys(districtObject).forEach((key) => {
              const district = districtObject[key] as {
                code: number | string;
                name: string;
              };
              if (district && district.code !== undefined && district.name) {
                formattedDistricts.push({
                  code: district.code.toString(),
                  name: district.name,
                });
              }
            });
          });
        }
        set({ districts: formattedDistricts });
      } catch (error) {
        console.error("Error fetching districts:", error);
        set({ districts: [] });
      }
    },
    fetchWards: async (provinceCode: string, districtCode: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Geo/wards/search?provinceCode=${provinceCode}&districtCode=${districtCode}`
        );
        const data = await response.json();
        const formattedWards: GeoData[] = [];
        if (data && data.datas && Array.isArray(data.datas)) {
          const wardsData = data.datas as Array<Record<string, unknown>>;
          wardsData.forEach((wardObject) => {
            Object.keys(wardObject).forEach((key) => {
              const ward = wardObject[key] as {
                code: number | string;
                name: string;
              };
              if (ward && ward.code !== undefined && ward.name) {
                formattedWards.push({
                  code: ward.code.toString(),
                  name: ward.name,
                });
              }
            });
          });
        }
        set({ wards: formattedWards });
      } catch (error) {
        console.error("Error fetching wards:", error);
        set({ wards: [] });
      }
    },
    setSelectedProvince: (province: string | null) =>
      set({ selectedProvince: province }),
    setSelectedDistrict: (district: string | null) =>
      set({ selectedDistrict: district }),
    searchLocations: async (searchText: string) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/Geo/location/search?q=${encodeURIComponent(searchText)}&searchRelated=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
        const data = await response.json();
        if (data && data.datas && Array.isArray(data.datas)) {
          return data.datas as LocationSuggestion[];
        }
        return [];
      } catch (error) {
        return [];
      }
    },
  })
);
