import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export const Route = createFileRoute("/_authenticated/sensors")({
  head: () => ({
    meta: [
      { title: "Sensor Management — Varuna" },
      { name: "description", content: "Monitor sensor health, readings and connections across your network." },
      { property: "og:title", content: "Sensor Management — Varuna" },
      { property: "og:description", content: "Monitor sensor health, readings and connections across your network." },
    ],
  }),
  component: () => <PagePlaceholder title="Sensor Management" description="Monitor sensor health, readings and connections across your network." />,
});
