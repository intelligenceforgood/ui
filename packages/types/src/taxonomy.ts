/**
 * Fraud Taxonomy Interfaces
 * Version: fraud-taxonomy.v1.0
 *
 * Auto-generated from definitions.yaml. DO NOT EDIT.
 */

export interface TaxonomyItem {
  code: string;
  label: string;
  description: string;
  examples: string[];
}

export interface TaxonomyAxis {
  id: string;
  label: string;
  description: string;
  items: TaxonomyItem[];
}

export interface TaxonomyDefinitions {
  version: string;
  steward: string;
  updatedAt: string;
  axes: TaxonomyAxis[];
}
