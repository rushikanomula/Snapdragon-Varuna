import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Quality Analysis — Varuna" },
      { name: "description", content: "On-device NPU analysis of pH, turbidity, dissolved oxygen, nitrate, heavy metals and coliform." },
      { property: "og:title", content: "Quality Analysis — Varuna" },
      { property: "og:description", content: "On-device NPU analysis of pH, turbidity, dissolved oxygen, nitrate, heavy metals and coliform." },
    ],
  }),
  component: () => <PagePlaceholder title="Quality Analysis" description="On-device NPU analysis of pH, turbidity, dissolved oxygen, nitrate, heavy metals and coliform." />,
});
