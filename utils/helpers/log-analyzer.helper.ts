import fs from 'fs/promises';
import path from 'path';
import logger from './logger.helper';

/**
 * Severity levels for issues
 */
type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Performance issue detected in logs
 */
interface PerformanceIssue {
  type: string;
  timestamp: string;
  url: string;
  response_time: number;
  severity: Severity;
}

/**
 * Security alert from log analysis
 */
interface SecurityAlert {
  type: string;
  timestamp: string;
  ip: string;
  url: string;
  severity: Severity;
  details: string;
}

/**
 * Suspicious activity detected
 */
interface SuspiciousActivity {
  type: string;
  timestamp: string;
  ip: string;
  url?: string;
  user_agent?: string;
  payload_size?: string;
  severity: Severity;
  details: string;
}

/**
 * Statistics from log analysis
 */
interface LogStatistics {
  methods: Record<string, number>;
  status_codes: Record<string, number>;
  response_times: number[];
  unique_ips: number | Set<string>;
  user_agents: number | Set<string>;
}

/**
 * Log analysis result
 */
interface LogAnalysis {
  file: string;
  total_lines: number;
  suspicious_activities: SuspiciousActivity[];
  performance_issues: PerformanceIssue[];
  security_alerts: SecurityAlert[];
  statistics: LogStatistics;
}

/**
 * Analysis report
 */
interface AnalysisReport {
  generated_at: string;
  summary: {
    total_files_analyzed: number;
    total_security_alerts: number;
    total_performance_issues: number;
    total_suspicious_activities: number;
  };
  detailed_analysis: LogAnalysis[];
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  method: string;
  status_code: number;
  execution_time: number;
  ip: string;
  url: string;
  details?: {
    headers?: Record<string, string>;
    query?: any;
    body?: any;
  };
}

/**
 * Log Analyzer
 * Analyzes application logs for security threats, performance issues, and suspicious activities
 */
class LogAnalyzer {
  private patterns = {
    suspicious_ips:
      /(?:192\.168\.1\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|10\.0\.0\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/,
    sql_injection: /(union|select|insert|update|delete|drop|create|alter|exec|script)/i,
    xss_attempt: /(<script|javascript:|onerror|onload|alert\(|confirm\()/i,
    bot_patterns: /(bot|crawler|spider|scraper|curl|wget|postman)/i,
    brute_force: /401|403/,
    large_payload: /content-length:\s*([5-9]\d{6,}|\d{8,})/i,
  };

  private thresholds = {
    error_rate: 15, // 15% d'erreurs
    response_time: 5000, // 5 secondes
    requests_per_minute: 100,
    failed_logins_per_hour: 20,
  };

  /**
   * Analyze a log file
   * @param filePath - Path to log file
   * @returns Analysis result or null on error
   */
  async analyzeLogFile(filePath: string): Promise<LogAnalysis | null> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());

      const analysis: LogAnalysis = {
        file: path.basename(filePath),
        total_lines: lines.length,
        suspicious_activities: [],
        performance_issues: [],
        security_alerts: [],
        statistics: {
          methods: {},
          status_codes: {},
          response_times: [],
          unique_ips: new Set<string>(),
          user_agents: new Set<string>(),
        },
      };

      for (const line of lines) {
        try {
          const logEntry: LogEntry = JSON.parse(line);
          this.analyzeSingleEntry(logEntry, analysis);
        } catch (parseError) {
          // Ignore malformed lines
          continue;
        }
      }

      // Convert Sets to numbers for serialization
      analysis.statistics.unique_ips = (analysis.statistics.unique_ips as Set<string>).size;
      analysis.statistics.user_agents = (analysis.statistics.user_agents as Set<string>).size;

      return analysis;
    } catch (error: any) {
      logger.error("Erreur lors de l'analyse du fichier:", error.message);
      return null;
    }
  }

  /**
   * Analyze a single log entry
   * @param entry - Log entry
   * @param analysis - Analysis object to update
   * @private
   */
  private analyzeSingleEntry(entry: LogEntry, analysis: LogAnalysis): void {
    const { method, status_code, execution_time, ip, url, details } = entry;

    // General statistics
    analysis.statistics.methods[method] = (analysis.statistics.methods[method] || 0) + 1;
    analysis.statistics.status_codes[status_code] =
      (analysis.statistics.status_codes[status_code] || 0) + 1;
    analysis.statistics.response_times.push(execution_time);
    (analysis.statistics.unique_ips as Set<string>).add(ip);

    if (details?.headers?.['user-agent']) {
      (analysis.statistics.user_agents as Set<string>).add(details.headers['user-agent']);
    }

    // Performance issues detection
    if (execution_time > this.thresholds.response_time) {
      analysis.performance_issues.push({
        type: 'slow_response',
        timestamp: entry.timestamp,
        url: url,
        response_time: execution_time,
        severity: execution_time > 10000 ? 'critical' : 'medium',
      });
    }

    // Security threats detection
    this.checkSecurityThreats(entry, analysis);

    // Suspicious activities detection
    this.checkSuspiciousActivity(entry, analysis);
  }

