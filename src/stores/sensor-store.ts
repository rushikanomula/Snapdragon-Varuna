import { create } from "zustand";
import { DEMO_SENSOR_RECORDS, type Calibration, type SensorRecord } from "@/lib/sensors";

export type Role = "super_admin" | "org_admin" | "field_analyst" | "viewer";
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  field_analyst: "Field Analyst",
  viewer: "Read-Only Viewer",
};
export const canDelete = (r: Role) => r === "super_admin" || r === "org_admin";

type SensorState = {
  sensors: SensorRecord[];
  // Demo role until sign-in with real roles is connected.
  role: Role;
  setRole: (r: Role) => void;
  addSensor: (s: SensorRecord) => void;
  updateSensor: (id: string, patch: Partial<SensorRecord>) => void;
  setCalibration: (id: string, c: Calibration) => void;
  removeSensors: (ids: string[]) => void;
};

export const useSensorStore = create<SensorState>()((set, get) => ({
  sensors: DEMO_SENSOR_RECORDS,
  role: "org_admin",
  setRole: (role) => set({ role }),
  addSensor: (s) => set((st) => ({ sensors: [s, ...st.sensors] })),
  updateSensor: (id, patch) => set((st) => ({ sensors: st.sensors.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
  setCalibration: (id, calibration) =>
    set((st) => ({
      sensors: st.sensors.map((s) => (s.id === id ? { ...s, calibration, calibratedAt: new Date().toISOString().slice(0, 10) } : s)),
    })),
  removeSensors: (ids) => {
    if (!canDelete(get().role)) return; // enforced again server-side once roles are stored in the backend
    set((st) => ({ sensors: st.sensors.filter((s) => !ids.includes(s.id)) }));
  },
}));
