import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export const Route = createFileRoute("/_authenticated/forecast")({
  head: () => ({
    meta: [
      { title: "Hydrological Forecast — Varuna" },
      { name: "description", content: "7, 14 and 30-day river flow, reservoir level and flood-risk predictions." },
      { property: "og:title", content: "Hydrological Forecast — Varuna" },
      { property: "og:description", content: "7, 14 and 30-day river flow, reservoir level and flood-risk predictions." },
    ],
  }),
  component: () => <PagePlaceholder title="Hydrological Forecast" description="7, 14 and 30-day river flow, reservoir level and flood-risk predictions." />,
});
