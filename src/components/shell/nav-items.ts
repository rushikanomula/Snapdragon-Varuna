import { LayoutDashboard, FlaskConical, Waves, Radio } from "lucide-react";

export const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Quality Analysis", url: "/analysis", icon: FlaskConical },
  { title: "Hydrological Forecast", url: "/forecast", icon: Waves },
  { title: "Sensor Management", url: "/sensors", icon: Radio },
] as const;
