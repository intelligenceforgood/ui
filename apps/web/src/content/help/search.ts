import type { HelpEntry } from "./registry";

/**
 * Help content for the search & filtering experience.
 *
 * Covers query syntax, facet filters, entity filters, time range,
 * saved searches, and search history.
 */
export const searchHelp: HelpEntry[] = [
  {
    key: "search.overview",
    title: "Intelligence Search",
    body: "Search across structured and unstructured datasets including filings, chatter, partner data, and case records. Results are ranked by a hybrid scoring model combining keyword relevance with semantic similarity.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/search",
  },
  {
    key: "search.query",
    title: "Search Query Syntax",
    body: 'Use natural language or structured queries. Enclose exact phrases in quotes (e.g., "wire transfer"). Prefix entity searches with the type: email:user@example.com. Boolean operators AND, OR, NOT are supported.',
    docUrl: "https://docs.intelligenceforgood.org/book/guides/search#syntax",
  },
  {
    key: "search.filters",
    title: "Filters",
    body: "Narrow results by source, taxonomy classification, indicator type, dataset, or time range. Filters are combined with AND logic — each active filter further constrains the result set.",
  },
  {
    key: "search.filters.campaigns",
    title: "Active Campaigns",
    body: "Campaigns are ongoing intelligence operations targeting specific fraud patterns. Filtering by campaign shows only intelligence tagged with that campaign's taxonomy classifications.",
  },
  {
    key: "search.filters.indicators",
    title: "Indicator Types",
    body: "Filter by the type of structured indicator: email addresses, phone numbers, bank accounts, crypto wallets, IP addresses, and other entity types extracted during ingestion.",
  },
  {
    key: "search.filters.datasets",
    title: "Datasets",
    body: "Filter results to specific data sources. Datasets correspond to ingestion channels — partner feeds, tipster submissions, public OSINT, or internal case files.",
  },
  {
    key: "search.filters.timeRange",
    title: "Time Range",
    body: "Restrict results to a specific time window. Presets (7d, 30d, 90d, 1y) use the document's ingestion timestamp. Custom ranges let you specify exact start and end dates.",
  },
  {
    key: "search.filters.entities",
    title: "Entity Filters",
    body: "Match exact values or prefixes across structured indicator stores. Add multiple entity filters to cross-reference — for example, filter for cases involving both a specific email and a bank account.",
  },
  {
    key: "search.savedSearches",
    title: "Saved Searches",
    body: "Save frequently-used query and filter combinations for quick re-use. Saved searches appear in the sidebar and can be tagged for organization. They capture the full filter state including entity filters.",
  },
  {
    key: "search.history",
    title: "Search History",
    body: "Your recent search queries are recorded automatically. Click a history entry to re-execute that search. History is per-user and retained for 90 days.",
  },
  {
    key: "search.suggestions",
    title: "Search Suggestions",
    body: "Auto-suggestions are generated from the indexed corpus and recent search patterns. Click a suggestion to refine or redirect your search.",
  },
];
