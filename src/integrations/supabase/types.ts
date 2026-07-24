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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      execution_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_kind: string
          created_at: string
          details: Json
          id: string
          request_id: string | null
          success: boolean
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_kind: string
          created_at?: string
          details?: Json
          id?: string
          request_id?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_kind?: string
          created_at?: string
          details?: Json
          id?: string
          request_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          auto_execute_threshold: number
          discord_webhook_url: string | null
          id: number
          notify_email: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_execute_threshold?: number
          discord_webhook_url?: string | null
          id?: number
          notify_email?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_execute_threshold?: number
          discord_webhook_url?: string | null
          id?: number
          notify_email?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          completed_count: number
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_available: boolean
          latitude: number | null
          longitude: number | null
          performance_score: number
          phone: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          completed_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_available?: boolean
          latitude?: number | null
          longitude?: number | null
          performance_score?: number
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          completed_count?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_available?: boolean
          latitude?: number | null
          longitude?: number | null
          performance_score?: number
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          ai_model: string | null
          ai_reasoning: string | null
          assigned_at: string | null
          assigned_volunteer_id: string | null
          auto_executed: boolean
          citizen_email: string | null
          citizen_name: string
          citizen_phone: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string
          department: Database["public"]["Enums"]["req_department"] | null
          description: string
          estimated_response_minutes: number | null
          id: string
          intent: Database["public"]["Enums"]["req_intent"] | null
          latitude: number | null
          location_text: string
          longitude: number | null
          match_reason: string | null
          match_score: number | null
          priority: Database["public"]["Enums"]["req_priority"] | null
          recommended_resources: string[] | null
          request_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          sentiment: Database["public"]["Enums"]["req_sentiment"] | null
          status: Database["public"]["Enums"]["req_status"]
          suggested_volunteer_skill: string | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          ai_reasoning?: string | null
          assigned_at?: string | null
          assigned_volunteer_id?: string | null
          auto_executed?: boolean
          citizen_email?: string | null
          citizen_name: string
          citizen_phone?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          department?: Database["public"]["Enums"]["req_department"] | null
          description: string
          estimated_response_minutes?: number | null
          id?: string
          intent?: Database["public"]["Enums"]["req_intent"] | null
          latitude?: number | null
          location_text: string
          longitude?: number | null
          match_reason?: string | null
          match_score?: number | null
          priority?: Database["public"]["Enums"]["req_priority"] | null
          recommended_resources?: string[] | null
          request_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: Database["public"]["Enums"]["req_sentiment"] | null
          status?: Database["public"]["Enums"]["req_status"]
          suggested_volunteer_skill?: string | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          ai_reasoning?: string | null
          assigned_at?: string | null
          assigned_volunteer_id?: string | null
          auto_executed?: boolean
          citizen_email?: string | null
          citizen_name?: string
          citizen_phone?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          department?: Database["public"]["Enums"]["req_department"] | null
          description?: string
          estimated_response_minutes?: number | null
          id?: string
          intent?: Database["public"]["Enums"]["req_intent"] | null
          latitude?: number | null
          location_text?: string
          longitude?: number | null
          match_reason?: string | null
          match_score?: number | null
          priority?: Database["public"]["Enums"]["req_priority"] | null
          recommended_resources?: string[] | null
          request_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sentiment?: Database["public"]["Enums"]["req_sentiment"] | null
          status?: Database["public"]["Enums"]["req_status"]
          suggested_volunteer_skill?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coordinator" | "volunteer"
      req_department:
        | "medical_team"
        | "fire_department"
        | "food_relief"
        | "police"
        | "ngo"
        | "volunteer_team"
        | "municipality"
      req_intent:
        | "medical_emergency"
        | "flood_rescue"
        | "food_shortage"
        | "fire"
        | "shelter_needed"
        | "missing_person"
        | "animal_rescue"
        | "power_failure"
        | "road_block"
        | "water_supply"
        | "medical_supply"
        | "volunteer_request"
        | "donation_request"
        | "other"
      req_priority: "critical" | "high" | "medium" | "low"
      req_sentiment: "panic" | "distressed" | "urgent" | "neutral"
      req_status:
        | "pending_ai"
        | "awaiting_review"
        | "approved"
        | "assigned"
        | "in_progress"
        | "completed"
        | "rejected"
        | "cancelled"
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
  public: {
    Enums: {
      app_role: ["admin", "coordinator", "volunteer"],
      req_department: [
        "medical_team",
        "fire_department",
        "food_relief",
        "police",
        "ngo",
        "volunteer_team",
        "municipality",
      ],
      req_intent: [
        "medical_emergency",
        "flood_rescue",
        "food_shortage",
        "fire",
        "shelter_needed",
        "missing_person",
        "animal_rescue",
        "power_failure",
        "road_block",
        "water_supply",
        "medical_supply",
        "volunteer_request",
        "donation_request",
        "other",
      ],
      req_priority: ["critical", "high", "medium", "low"],
      req_sentiment: ["panic", "distressed", "urgent", "neutral"],
      req_status: [
        "pending_ai",
        "awaiting_review",
        "approved",
        "assigned",
        "in_progress",
        "completed",
        "rejected",
        "cancelled",
      ],
    },
  },
} as const
