export interface ImportUser {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title_position?: string;
  organization_affiliation?: string;
  t_shirt_size?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  bio?: string;
  professional_interests?: string;
  community_interests?: string;
  [key: string]: any; // For additional CSV columns
}

export interface FieldMapping {
  csvColumn: string;
  userField: string;
  required: boolean;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: ImportError[];
  importedUsers: ImportedUser[];
}

export interface ImportError {
  row: number;
  email?: string;
  error: string;
  data?: any;
}

export interface ImportedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'pending' | 'invited' | 'active';
  created_at: string;
  invited_at?: string;
  activated_at?: string;
}

export interface InvitationBatch {
  id: string;
  user_ids: string[];
  email_sent: number;
  sms_sent: number;
  created_at: string;
  sent_at?: string;
}

class BulkImportService {
  private static readonly SUPABASE_URL = 'http://localhost:54321';
  private static readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  private getHeaders() {
    return {
      'apikey': BulkImportService.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${BulkImportService.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Parse CSV content into array of objects using robust CSV parsing
   */
  parseCSV(csvContent: string): ImportUser[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header row with proper CSV handling
    const headers = this.parseCSVLine(lines[0]);
    console.log('🔍 CSV Headers:', headers);
    const users: ImportUser[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      try {
        const values = this.parseCSVLine(line);
        
        // Handle rows with different column counts gracefully
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Adjusting...`);
          
          // Pad with empty strings if too few columns
          while (values.length < headers.length) {
            values.push('');
          }
          
          // Truncate if too many columns
          if (values.length > headers.length) {
            values.splice(headers.length);
          }
        }

        const user: ImportUser = {
          first_name: '',
          last_name: '',
          email: '',
        };

        headers.forEach((header, index) => {
          const value = values[index] || '';
          if (value && value !== '') {
            // Convert header to snake_case for consistency
            const fieldName = header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            user[fieldName] = value;
          }
        });

        if (i <= 3) { // Only log first few for debugging
          console.log(`🔍 Parsed user ${i}:`, user);
        }
        users.push(user);
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue processing other rows instead of failing completely
      }
    }

    return users;
  }

  /**
   * Parse a single CSV line handling quoted fields with commas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote inside quoted field
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        // Regular character
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  }

  /**
   * Map CSV columns to user profile fields
   */
  mapFields(users: ImportUser[], fieldMappings: FieldMapping[]): ImportUser[] {
    console.log('🔍 Field mapping debug:', {
      usersCount: users.length,
      fieldMappings,
      firstUserKeys: users[0] ? Object.keys(users[0]) : []
    });

    return users.map((user, index) => {
      const mappedUser: ImportUser = {
        first_name: '',
        last_name: '',
        email: '',
      };

      // If no field mappings provided, try auto-mapping based on common field names
      if (fieldMappings.length === 0) {
        console.log('🔍 No field mappings provided, attempting auto-mapping...');
        
        // Auto-map common field names with more variations
        const autoMappings = [
          // First name variations
          { csvField: 'first_name', userField: 'first_name' },
          { csvField: 'firstname', userField: 'first_name' },
          { csvField: 'fname', userField: 'first_name' },
          { csvField: 'first', userField: 'first_name' },
          { csvField: 'given_name', userField: 'first_name' },
          { csvField: 'givenname', userField: 'first_name' },
          
          // Last name variations
          { csvField: 'last_name', userField: 'last_name' },
          { csvField: 'lastname', userField: 'last_name' },
          { csvField: 'lname', userField: 'last_name' },
          { csvField: 'last', userField: 'last_name' },
          { csvField: 'surname', userField: 'last_name' },
          { csvField: 'family_name', userField: 'last_name' },
          { csvField: 'familyname', userField: 'last_name' },
          
          // Email variations
          { csvField: 'email', userField: 'email' },
          { csvField: 'email_address', userField: 'email' },
          { csvField: 'e_mail', userField: 'email' },
          { csvField: 'mail', userField: 'email' },
          
          // Phone variations
          { csvField: 'phone', userField: 'phone' },
          { csvField: 'phone_number', userField: 'phone' },
          { csvField: 'mobile', userField: 'phone' },
          { csvField: 'cell', userField: 'phone' },
          { csvField: 'telephone', userField: 'phone' },
          
          // Title/Position variations
          { csvField: 'title', userField: 'title_position' },
          { csvField: 'title_position', userField: 'title_position' },
          { csvField: 'position', userField: 'title_position' },
          { csvField: 'job_title', userField: 'title_position' },
          { csvField: 'jobtitle', userField: 'title_position' },
          { csvField: 'role', userField: 'title_position' },
          
          // Organization variations
          { csvField: 'organization', userField: 'organization_affiliation' },
          { csvField: 'organization_affiliation', userField: 'organization_affiliation' },
          { csvField: 'company', userField: 'organization_affiliation' },
          { csvField: 'employer', userField: 'organization_affiliation' },
          { csvField: 'workplace', userField: 'organization_affiliation' },
          
          // T-shirt size variations
          { csvField: 't_shirt_size', userField: 't_shirt_size' },
          { csvField: 'tshirt_size', userField: 't_shirt_size' },
          { csvField: 'shirt_size', userField: 't_shirt_size' },
          { csvField: 'tshirtsize', userField: 't_shirt_size' },
          { csvField: 'size', userField: 't_shirt_size' },
          
          // Other fields
          { csvField: 'dietary_restrictions', userField: 'dietary_restrictions' },
          { csvField: 'dietary', userField: 'dietary_restrictions' },
          { csvField: 'diet', userField: 'dietary_restrictions' },
          { csvField: 'accessibility_needs', userField: 'accessibility_needs' },
          { csvField: 'accessibility', userField: 'accessibility_needs' },
          { csvField: 'bio', userField: 'bio' },
          { csvField: 'biography', userField: 'bio' },
          { csvField: 'about', userField: 'bio' },
          { csvField: 'professional_interests', userField: 'professional_interests' },
          { csvField: 'interests', userField: 'professional_interests' },
          { csvField: 'community_interests', userField: 'community_interests' }
        ];

        autoMappings.forEach(autoMapping => {
          const csvValue = user[autoMapping.csvField];
          if (csvValue && csvValue !== '') {
            mappedUser[autoMapping.userField] = csvValue;
            console.log(`🔍 Auto-mapped: "${autoMapping.csvField}" = "${csvValue}" -> "${autoMapping.userField}"`);
          }
        });

        // If we still don't have required fields, try partial matching
        if (!mappedUser.first_name || !mappedUser.last_name || !mappedUser.email) {
          console.log('🔍 Trying partial matching for missing required fields...');
          
          const userKeys = Object.keys(user);
          userKeys.forEach(key => {
            const value = user[key];
            if (value && value !== '') {
              // Try to match by partial field name
              if (!mappedUser.first_name && (key.includes('first') || key.includes('given'))) {
                mappedUser.first_name = value;
                console.log(`🔍 Partial match first name: "${key}" = "${value}"`);
              }
              if (!mappedUser.last_name && (key.includes('last') || key.includes('surname') || key.includes('family'))) {
                mappedUser.last_name = value;
                console.log(`🔍 Partial match last name: "${key}" = "${value}"`);
              }
              if (!mappedUser.email && (key.includes('email') || key.includes('mail'))) {
                mappedUser.email = value;
                console.log(`🔍 Partial match email: "${key}" = "${value}"`);
              }
            }
          });
        }
      } else {
        // Use provided field mappings
        fieldMappings.forEach(mapping => {
          // Convert CSV column name to snake_case to match how it was stored during parsing
          const csvFieldName = mapping.csvColumn.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const csvValue = user[csvFieldName];
          
          console.log(`🔍 Mapping row ${index + 1}: "${mapping.csvColumn}" -> "${csvFieldName}" = "${csvValue}" -> "${mapping.userField}"`);
          
          if (csvValue && csvValue !== '') {
            mappedUser[mapping.userField] = csvValue;
          }
        });
      }

      console.log(`🔍 Mapped user ${index + 1}:`, mappedUser);
      return mappedUser;
    });
  }

  /**
   * Validate user data before import
   */
  validateUsers(users: ImportUser[]): { validUsers: ImportUser[], errors: ImportError[] } {
    const validUsers: ImportUser[] = [];
    const errors: ImportError[] = [];

    users.forEach((user, index) => {
      const row = index + 2; // +2 because CSV is 1-indexed and we skip header
      console.log(`🔍 Validating user ${row}:`, user);

      // Check if user object has any data at all
      const hasAnyData = Object.values(user).some(value => value && value.toString().trim() !== '');
      if (!hasAnyData) {
        console.log(`❌ Row ${row} has no data`);
        errors.push({
          row,
          email: '',
          error: 'Row appears to be empty or contains no valid data',
          data: user
        });
        return;
      }

      // Only require essential fields: email and phone number
      if (!user.email || user.email.trim() === '') {
        console.log(`❌ Row ${row} missing email:`, user.email);
        errors.push({
          row,
          email: user.email || '',
          error: 'Email is required',
          data: user
        });
        return;
      }

      if (!user.phone_number || user.phone_number.trim() === '') {
        console.log(`❌ Row ${row} missing phone:`, user.phone_number);
        errors.push({
          row,
          email: user.email,
          error: 'Phone number is required',
          data: user
        });
        return;
      }

      // Generate first and last names from email if not provided
      if (!user.first_name || user.first_name.trim() === '') {
        const emailLocalPart = user.email.split('@')[0] || '';
        user.first_name = emailLocalPart.split('.')[0] || emailLocalPart || 'User';
      }

      if (!user.last_name || user.last_name.trim() === '') {
        // If we have a first_name that looks like a full name, try to split it
        if (user.first_name && user.first_name.includes(' ')) {
          const nameParts = user.first_name.trim().split(' ');
          if (nameParts.length >= 2) {
            const originalFirst = user.first_name;
            user.first_name = nameParts[0];
            user.last_name = nameParts.slice(1).join(' '); // Handle names like "Matthew T Cianciolo"
            console.log(`🔧 Split name: "${originalFirst}" -> "${user.first_name}" "${user.last_name}"`);
          } else {
            user.last_name = 'User';
          }
        } else {
          // Fallback to email-based generation
          const emailLocalPart = user.email.split('@')[0] || '';
          const nameParts = emailLocalPart.split('.');
          user.last_name = nameParts.length > 1 ? nameParts[1] : 'User';
          console.log(`🔧 Generated last name from email: "${user.last_name}"`);
        }
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email.trim())) {
        errors.push({
          row,
          email: user.email,
          error: 'Invalid email format',
          data: user
        });
        return;
      }

      // Clean up the user data
      const cleanUser: ImportUser = {
        first_name: user.first_name.trim(),
        last_name: user.last_name.trim(),
        email: user.email.trim().toLowerCase(),
        phone_number: user.phone_number?.trim() || undefined,
        title_position: user.title_position?.trim() || undefined,
        organization_affiliation: user.organization_affiliation?.trim() || undefined,
        t_shirt_size: user.t_shirt_size?.trim() || undefined,
        dietary_restrictions: user.dietary_restrictions?.trim() || undefined,
        accessibility_needs: user.accessibility_needs?.trim() || undefined,
        bio: user.bio?.trim() || undefined,
        professional_interests: user.professional_interests?.trim() || undefined,
        community_interests: user.community_interests?.trim() || undefined,
      };

      console.log(`✅ Row ${row} passed validation:`, cleanUser);
      validUsers.push(cleanUser);
    });

    return { validUsers, errors };
  }

  /**
   * Import users to database with pending status
   */
  async importUsers(users: ImportUser[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: users.length,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      importedUsers: []
    };

    try {
      console.log('🔍 Validating users:', users.length);
      // First validate all users
      const { validUsers, errors: validationErrors } = this.validateUsers(users);
      console.log('✅ Valid users:', validUsers.length, '❌ Validation errors:', validationErrors.length);
      result.errors = validationErrors;

      if (validUsers.length === 0) {
        console.log('⚠️ No valid users found, marking all as failed');
        result.failedImports = users.length;
        return result;
      }
      // Check for existing users to avoid duplicates
      const emails = validUsers.map(u => u.email);
      const existingUsersResponse = await fetch(
        `${BulkImportService.SUPABASE_URL}/rest/v1/users?select=email&email=in.(${emails.map(e => `"${e}"`).join(',')})`,
        { headers: this.getHeaders() }
      );

      if (!existingUsersResponse.ok) {
        throw new Error(`Failed to check existing users: ${existingUsersResponse.statusText}`);
      }

      const existingUsers = await existingUsersResponse.json();
      const existingEmails = new Set(existingUsers.map((u: any) => u.email));
      
      console.log('🔍 Checking for existing users:');
      console.log('📧 Emails to check:', emails);
      console.log('🔍 Found existing users:', existingUsers);
      console.log('📧 Existing emails set:', Array.from(existingEmails));

      // Filter out existing users
      const newUsers = validUsers.filter(user => !existingEmails.has(user.email));
      const duplicateUsers = validUsers.filter(user => existingEmails.has(user.email));
      
      console.log('✅ New users (not existing):', newUsers.length);
      console.log('⚠️ Duplicate users (already exist):', duplicateUsers.length);

      // Add duplicate errors
      duplicateUsers.forEach((user) => {
        result.errors.push({
          row: users.indexOf(user) + 2,
          email: user.email,
          error: 'User already exists',
          data: user
        });
      });

      if (newUsers.length === 0) {
        result.failedImports = users.length;
        return result;
      }

      // Prepare user data for insertion (only include columns that exist in the database)
      const userData = newUsers.map(user => ({
        name: `${user.first_name} ${user.last_name}`.trim(), // Required NOT NULL field
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number || null,
        title_position: user.title_position || null,
        organization_affiliation: user.organization_affiliation || null,
        t_shirt_size: user.t_shirt_size || null,
        dietary_restrictions: user.dietary_restrictions || null,
        accessibility_needs: user.accessibility_needs || null,
        bio: user.bio || null,
        // Note: professional_interests and community_interests columns don't exist in the database yet
        // status: 'pending' as const, // This column also doesn't exist yet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('📝 Prepared user data for insertion:', userData.length, 'users');

      // Insert users
      const insertResponse = await fetch(
        `${BulkImportService.SUPABASE_URL}/rest/v1/users`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(userData)
        }
      );

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        console.error('❌ Insert failed:', insertResponse.status, errorText);
        throw new Error(`Failed to insert users: ${insertResponse.statusText} - ${errorText}`);
      }

      const insertedUsers = await insertResponse.json();
      console.log('✅ Successfully inserted users:', insertedUsers.length);
      
      result.successfulImports = insertedUsers.length;
      result.failedImports = result.totalRows - result.successfulImports;
      result.success = result.successfulImports > 0;
      result.importedUsers = insertedUsers.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status,
        created_at: user.created_at
      }));

    } catch (error) {
      console.error('Import error:', error);
      result.errors.push({
        row: 0,
        error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null
      });
      result.failedImports = users.length;
    }

    return result;
  }

  /**
   * Send invitations to imported users
   */
  async sendInvitations(userIds: string[]): Promise<InvitationBatch> {
    const batch: InvitationBatch = {
      id: `batch_${Date.now()}`,
      user_ids: userIds,
      email_sent: 0,
      sms_sent: 0,
      created_at: new Date().toISOString()
    };

    try {
      // Get user details for invitations
      const usersResponse = await fetch(
        `${BulkImportService.SUPABASE_URL}/rest/v1/users?select=id,email,first_name,last_name,phone_number&id=in.(${userIds.map(id => `"${id}"`).join(',')})`,
        { headers: this.getHeaders() }
      );

      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
      }

      const users = await usersResponse.json();

      // Send invitations (this would integrate with your email/SMS service)
      for (const user of users) {
        try {
          // Send email invitation
          await this.sendEmailInvitation(user);
          batch.email_sent++;

          // Send SMS invitation if phone number exists
          if (user.phone_number) {
            await this.sendSMSInvitation(user);
            batch.sms_sent++;
          }

          // Update user status to 'invited'
          await fetch(
            `${BulkImportService.SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
            {
              method: 'PATCH',
              headers: this.getHeaders(),
              body: JSON.stringify({
                status: 'invited',
                invited_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          );

        } catch (error) {
          console.error(`Failed to send invitation to ${user.email}:`, error);
        }
      }

      batch.sent_at = new Date().toISOString();

    } catch (error) {
      console.error('Invitation batch error:', error);
      throw error;
    }

    return batch;
  }

  /**
   * Send email invitation (placeholder - integrate with your email service)
   */
  private async sendEmailInvitation(user: any): Promise<void> {
    // TODO: Integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Sending email invitation to ${user.email}`);
    
    // For now, just log the invitation
    const invitationLink = `${window.location.origin}/invite?token=${this.generateInviteToken(user.id)}`;
    console.log(`Invitation link: ${invitationLink}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send SMS invitation (placeholder - integrate with your SMS service)
   */
  private async sendSMSInvitation(user: any): Promise<void> {
    // TODO: Integrate with your SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 Sending SMS invitation to ${user.phone_number}`);
    
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Generate invitation token
   */
  private generateInviteToken(userId: string): string {
    // TODO: Implement proper JWT token generation
    return btoa(`${userId}_${Date.now()}`);
  }

  /**
   * Get pending users
   */
  async getPendingUsers(): Promise<ImportedUser[]> {
    try {
      console.log('🔍 Fetching pending users...');
      const response = await fetch(
        `${BulkImportService.SUPABASE_URL}/rest/v1/users?select=id,email,first_name,last_name,created_at&order=created_at.desc`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.error('❌ Failed to fetch pending users:', response.status, response.statusText);
        throw new Error(`Failed to fetch pending users: ${response.statusText}`);
      }

      const users = await response.json();
      console.log('👥 Retrieved pending users from database:', users.length);
      return users.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        status: 'pending', // Default status since column doesn't exist yet
        created_at: user.created_at,
        invited_at: null, // These columns don't exist yet
        activated_at: null
      }));

    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  }

  /**
   * Get available user profile fields for mapping
   */
  getAvailableFields(): { field: string; label: string; required: boolean }[] {
    return [
      { field: 'email', label: 'Email', required: true },
      { field: 'phone_number', label: 'Phone Number', required: true },
      { field: 'first_name', label: 'First Name (auto-generated if missing)', required: false },
      { field: 'last_name', label: 'Last Name (auto-generated if missing)', required: false },
      { field: 'title_position', label: 'Title/Position', required: false },
      { field: 'organization_affiliation', label: 'Organization', required: false },
      { field: 't_shirt_size', label: 'T-Shirt Size', required: false },
      { field: 'dietary_restrictions', label: 'Dietary Restrictions', required: false },
      { field: 'accessibility_needs', label: 'Accessibility Needs', required: false },
      { field: 'bio', label: 'Bio', required: false },
      { field: 'professional_interests', label: 'Professional Interests', required: false },
      { field: 'community_interests', label: 'Community Interests', required: false }
    ];
  }
}

export default new BulkImportService();
