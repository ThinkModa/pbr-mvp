/**
 * Avatar Service
 * Handles avatar generation using DiceBear API for consistent initials-based avatars
 */

export interface AvatarOptions {
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  format?: 'svg' | 'png';
}

export class AvatarService {
  private static readonly DICEBEAR_BASE_URL = 'https://api.dicebear.com/6.x/initials';
  private static readonly DEFAULT_SIZE = 48;
  private static readonly DEFAULT_FONT_SIZE = 0.4;

  /**
   * Generate avatar URL using DiceBear API
   * @param name - Full name to generate initials from
   * @param options - Avatar customization options
   * @returns Avatar URL
   */
  static generateAvatarUrl(name: string, options: AvatarOptions = {}): string {
    const {
      size = this.DEFAULT_SIZE,
      backgroundColor = 'random',
      textColor = 'ffffff',
      fontSize = this.DEFAULT_FONT_SIZE,
      format = 'svg'
    } = options;

    // Clean and encode the name
    const cleanName = name.trim();
    const seed = encodeURIComponent(cleanName);

    // Build URL with parameters
    const params = new URLSearchParams({
      seed,
      size: size.toString(),
      backgroundColor,
      textColor,
      fontSize: fontSize.toString(),
    });

    return `${this.DICEBEAR_BASE_URL}/${format}?${params.toString()}`;
  }

  /**
   * Generate initials from a name
   * @param name - Full name
   * @param maxLength - Maximum number of initials (default: 2)
   * @returns Initials string
   */
  static generateInitials(name: string, maxLength: number = 2): string {
    if (!name || !name.trim()) {
      return '??';
    }

    const words = name.trim().split(/\s+/);
    let initials = '';

    for (let i = 0; i < Math.min(words.length, maxLength); i++) {
      const word = words[i];
      if (word && word.length > 0) {
        initials += word[0].toUpperCase();
      }
    }

    return initials || '??';
  }

  /**
   * Generate a consistent background color based on name
   * @param name - Full name
   * @returns Hex color code
   */
  static generateBackgroundColor(name: string): string {
    if (!name) return '#6B7280';

    // Always return golden color for consistency
    return '#D29507';
  }

  /**
   * Get avatar URL with consistent styling for the app
   * @param name - Full name
   * @param size - Avatar size in pixels
   * @returns Avatar URL with app-specific styling
   */
  static getAppAvatarUrl(name: string, size: number = this.DEFAULT_SIZE): string {
    const backgroundColor = this.generateBackgroundColor(name);
    
    return this.generateAvatarUrl(name, {
      size,
      backgroundColor,
      textColor: 'ffffff',
      fontSize: 0.4,
      format: 'svg'
    });
  }

  /**
   * Validate if a URL is a valid avatar URL
   * @param url - URL to validate
   * @returns True if valid avatar URL
   */
  static isValidAvatarUrl(url: string): boolean {
    return url && url.startsWith(this.DICEBEAR_BASE_URL);
  }

  /**
   * Get fallback avatar URL for when name is not available
   * @param size - Avatar size in pixels
   * @returns Fallback avatar URL
   */
  static getFallbackAvatarUrl(size: number = this.DEFAULT_SIZE): string {
    return this.generateAvatarUrl('User', {
      size,
      backgroundColor: '#6B7280',
      textColor: 'ffffff',
      fontSize: 0.4,
      format: 'svg'
    });
  }
}
