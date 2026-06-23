import { ComplianceReportData } from './complianceEngine';

/**
 * Builds the formal Compliance & Audit Report JSON string.
 */
export function buildComplianceJson(data: ComplianceReportData): string {
  // We stringify the structured data payload directly.
  // This object has already been stripped of emotional and subjective data 
  // by the complianceEngine during buildComplianceReportData.
  
  return JSON.stringify(data, null, 2);
}
