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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      blog_posts: {
        Row: {
          content: string
          created_at: string | null
          excerpt: string
          id: string
          is_published: boolean | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          excerpt?: string
          id?: string
          is_published?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          is_published?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          category: string
          certificate_original_names: string[] | null
          certificate_urls: string[] | null
          created_at: string | null
          credential_url: string | null
          expiration_month: number | null
          expiration_year: number | null
          id: string
          issue_month: number
          issue_year: number
          issuing_organization: string
          name: string
          organization_logo_original_name: string | null
          organization_logo_url: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          certificate_original_names?: string[] | null
          certificate_urls?: string[] | null
          created_at?: string | null
          credential_url?: string | null
          expiration_month?: number | null
          expiration_year?: number | null
          id?: string
          issue_month: number
          issue_year: number
          issuing_organization: string
          name: string
          organization_logo_original_name?: string | null
          organization_logo_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          certificate_original_names?: string[] | null
          certificate_urls?: string[] | null
          created_at?: string | null
          credential_url?: string | null
          expiration_month?: number | null
          expiration_year?: number | null
          id?: string
          issue_month?: number
          issue_year?: number
          issuing_organization?: string
          name?: string
          organization_logo_original_name?: string | null
          organization_logo_url?: string | null
          skills?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          activities: string | null
          category: string
          created_at: string | null
          degree: string | null
          description: string | null
          education_id: string
          education_photos: string[] | null
          education_photos_original_names: string[] | null
          end_month: number | null
          end_year: number | null
          field_of_study: string
          grade: string | null
          school: string
          school_logo_original_name: string | null
          school_logo_url: string | null
          start_month: number
          start_year: number
          updated_at: string | null
        }
        Insert: {
          activities?: string | null
          category?: string
          created_at?: string | null
          degree?: string | null
          description?: string | null
          education_id?: string
          education_photos?: string[] | null
          education_photos_original_names?: string[] | null
          end_month?: number | null
          end_year?: number | null
          field_of_study: string
          grade?: string | null
          school: string
          school_logo_original_name?: string | null
          school_logo_url?: string | null
          start_month: number
          start_year: number
          updated_at?: string | null
        }
        Update: {
          activities?: string | null
          category?: string
          created_at?: string | null
          degree?: string | null
          description?: string | null
          education_id?: string
          education_photos?: string[] | null
          education_photos_original_names?: string[] | null
          end_month?: number | null
          end_year?: number | null
          field_of_study?: string
          grade?: string | null
          school?: string
          school_logo_original_name?: string | null
          school_logo_url?: string | null
          start_month?: number
          start_year?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      experience: {
        Row: {
          category: string
          company_logo_original_name: string | null
          company_logo_url: string | null
          company_name: string
          created_at: string | null
          description: string | null
          employment_type: string
          end_month: number | null
          end_year: number | null
          experience_id: string
          experience_photos: string[] | null
          experience_photos_original_names: string[] | null
          is_current: boolean | null
          location: string | null
          skills_used: string[] | null
          start_month: number
          start_year: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_logo_original_name?: string | null
          company_logo_url?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          employment_type: string
          end_month?: number | null
          end_year?: number | null
          experience_id?: string
          experience_photos?: string[] | null
          experience_photos_original_names?: string[] | null
          is_current?: boolean | null
          location?: string | null
          skills_used?: string[] | null
          start_month: number
          start_year: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_logo_original_name?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          employment_type?: string
          end_month?: number | null
          end_year?: number | null
          experience_id?: string
          experience_photos?: string[] | null
          experience_photos_original_names?: string[] | null
          is_current?: boolean | null
          location?: string | null
          skills_used?: string[] | null
          start_month?: number
          start_year?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          github_token: string | null
          github_username: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          github_token?: string | null
          github_username?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          github_token?: string | null
          github_username?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          forks: number | null
          github_url: string | null
          homepage: string | null
          html_url: string
          id: string
          is_visible: boolean | null
          language: string
          license: string | null
          live_url: string | null
          name: string
          size: number | null
          stars: number | null
          technologies: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          forks?: number | null
          github_url?: string | null
          homepage?: string | null
          html_url: string
          id?: string
          is_visible?: boolean | null
          language: string
          license?: string | null
          live_url?: string | null
          name: string
          size?: number | null
          stars?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          forks?: number | null
          github_url?: string | null
          homepage?: string | null
          html_url?: string
          id?: string
          is_visible?: boolean | null
          language?: string
          license?: string | null
          live_url?: string | null
          name?: string
          size?: number | null
          stars?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_standard_policies: {
        Args: { table_name: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