  /**
   * Check for security threats in log entry
   * @param entry - Log entry
   * @param analysis - Analysis object to update
   * @private
   */
  private checkSecurityThreats(entry: LogEntry, analysis: LogAnalysis): void {
    const { url, details, ip, status_code } = entry;

    // SQL injection attempts
    if (
      this.patterns.sql_injection.test(url) ||
      this.patterns.sql_injection.test(JSON.stringify(details?.query)) ||
      this.patterns.sql_injection.test(JSON.stringify(details?.body))
    ) {
      analysis.security_alerts.push({
        type: 'sql_injection_attempt',
        timestamp: entry.timestamp,
        ip: ip,
        url: url,
        severity: 'high',
        details: "Tentative potentielle d'injection SQL détectée",
      });
    }

    // XSS attempts
    if (
      this.patterns.xss_attempt.test(url) ||
      this.patterns.xss_attempt.test(JSON.stringify(details))
    ) {
      analysis.security_alerts.push({
        type: 'xss_attempt',
        timestamp: entry.timestamp,
        ip: ip,
        url: url,
        severity: 'medium',
        details: 'Tentative potentielle de XSS détectée',
      });
    }

    // Failed authentication attempts
    if (status_code === 401 && url.includes('login')) {
      analysis.security_alerts.push({
        type: 'failed_authentication',
        timestamp: entry.timestamp,
        ip: ip,
        url: url,
        severity: 'medium',
        details: "Échec d'authentification",
      });
    }
  }

  /**
   * Check for suspicious activities in log entry
   * @param entry - Log entry
   * @param analysis - Analysis object to update
   * @private
   */
  private checkSuspiciousActivity(entry: LogEntry, analysis: LogAnalysis): void {
    const { ip, details, url } = entry;

    // Bot detection
    const userAgent = details?.headers?.['user-agent'] || '';
    if (this.patterns.bot_patterns.test(userAgent)) {
      analysis.suspicious_activities.push({
        type: 'bot_activity',
        timestamp: entry.timestamp,
        ip: ip,
        user_agent: userAgent,
        severity: 'low',
        details: 'Activité de bot détectée',
      });
    }

    // Large payload detection
    const contentLength = details?.headers?.['content-length'];
    if (contentLength && parseInt(contentLength) > 10000000) {
      // 10MB
      analysis.suspicious_activities.push({
        type: 'large_payload',
        timestamp: entry.timestamp,
        ip: ip,
        url: url,
        payload_size: contentLength,
        severity: 'medium',
        details: 'Payload inhabituellement important',
      });
    }
  }

  /**
   * Generate analysis report from multiple analysis results
   * @param analysisResults - Array of analysis results
   * @returns Complete analysis report
   */
  async generateReport(analysisResults: LogAnalysis[]): Promise<AnalysisReport> {
    const report: AnalysisReport = {
      generated_at: new Date().toISOString(),
      summary: {
        total_files_analyzed: analysisResults.length,
        total_security_alerts: 0,
        total_performance_issues: 0,
        total_suspicious_activities: 0,
      },
      detailed_analysis: analysisResults,
      recommendations: [],
    };

    // Calculate summary
    analysisResults.forEach((analysis) => {
      report.summary.total_security_alerts += analysis.security_alerts.length;
      report.summary.total_performance_issues += analysis.performance_issues.length;
      report.summary.total_suspicious_activities += analysis.suspicious_activities.length;
    });

    // Generate recommendations
    if (report.summary.total_security_alerts > 0) {
      report.recommendations.push({
        type: 'security',
        priority: 'high',
        message:
          "Plusieurs alertes de sécurité détectées. Vérifiez les tentatives d'injection et renforcez les validations d'entrée.",
      });
    }

    if (report.summary.total_performance_issues > 10) {
      report.recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Problèmes de performance détectés. Optimisez les endpoints les plus lents.',
      });
    }

    return report;
  }
}

export default new LogAnalyzer();
