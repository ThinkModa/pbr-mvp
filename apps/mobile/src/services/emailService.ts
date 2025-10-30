import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

export interface EmailReport {
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'support_request';
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
  deviceInfo?: string;
  appVersion?: string;
}

export interface EmailReportResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class EmailService {
  private static readonly TARGET_EMAIL = 'info@plantbuiltrestore.com';
  
  /**
   * Send a report or information to the target email
   */
  static async sendReport(report: EmailReport): Promise<EmailReportResponse> {
    try {
      console.log('📧 Sending email report:', report.type);
      
      const { data, error } = await supabase.functions.invoke('send-email-report', {
        body: {
          to: this.TARGET_EMAIL,
          report: {
            ...report,
            timestamp: new Date().toISOString(),
            appName: 'PBR MVP',
            platform: 'mobile'
          }
        }
      });

      if (error) {
        console.error('❌ Email service error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email'
        };
      }

      console.log('✅ Email report sent successfully');
      return {
        success: true,
        messageId: data?.messageId
      };
    } catch (error) {
      console.error('💥 Email service exception:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  /**
   * Send a quick feedback message
   */
  static async sendQuickFeedback(message: string, userEmail?: string): Promise<EmailReportResponse> {
    return this.sendReport({
      type: 'general_feedback',
      subject: 'Quick Feedback from PBR MVP App',
      message,
      userEmail,
      deviceInfo: this.getDeviceInfo()
    });
  }

  /**
   * Send a bug report with additional context
   */
  static async sendBugReport(
    description: string, 
    stepsToReproduce: string, 
    userEmail?: string
  ): Promise<EmailReportResponse> {
    return this.sendReport({
      type: 'bug_report',
      subject: 'Bug Report from PBR MVP App',
      message: `Bug Description: ${description}\n\nSteps to Reproduce:\n${stepsToReproduce}`,
      userEmail,
      deviceInfo: this.getDeviceInfo()
    });
  }

  /**
   * Send a feature request
   */
  static async sendFeatureRequest(
    feature: string, 
    description: string, 
    userEmail?: string
  ): Promise<EmailReportResponse> {
    return this.sendReport({
      type: 'feature_request',
      subject: 'Feature Request from PBR MVP App',
      message: `Feature: ${feature}\n\nDescription: ${description}`,
      userEmail,
      deviceInfo: this.getDeviceInfo()
    });
  }

  /**
   * Get device information for debugging
   */
  private static getDeviceInfo(): string {
    return `Platform: ${Platform.OS} ${Platform.Version}`;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
