// Basic database types for web admin
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'business' | 'general';
          avatar_url?: string;
          is_active?: boolean;
          preferences?: any;
          last_login_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'business' | 'general';
          avatar_url?: string;
          is_active?: boolean;
          preferences?: any;
          last_login_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'business' | 'general';
          avatar_url?: string;
          is_active?: boolean;
          preferences?: any;
          last_login_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          location: string;
          max_capacity: number;
          price: number;
          show_capacity: boolean;
          show_price: boolean;
          show_attendee_count: boolean;
          has_tracks: boolean;
          cover_image_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          start_date: string;
          end_date: string;
          location: string;
          max_capacity: number;
          price: number;
          show_capacity: boolean;
          show_price: boolean;
          show_attendee_count: boolean;
          has_tracks: boolean;
          cover_image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          location?: string;
          max_capacity?: number;
          price?: number;
          show_capacity?: boolean;
          show_price?: boolean;
          show_attendee_count?: boolean;
          has_tracks?: boolean;
          cover_image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      speakers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          bio?: string;
          company?: string;
          title?: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          bio?: string;
          company?: string;
          title?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          bio?: string;
          company?: string;
          title?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          description?: string;
          website?: string;
          email?: string;
          phone?: string;
          address?: string;
          logo_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          website?: string;
          email?: string;
          phone?: string;
          address?: string;
          logo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          website?: string;
          email?: string;
          phone?: string;
          address?: string;
          logo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
