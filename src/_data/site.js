export default {
  name: "Spatial Pipeline Engineering",
  title: "Climate/Carbon Accounting Spatial Pipelines",
  tagline: "MRV Automation for satellite-driven carbon accounting",
  url: "https://www.spatialpipelineengineering.org",
  lang: "en",
  description:
    "A technical resource for building, automating, and validating satellite-driven carbon accounting and MRV (Measurement, Reporting, Verification) systems — satellite emissions tracking, land-use change detection, carbon stock modeling, verification workflows, compliance reporting, and Python automation.",
  // Concise (≤160 char) description used for <meta>/Open Graph where the long
  // visible tagline would be truncated by search engines and social cards.
  metaDescription:
    "Engineering guides for satellite-driven carbon accounting and MRV automation: emissions tracking, land-use change, carbon stock modeling, and Python pipelines.",
  themeColor: "#0f5a47",
  // Per top-level category: nav icon + short label + one-line summary for cards.
  sections: {
    "mrv-architecture-carbon-accounting-fundamentals": {
      icon: "blueprint",
      label: "MRV Architecture",
      blurb:
        "Core design patterns for MRV pipelines: spatial alignment, GHG Protocol scoping, data lineage, and registry integration.",
    },
    "satellite-imagery-processing-for-emissions-tracking": {
      icon: "satellite",
      label: "Satellite Imagery",
      blurb:
        "Cloud masking, temporal aggregation, distributed tile processing, and deforestation alerts from Sentinel & Landsat archives.",
    },
    "spatial-modeling-carbon-stock-validation": {
      icon: "forest",
      label: "Spatial Modeling",
      blurb:
        "Carbon stock baselines, LiDAR/SAR biomass fusion, ground-truth alignment, and uncertainty mapping for validated models.",
    },
    "pipeline-orchestration-compliance-reference": {
      icon: "workflow",
      label: "Orchestration & Reference",
      blurb:
        "Orchestrating MRV pipelines with Airflow/Prefect/Dagster, the canonical data-schema reference, and registry standards & methodologies.",
    },
  },
};
