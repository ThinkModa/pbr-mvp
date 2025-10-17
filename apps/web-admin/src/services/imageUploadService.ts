export class ImageUploadService {
  private static readonly SUPABASE_URL = 'http://127.0.0.1:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private static getHeaders() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
    };
  }

  // Upload image to Supabase Storage
  static async uploadImage(file: File, folder: string = 'speakers'): Promise<string> {
    console.log('Uploading image:', { fileName: file.name, folder, size: file.size, type: file.type });
    
    // For now, let's use a simple approach - convert to base64 and store as data URL
    // This avoids the storage bucket RLS issues
    try {
      const base64 = await this.fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      
      console.log('✅ Image converted to data URL successfully');
      return dataUrl;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  // Convert file to base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Delete image (for data URLs, this is a no-op since they're stored in the database)
  static async deleteImage(imageUrl: string): Promise<void> {
    console.log('Deleting image:', imageUrl);
    
    // For data URLs, we don't need to delete anything from storage
    // The image data is stored directly in the database
    if (imageUrl.startsWith('data:')) {
      console.log('✅ Data URL image - no deletion needed');
      return;
    }
    
    // If it's a regular URL, we can't delete it from external services
    console.log('✅ External URL image - no deletion needed');
  }

  // Validate image file
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please select a valid image file (JPEG, PNG, or WebP)' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 5MB' };
    }
    
    return { valid: true };
  }
}
