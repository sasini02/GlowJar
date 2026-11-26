export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
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
      celebrations: {
        Row: {
          created_at: string
          type: Database["public"]["Enums"]["celebration_type"]
          user_id: string
          win_id: string
        }
        Insert: {
          created_at?: string
          type: Database["public"]["Enums"]["celebration_type"]
          user_id: string
          win_id: string
        }
        Update: {
          created_at?: string
          type?: Database["public"]["Enums"]["celebration_type"]
          user_id?: string
          win_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "celebrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "celebrations_win_id_fkey"
            columns: ["win_id"]
            isOneToOne: false
            referencedRelation: "wins"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          body_encrypted: string
          created_at: string
          deliver_on: string
          delivered_at: string | null
          id: string
          opened_at: string | null
          user_id: string
        }
        Insert: {
          body_encrypted: string
          created_at?: string
          deliver_on: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          user_id: string
        }
        Update: {
          body_encrypted?: string
          created_at?: string
          deliver_on?: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      monthly_recaps: {
        Row: {
          by_category: Json
          created_at: string
          month: string
          top_win_celebrations: number
          top_win_id: string | null
          total: number
          user_id: string
        }
        Insert: {
          by_category: Json
          created_at?: string
          month: string
          top_win_celebrations?: number
          top_win_id?: string | null
          total: number
          user_id: string
        }
        Update: {
          by_category?: Json
          created_at?: string
          month?: string
          top_win_celebrations?: number
          top_win_id?: string | null
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_recaps_top_win_id_fkey"
            columns: ["top_win_id"]
            isOneToOne: false
            referencedRelation: "wins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_recaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          cheerups_enabled: boolean
          created_at: string
          default_visibility: Database["public"]["Enums"]["visibility"]
          is_moderator: boolean
          next_cheerup_at: string | null
          nudge_time: Database["public"]["Enums"]["nudge_time"]
          onboarded_at: string | null
          quiet_end: string
          quiet_start: string
          theme: Database["public"]["Enums"]["theme_preference"]
          timezone: string
          user_id: string
          username: string
        }
        Insert: {
          cheerups_enabled?: boolean
          created_at?: string
          default_visibility?: Database["public"]["Enums"]["visibility"]
          is_moderator?: boolean
          nudge_time?: Database["public"]["Enums"]["nudge_time"]
          onboarded_at?: string | null
          quiet_end?: string
          quiet_start?: string
          theme?: Database["public"]["Enums"]["theme_preference"]
          timezone?: string
          user_id: string
          username: string
        }
        Update: {
          cheerups_enabled?: boolean
          created_at?: string
          default_visibility?: Database["public"]["Enums"]["visibility"]
          is_moderator?: boolean
          nudge_time?: Database["public"]["Enums"]["nudge_time"]
          onboarded_at?: string | null
          quiet_end?: string
          quiet_start?: string
          theme?: Database["public"]["Enums"]["theme_preference"]
          timezone?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          id: number
          sent_at: string
          user_id: string
          win_id: string | null
        }
        Insert: {
          id?: never
          sent_at?: string
          user_id: string
          win_id?: string | null
        }
        Update: {
          id?: never
          sent_at?: string
          user_id?: string
          win_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reminder_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reminder_log_win_id_fkey"
            columns: ["win_id"]
            isOneToOne: false
            referencedRelation: "wins"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          win_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          win_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          win_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_win_id_fkey"
            columns: ["win_id"]
            isOneToOne: false
            referencedRelation: "wins"
            referencedColumns: ["id"]
          },
        ]
      }
      wins: {
        Row: {
          category: Database["public"]["Enums"]["win_category"]
          created_at: string
          emoji: string | null
          id: string
          is_public: boolean
          search: unknown
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["win_category"]
          created_at?: string
          emoji?: string | null
          id?: string
          is_public?: boolean
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["win_category"]
          created_at?: string
          emoji?: string | null
          id?: string
          is_public?: boolean
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          user_id: string | null
          username: string | null
        }
        Insert: {
          user_id?: string | null
          username?: string | null
        }
        Update: {
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      open_letter: { Args: { letter_id: string }; Returns: string }
      seal_letter: {
        Args: { body: string; deliver_on: string }
        Returns: string
      }
      suggest_username: { Args: never; Returns: string }
      release_letter: { Args: { target_letter: string }; Returns: undefined }
      remove_push_subscriptions: { Args: { endpoints: string[] }; Returns: number }
      register_push_subscription: {
        Args: { sub_auth: string; sub_endpoint: string; sub_p256dh: string }
        Returns: undefined
      }
      resolve_reports: {
        Args: {
          decision: Database["public"]["Enums"]["report_status"]
          target_win: string
        }
        Returns: undefined
      }
      open_reports: {
        Args: never
        Returns: {
          first_reported_at: string
          is_public: boolean
          reasons: string[]
          report_count: number
          win_emoji: string | null
          win_id: string
          win_text: string
        }[]
      }
      jar_shelf: {
        Args: never
        Returns: {
          lights: number
          month: string
        }[]
      }
      on_this_day: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["win_category"]
          created_at: string
          emoji: string | null
          months_ago: number
          text: string
          win_id: string
        }[]
      }
    }
    Enums: {
      celebration_type: "celebrate" | "proud" | "metoo"
      nudge_time: "morning" | "lunch" | "evening" | "night"
      report_status: "open" | "reviewed" | "removed"
      theme_preference: "day" | "night" | "auto"
      visibility: "public" | "private"
      win_category:
        | "health"
        | "work"
        | "social"
        | "mind"
        | "learning"
        | "self_care"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      celebration_type: ["celebrate", "proud", "metoo"],
      nudge_time: ["morning", "lunch", "evening", "night"],
      report_status: ["open", "reviewed", "removed"],
      theme_preference: ["day", "night", "auto"],
      visibility: ["public", "private"],
      win_category: [
        "health",
        "work",
        "social",
        "mind",
        "learning",
        "self_care",
      ],
    },
  },
} as const
