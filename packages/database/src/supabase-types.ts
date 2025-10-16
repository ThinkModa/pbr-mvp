export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          category_id: string | null
          created_at: string
          current_rsvps: number
          description: string | null
          end_time: string
          event_id: string
          id: string
          is_required: boolean
          latitude: number | null
          location: Json | null
          location_address: string | null
          longitude: number | null
          max_capacity: number | null
          order: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_rsvps?: number
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          is_required?: boolean
          latitude?: number | null
          location?: Json | null
          location_address?: string | null
          longitude?: number | null
          max_capacity?: number | null
          order?: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_rsvps?: number
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          is_required?: boolean
          latitude?: number | null
          location?: Json | null
          location_address?: string | null
          longitude?: number | null
          max_capacity?: number | null
          order?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_organizations: {
        Row: {
          activity_id: string
          created_at: string
          display_order: number
          id: string
          is_confirmed: boolean
          is_public: boolean
          organization_id: string
          role: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          organization_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          organization_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_organizations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_rsvps: {
        Row: {
          activity_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          guest_count: number
          id: string
          is_approved: boolean
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guest_count?: number
          id?: string
          is_approved?: boolean
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guest_count?: number
          id?: string
          is_approved?: boolean
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_rsvps_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_rsvps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_speakers: {
        Row: {
          activity_id: string
          created_at: string
          display_order: number
          id: string
          is_confirmed: boolean
          is_public: boolean
          role: string
          speaker_id: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          role?: string
          speaker_id: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          role?: string
          speaker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_speakers_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id: string
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_contacts: {
        Row: {
          allow_contact: boolean
          business_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_primary: boolean
          is_public: boolean
          last_name: string
          phone: string | null
          role: string
          title: string | null
          updated_at: string
        }
        Insert: {
          allow_contact?: boolean
          business_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          last_name: string
          phone?: string | null
          role?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          allow_contact?: boolean
          business_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          last_name?: string
          phone?: string | null
          role?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: Json | null
          allow_contact: boolean
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          employee_count: number | null
          founded_year: number | null
          gallery_urls: Json | null
          id: string
          industry: string | null
          is_public: boolean
          is_sponsor: boolean
          logo_url: string | null
          metadata: Json | null
          name: string
          organization_id: string
          phone: string | null
          products: Json | null
          revenue: string | null
          services: Json | null
          size: string | null
          social_links: Json | null
          tags: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          allow_contact?: boolean
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          gallery_urls?: Json | null
          id?: string
          industry?: string | null
          is_public?: boolean
          is_sponsor?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          phone?: string | null
          products?: Json | null
          revenue?: string | null
          services?: Json | null
          size?: string | null
          social_links?: Json | null
          tags?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          allow_contact?: boolean
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          founded_year?: number | null
          gallery_urls?: Json | null
          id?: string
          industry?: string | null
          is_public?: boolean
          is_sponsor?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          phone?: string | null
          products?: Json | null
          revenue?: string | null
          services?: Json | null
          size?: string | null
          social_links?: Json | null
          tags?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_memberships: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          mute_until: string | null
          notifications_enabled: boolean
          role: string
          thread_id: string
          unread_count: number
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          mute_until?: string | null
          notifications_enabled?: boolean
          role?: string
          thread_id: string
          unread_count?: number
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          mute_until?: string | null
          notifications_enabled?: boolean
          role?: string
          thread_id?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_memberships_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          event_id: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          message_type: string
          reactions: Json | null
          reply_to_id: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          event_id?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          message_type?: string
          reactions?: Json | null
          reply_to_id?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          event_id?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          message_type?: string
          reactions?: Json | null
          reply_to_id?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          allow_file_uploads: boolean
          allow_member_invites: boolean
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          is_private: boolean
          last_message_at: string | null
          max_members: number | null
          metadata: Json | null
          name: string | null
          organization_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          allow_file_uploads?: boolean
          allow_member_invites?: boolean
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_private?: boolean
          last_message_at?: string | null
          max_members?: number | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          allow_file_uploads?: boolean
          allow_member_invites?: boolean
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          is_private?: boolean
          last_message_at?: string | null
          max_members?: number | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_interests: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      event_businesses: {
        Row: {
          booth_number: string | null
          business_id: string
          created_at: string
          display_order: number
          event_id: string
          id: string
          is_confirmed: boolean
          is_featured: boolean
          is_public: boolean
          role: string
          sponsorship_level: string | null
          updated_at: string
        }
        Insert: {
          booth_number?: string | null
          business_id: string
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          is_confirmed?: boolean
          is_featured?: boolean
          is_public?: boolean
          role?: string
          sponsorship_level?: string | null
          updated_at?: string
        }
        Update: {
          booth_number?: string | null
          business_id?: string
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          is_confirmed?: boolean
          is_featured?: boolean
          is_public?: boolean
          role?: string
          sponsorship_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_businesses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_organizations: {
        Row: {
          booth_number: string | null
          created_at: string
          display_order: number
          event_id: string
          id: string
          is_confirmed: boolean
          is_featured: boolean
          is_public: boolean
          organization_id: string
          role: string
          sponsorship_level: string | null
          updated_at: string
        }
        Insert: {
          booth_number?: string | null
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          is_confirmed?: boolean
          is_featured?: boolean
          is_public?: boolean
          organization_id: string
          role?: string
          sponsorship_level?: string | null
          updated_at?: string
        }
        Update: {
          booth_number?: string | null
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          is_confirmed?: boolean
          is_featured?: boolean
          is_public?: boolean
          organization_id?: string
          role?: string
          sponsorship_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organizations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          accessibility_needs: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          dietary_restrictions: string | null
          event_id: string
          guest_count: number
          id: string
          is_approved: boolean
          notes: string | null
          status: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_needs?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          event_id: string
          guest_count?: number
          id?: string
          is_approved?: boolean
          notes?: string | null
          status?: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_needs?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          event_id?: string
          guest_count?: number
          id?: string
          is_approved?: boolean
          notes?: string | null
          status?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "event_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          created_at: string
          display_order: number
          event_id: string
          id: string
          is_confirmed: boolean
          is_public: boolean
          role: string
          session_description: string | null
          session_end_time: string | null
          session_start_time: string | null
          session_title: string | null
          speaker_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          role?: string
          session_description?: string | null
          session_end_time?: string | null
          session_start_time?: string | null
          session_title?: string | null
          speaker_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          is_confirmed?: boolean
          is_public?: boolean
          role?: string
          session_description?: string | null
          session_end_time?: string | null
          session_start_time?: string | null
          session_title?: string | null
          speaker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tracks: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          event_id: string
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tracks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_waitlist: boolean
          cover_image_url: string | null
          created_at: string
          current_rsvps: number
          description: string | null
          end_time: string
          gallery_urls: Json | null
          has_tracks: boolean
          id: string
          is_free: boolean
          is_public: boolean
          latitude: number | null
          location: Json | null
          location_address: string | null
          longitude: number | null
          max_capacity: number | null
          metadata: Json | null
          organization_id: string
          price: number | null
          require_approval: boolean
          show_attendee_count: boolean
          show_capacity: boolean
          show_price: boolean
          slug: string
          start_time: string
          status: string
          tags: Json | null
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          allow_waitlist?: boolean
          cover_image_url?: string | null
          created_at?: string
          current_rsvps?: number
          description?: string | null
          end_time: string
          gallery_urls?: Json | null
          has_tracks?: boolean
          id?: string
          is_free?: boolean
          is_public?: boolean
          latitude?: number | null
          location?: Json | null
          location_address?: string | null
          longitude?: number | null
          max_capacity?: number | null
          metadata?: Json | null
          organization_id: string
          price?: number | null
          require_approval?: boolean
          show_attendee_count?: boolean
          show_capacity?: boolean
          show_price?: boolean
          slug: string
          start_time: string
          status?: string
          tags?: Json | null
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          allow_waitlist?: boolean
          cover_image_url?: string | null
          created_at?: string
          current_rsvps?: number
          description?: string | null
          end_time?: string
          gallery_urls?: Json | null
          has_tracks?: boolean
          id?: string
          is_free?: boolean
          is_public?: boolean
          latitude?: number | null
          location?: Json | null
          location_address?: string | null
          longitude?: number | null
          max_capacity?: number | null
          metadata?: Json | null
          organization_id?: string
          price?: number | null
          require_approval?: boolean
          show_attendee_count?: boolean
          show_capacity?: boolean
          show_price?: boolean
          slug?: string
          start_time?: string
          status?: string
          tags?: Json | null
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          failed_imports: number
          id: string
          name: string
          successful_imports: number
          total_users: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          failed_imports?: number
          id?: string
          name: string
          successful_imports?: number
          total_users?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          failed_imports?: number
          id?: string
          name?: string
          successful_imports?: number
          total_users?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      import_errors: {
        Row: {
          batch_id: string | null
          created_at: string | null
          email: string | null
          error_message: string
          id: string
          raw_data: Json | null
          row_number: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          email?: string | null
          error_message: string
          id?: string
          raw_data?: Json | null
          row_number: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          email?: string | null
          error_message?: string
          id?: string
          raw_data?: Json | null
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_batches: {
        Row: {
          batch_id: string | null
          created_at: string | null
          email_sent: number
          id: string
          sent_at: string | null
          sms_sent: number
          user_ids: string[]
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          email_sent?: number
          id?: string
          sent_at?: string | null
          sms_sent?: number
          user_ids: string[]
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          email_sent?: number
          id?: string
          sent_at?: string | null
          sms_sent?: number
          user_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invitation_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      media_objects: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number
          file_type: string
          filename: string
          height: number | null
          id: string
          is_public: boolean
          metadata: Json | null
          mime_type: string
          original_filename: string
          processing_error: string | null
          processing_status: string
          storage_path: string
          storage_url: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size: number
          file_type: string
          filename: string
          height?: number | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          mime_type: string
          original_filename: string
          processing_error?: string | null
          processing_status?: string
          storage_path: string
          storage_url: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number
          file_type?: string
          filename?: string
          height?: number | null
          id?: string
          is_public?: boolean
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          processing_error?: string | null
          processing_status?: string
          storage_path?: string
          storage_url?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_objects_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          allow_contact: boolean
          business_hours: Json | null
          created_at: string
          description: string | null
          email: string | null
          founded_year: number | null
          id: string
          industry: string | null
          is_active: boolean
          is_public: boolean
          is_sponsor: boolean
          logo_url: string | null
          metadata: Json | null
          name: string
          phone: string | null
          size: string | null
          slug: string
          tags: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          allow_contact?: boolean
          business_hours?: Json | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_public?: boolean
          is_sponsor?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          size?: string | null
          slug: string
          tags?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          allow_contact?: boolean
          business_hours?: Json | null
          created_at?: string
          description?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_public?: boolean
          is_sponsor?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          size?: string | null
          slug?: string
          tags?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      professional_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      speakers: {
        Row: {
          allow_contact: boolean
          bio: string | null
          company: string | null
          created_at: string
          email: string
          expertise: Json | null
          first_name: string
          headshot_url: string | null
          id: string
          is_public: boolean
          last_name: string
          metadata: Json | null
          organization_id: string
          phone: string | null
          profile_image_url: string | null
          social_links: Json | null
          tags: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          allow_contact?: boolean
          bio?: string | null
          company?: string | null
          created_at?: string
          email: string
          expertise?: Json | null
          first_name: string
          headshot_url?: string | null
          id?: string
          is_public?: boolean
          last_name: string
          metadata?: Json | null
          organization_id: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          tags?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          allow_contact?: boolean
          bio?: string | null
          company?: string | null
          created_at?: string
          email?: string
          expertise?: Json | null
          first_name?: string
          headshot_url?: string | null
          id?: string
          is_public?: boolean
          last_name?: string
          metadata?: Json | null
          organization_id?: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          tags?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speakers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      track_activities: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          track_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          track_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_activities_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "event_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_community_interests: {
        Row: {
          created_at: string
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_community_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "community_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_community_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_event_attendance: {
        Row: {
          attended_at: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          attended_at?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          attended_at?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_professional_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_professional_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "professional_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_professional_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_role: string
          old_role: string
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_role: string
          old_role: string
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: string
          old_role?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          accessibility_needs: string | null
          activated_at: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          dietary_restrictions: string | null
          email: string
          first_name: string | null
          id: string
          import_batch_id: string | null
          invited_at: string | null
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          name: string
          organization_affiliation: string | null
          phone_number: string | null
          points: number | null
          preferences: Json | null
          role: string
          status: string | null
          t_shirt_size: string | null
          title_position: string | null
          updated_at: string
        }
        Insert: {
          accessibility_needs?: string | null
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email: string
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          invited_at?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          name: string
          organization_affiliation?: string | null
          phone_number?: string | null
          points?: number | null
          preferences?: Json | null
          role?: string
          status?: string | null
          t_shirt_size?: string | null
          title_position?: string | null
          updated_at?: string
        }
        Update: {
          accessibility_needs?: string | null
          activated_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string
          first_name?: string | null
          id?: string
          import_batch_id?: string | null
          invited_at?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          name?: string
          organization_affiliation?: string | null
          phone_number?: string | null
          points?: number | null
          preferences?: Json | null
          role?: string
          status?: string | null
          t_shirt_size?: string | null
          title_position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_user_role: {
        Args: {
          changed_by_user_id: string
          new_role: string
          reason?: string
          target_user_id: string
        }
        Returns: boolean
      }
      demote_admin_to_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string
          name: string
          role: string
        }[]
      }
      get_user_role_history: {
        Args: { target_user_id: string }
        Returns: {
          changed_by_name: string
          created_at: string
          id: string
          new_role: string
          old_role: string
          reason: string
        }[]
      }
      promote_user_to_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      uuid_generate_v4: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "approve"
        | "reject"
        | "invite"
        | "remove"
        | "publish"
        | "unpublish"
        | "cancel"
        | "restore"
      chat_thread_type: "group" | "dm" | "event" | "organization"
      event_status: "draft" | "published" | "cancelled" | "completed"
      media_type: "image" | "video" | "audio" | "document" | "other"
      message_type: "text" | "image" | "file" | "system"
      processing_status: "pending" | "processing" | "completed" | "failed"
      rsvp_status: "attending" | "not_attending" | "maybe" | "waitlist"
      user_role: "admin" | "business" | "general"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "approve",
        "reject",
        "invite",
        "remove",
        "publish",
        "unpublish",
        "cancel",
        "restore",
      ],
      chat_thread_type: ["group", "dm", "event", "organization"],
      event_status: ["draft", "published", "cancelled", "completed"],
      media_type: ["image", "video", "audio", "document", "other"],
      message_type: ["text", "image", "file", "system"],
      processing_status: ["pending", "processing", "completed", "failed"],
      rsvp_status: ["attending", "not_attending", "maybe", "waitlist"],
      user_role: ["admin", "business", "general"],
    },
  },
} as const

