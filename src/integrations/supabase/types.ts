export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bonus_thresholds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_settings_id: string
          threshold: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_settings_id: string
          threshold: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_settings_id?: string
          threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_thresholds_payment_settings_id_fkey"
            columns: ["payment_settings_id"]
            isOneToOne: false
            referencedRelation: "payment_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_content_mappings: {
        Row: {
          channel_id: string
          content_item_id: string
          created_at: string
          id: string
        }
        Insert: {
          channel_id: string
          content_item_id: string
          created_at?: string
          id?: string
        }
        Update: {
          channel_id?: string
          content_item_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_content_mappings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_content_mappings_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          default_payment_settings_id: string | null
          id: string
          name: string
          platform: string
          platform_id: string
          platform_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_payment_settings_id?: string | null
          id?: string
          name: string
          platform: string
          platform_id: string
          platform_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_payment_settings_id?: string | null
          id?: string
          name?: string
          platform?: string
          platform_id?: string
          platform_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          belongs_to_channel: boolean
          created_at: string
          current_views: number
          id: string
          managed_by_manager: boolean
          payment_settings_id: string | null
          platform: string
          platform_id: string | null
          title: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          belongs_to_channel?: boolean
          created_at?: string
          current_views?: number
          id?: string
          managed_by_manager?: boolean
          payment_settings_id?: string | null
          platform: string
          platform_id?: string | null
          title: string
          updated_at?: string
          upload_date: string
        }
        Update: {
          belongs_to_channel?: boolean
          created_at?: string
          current_views?: number
          id?: string
          managed_by_manager?: boolean
          payment_settings_id?: string | null
          platform?: string
          platform_id?: string | null
          title?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          base_pay: number
          combine_views: boolean
          created_at: string
          id: string
          max_payout: number | null
          name: string
          tracking_period_days: number
          updated_at: string
          view_rate: number
          views_per_unit: number
        }
        Insert: {
          base_pay?: number
          combine_views?: boolean
          created_at?: string
          id?: string
          max_payout?: number | null
          name: string
          tracking_period_days?: number
          updated_at?: string
          view_rate?: number
          views_per_unit?: number
        }
        Update: {
          base_pay?: number
          combine_views?: boolean
          created_at?: string
          id?: string
          max_payout?: number | null
          name?: string
          tracking_period_days?: number
          updated_at?: string
          view_rate?: number
          views_per_unit?: number
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          content_item_id: string
          created_at: string
          date: string
          id: string
          view_count: number
        }
        Insert: {
          amount: number
          content_item_id: string
          created_at?: string
          date?: string
          id?: string
          view_count: number
        }
        Update: {
          amount?: number
          content_item_id?: string
          created_at?: string
          date?: string
          id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      view_history: {
        Row: {
          content_item_id: string
          created_at: string
          id: string
          record_date: string
          view_count: number
        }
        Insert: {
          content_item_id: string
          created_at?: string
          id?: string
          record_date?: string
          view_count: number
        }
        Update: {
          content_item_id?: string
          created_at?: string
          id?: string
          record_date?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_history_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
