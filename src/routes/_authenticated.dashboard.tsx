import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Varuna" },
      { name: "description", content: "Water quality index, active sensors, anomalies and forecast risk at a glance." },
      { property: "og:title", content: "Dashboard — Varuna" },
      { property: "og:description", content: "Water quality index, active sensors, anomalies and forecast risk at a glance." },
    ],
  }),
  component: () => <PagePlaceholder title="Dashboard" description="Water quality index, active sensors, anomalies and forecast risk at a glance." />,
});
