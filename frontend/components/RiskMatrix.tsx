import React, { useState } from 'react';
import { Permit, RiskAssessment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const RISK_FACTORS: Record<string, number> = {
  'hot-work': 4,
  'confined-space': 5,
  'electrical': 4,
  'height': 4,
  'excavation': 3,
  'lifting': 3
};

const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 5) return 'low';
  if (score <= 10) return 'medium';
  if (score <= 15) return 'high';
  return 'critical';
};

const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-800 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical': return 'bg-red-100 text-red-800 border-red-300';
  }
};

export function calculateRiskAssessment(permit: Permit, customLikelihood?: number, customSeverity?: number): RiskAssessment {
  // Base likelihood on permit type
  const baseRisk = RISK_FACTORS[permit.ptwType] || 3;

  const hazards = permit.hazards || [];
  const precautions = permit.precautions || [];

  // Likelihood (1-5): affected by location, time, and type
  const likelihood = customLikelihood || Math.min(5, Math.max(1,
    baseRisk - (precautions.length > 3 ? 1 : 0)
  ));

  // Severity (1-5): based on number of hazards
  const severity = customSeverity || Math.min(5, Math.max(1,
    Math.ceil(hazards.length * 1.5) || 1
  ));

  // Risk Score = Likelihood × Severity
  const riskScore = likelihood * severity;
  const riskLevel = getRiskLevel(riskScore);

  // Mitigation effectiveness
  const mitigationFactors = precautions.length;

  // Residual risk after controls
  const residualRisk = Math.max(1, riskScore - (mitigationFactors * 0.5));

  return {
    permitId: permit.id,
    likelihood,
    severity,
    riskScore,
    riskLevel,
    mitigationFactors,
    residualRisk
  };
}

interface RiskMatrixProps {
  permit: Permit;
  onAssessmentChange?: (assessment: RiskAssessment) => void;
}

export function RiskMatrix({ permit, onAssessmentChange }: RiskMatrixProps) {
  const [customLikelihood, setCustomLikelihood] = useState<number | undefined>(undefined);
  const [customSeverity, setCustomSeverity] = useState<number | undefined>(undefined);

  const assessment = calculateRiskAssessment(permit, customLikelihood, customSeverity);

  const handleLikelihoodChange = (value: string) => {
    const likelihood = parseInt(value);
    setCustomLikelihood(likelihood);
    if (onAssessmentChange) {
      const newAssessment = calculateRiskAssessment(permit, likelihood, customSeverity);
      onAssessmentChange(newAssessment);
    }
  };

  const handleSeverityChange = (value: string) => {
    const severity = parseInt(value);
    setCustomSeverity(severity);
    if (onAssessmentChange) {
      const newAssessment = calculateRiskAssessment(permit, customLikelihood, severity);
      onAssessmentChange(newAssessment);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Risk Assessment Matrix
        </CardTitle>
        <CardDescription>
          Evaluate and manage work risks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Score Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
            <p className="text-3xl font-bold">{assessment.riskScore}</p>
            <Badge className={`mt-2 ${getRiskColor(assessment.riskLevel)}`}>
              {assessment.riskLevel.toUpperCase()}
            </Badge>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Residual Risk</p>
            <p className="text-3xl font-bold">{assessment.residualRisk.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">
                {assessment.mitigationFactors} controls
              </span>
            </div>
          </div>
        </div>

        {/* Assessment Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Likelihood (1-5)</Label>
            <Select
              value={String(assessment.likelihood)}
              onValueChange={handleLikelihoodChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Rare</SelectItem>
                <SelectItem value="2">2 - Unlikely</SelectItem>
                <SelectItem value="3">3 - Possible</SelectItem>
                <SelectItem value="4">4 - Likely</SelectItem>
                <SelectItem value="5">5 - Almost Certain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severity (1-5)</Label>
            <Select
              value={String(assessment.severity)}
              onValueChange={handleSeverityChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Insignificant</SelectItem>
                <SelectItem value="2">2 - Minor</SelectItem>
                <SelectItem value="3">3 - Moderate</SelectItem>
                <SelectItem value="4">4 - Major</SelectItem>
                <SelectItem value="5">5 - Catastrophic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risk Matrix Grid */}
        <div className="border rounded-lg p-4">
          <p className="text-sm font-semibold mb-3">Risk Matrix</p>
          <div className="grid grid-cols-6 gap-1 text-xs">
            {/* Header row */}
            <div className="font-semibold text-center p-2"></div>
            <div className="font-semibold text-center p-2">1</div>
            <div className="font-semibold text-center p-2">2</div>
            <div className="font-semibold text-center p-2">3</div>
            <div className="font-semibold text-center p-2">4</div>
            <div className="font-semibold text-center p-2">5</div>

            {/* Rows for likelihood 5 to 1 */}
            {[5, 4, 3, 2, 1].map(l => (
              <React.Fragment key={l}>
                <div className="font-semibold text-center p-2">{l}</div>
                {[1, 2, 3, 4, 5].map(s => {
                  const score = l * s;
                  const level = getRiskLevel(score);
                  const isSelected = l === assessment.likelihood && s === assessment.severity;
                  return (
                    <div
                      key={`${l}-${s}`}
                      className={`
                        p-2 text-center rounded
                        ${level === 'low' ? 'bg-green-200' : ''}
                        ${level === 'medium' ? 'bg-yellow-200' : ''}
                        ${level === 'high' ? 'bg-orange-200' : ''}
                        ${level === 'critical' ? 'bg-red-200' : ''}
                        ${isSelected ? 'ring-2 ring-blue-600 font-bold' : ''}
                      `}
                    >
                      {score}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
            <span className="text-muted-foreground">Severity →</span>
            <span className="text-muted-foreground">↑ Likelihood</span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Recommendations</p>
          {assessment.riskLevel === 'critical' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <p className="font-semibold text-red-800">⛔ STOP WORK</p>
              <p className="text-red-700">This permit requires immediate review. Work must not proceed until risk is reduced.</p>
            </div>
          )}
          {assessment.riskLevel === 'high' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
              <p className="font-semibold text-orange-800">⚠️ HIGH RISK</p>
              <p className="text-orange-700">Additional controls required. Senior management approval needed.</p>
            </div>
          )}
          {assessment.riskLevel === 'medium' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="font-semibold text-yellow-800">⚡ MODERATE RISK</p>
              <p className="text-yellow-700">Proceed with caution. Ensure all precautions are in place.</p>
            </div>
          )}
          {assessment.riskLevel === 'low' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-semibold text-green-800">✓ LOW RISK</p>
              <p className="text-green-700">Standard precautions sufficient. May proceed with work.</p>
            </div>
          )}
        </div>

        {/* Hazards and Controls Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Hazards ({(permit.hazards || []).length})
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(permit.hazards || []).slice(0, 3).map((hazard, i) => (
                <li key={i}>• {hazard}</li>
              ))}
              {(permit.hazards || []).length > 3 && (
                <li className="text-blue-600">+ {(permit.hazards || []).length - 3} more</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Controls ({(permit.precautions || []).length})
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {(permit.precautions || []).slice(0, 3).map((precaution, i) => (
                <li key={i}>• {precaution}</li>
              ))}
              {(permit.precautions || []).length > 3 && (
                <li className="text-blue-600">+ {(permit.precautions || []).length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Risk Dashboard Summary
interface RiskDashboardProps {
  permits: Permit[];
}

export function RiskDashboard({ permits }: RiskDashboardProps) {
  const assessments = permits.map(p => calculateRiskAssessment(p));

  const riskCounts = {
    low: assessments.filter(a => a.riskLevel === 'low').length,
    medium: assessments.filter(a => a.riskLevel === 'medium').length,
    high: assessments.filter(a => a.riskLevel === 'high').length,
    critical: assessments.filter(a => a.riskLevel === 'critical').length
  };

  const avgRiskScore = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length).toFixed(1)
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{riskCounts.critical}</div>
          <p className="text-xs text-muted-foreground">Immediate action required</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">High Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{riskCounts.high}</div>
          <p className="text-xs text-muted-foreground">Extra precautions needed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{riskCounts.medium}</div>
          <p className="text-xs text-muted-foreground">Standard controls apply</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgRiskScore}</div>
          <p className="text-xs text-muted-foreground">Across all permits</p>
        </CardContent>
      </Card>
    </div>
  );
}
