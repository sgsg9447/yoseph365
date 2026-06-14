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
      about_history: {
        Row: {
          created_at: string
          display_order: number
          id: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: never
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: never
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      about_history_item: {
        Row: {
          content: string
          created_at: string
          display_order: number
          history_id: number
          id: number
          is_highlighted: boolean
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          history_id: number
          id?: never
          is_highlighted?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          history_id?: number
          id?: never
          is_highlighted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "about_history_item_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "about_history"
            referencedColumns: ["id"]
          },
        ]
      }
      application: {
        Row: {
          additional_note: string | null
          admin_memo: string | null
          created_at: string
          id: number
          name: string
          phone: string
          privacy_agreed: boolean
          selected_courses: string[]
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          additional_note?: string | null
          admin_memo?: string | null
          created_at?: string
          id?: never
          name: string
          phone: string
          privacy_agreed?: boolean
          selected_courses?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          additional_note?: string | null
          admin_memo?: string | null
          created_at?: string
          id?: never
          name?: string
          phone?: string
          privacy_agreed?: boolean
          selected_courses?: string[]
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: []
      }
      course: {
        Row: {
          category: Database["public"]["Enums"]["course_category"]
          created_at: string
          duration_text: string | null
          funding_type: Database["public"]["Enums"]["funding_type"]
          id: string
          is_deleted: boolean
          name: string
          recruit_status: Database["public"]["Enums"]["recruit_status"]
          schedule_pattern:
            | Database["public"]["Enums"]["schedule_pattern"]
            | null
          self_pay: string | null
          seo_keywords: string[]
          session_hours: string | null
          sessions_total: number | null
          skills: string[]
          summary: string | null
          total_hours: number | null
          tuition: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["course_category"]
          created_at?: string
          duration_text?: string | null
          funding_type: Database["public"]["Enums"]["funding_type"]
          id: string
          is_deleted?: boolean
          name: string
          recruit_status?: Database["public"]["Enums"]["recruit_status"]
          schedule_pattern?:
            | Database["public"]["Enums"]["schedule_pattern"]
            | null
          self_pay?: string | null
          seo_keywords?: string[]
          session_hours?: string | null
          sessions_total?: number | null
          skills?: string[]
          summary?: string | null
          total_hours?: number | null
          tuition?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["course_category"]
          created_at?: string
          duration_text?: string | null
          funding_type?: Database["public"]["Enums"]["funding_type"]
          id?: string
          is_deleted?: boolean
          name?: string
          recruit_status?: Database["public"]["Enums"]["recruit_status"]
          schedule_pattern?:
            | Database["public"]["Enums"]["schedule_pattern"]
            | null
          self_pay?: string | null
          seo_keywords?: string[]
          session_hours?: string | null
          sessions_total?: number | null
          skills?: string[]
          summary?: string | null
          total_hours?: number | null
          tuition?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_apply_info: {
        Row: {
          capacity: string | null
          cost: string | null
          cost_notes: string[]
          course_id: string
          exclusions: string[]
          qualifications: string[]
          recruit_period: string | null
          steps: string[]
          training_period: string | null
          training_time: string[]
          updated_at: string
        }
        Insert: {
          capacity?: string | null
          cost?: string | null
          cost_notes?: string[]
          course_id: string
          exclusions?: string[]
          qualifications?: string[]
          recruit_period?: string | null
          steps?: string[]
          training_period?: string | null
          training_time?: string[]
          updated_at?: string
        }
        Update: {
          capacity?: string | null
          cost?: string | null
          cost_notes?: string[]
          course_id?: string
          exclusions?: string[]
          qualifications?: string[]
          recruit_period?: string | null
          steps?: string[]
          training_period?: string | null
          training_time?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_apply_info_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      course_track: {
        Row: {
          course_id: string
          description: string | null
          id: string
          name: string
          price: number | null
          recruit_status: Database["public"]["Enums"]["recruit_status"]
          schedule_summary: string[]
          sessions_total: number | null
          sort_order: number
        }
        Insert: {
          course_id: string
          description?: string | null
          id: string
          name: string
          price?: number | null
          recruit_status?: Database["public"]["Enums"]["recruit_status"]
          schedule_summary?: string[]
          sessions_total?: number | null
          sort_order?: number
        }
        Update: {
          course_id?: string
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          recruit_status?: Database["public"]["Enums"]["recruit_status"]
          schedule_summary?: string[]
          sessions_total?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_track_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_item: {
        Row: {
          contents: string[]
          course_id: string
          hours: number | null
          id: number
          place: string | null
          round: number
          unit: string | null
        }
        Insert: {
          contents?: string[]
          course_id: string
          hours?: number | null
          id?: never
          place?: string | null
          round: number
          unit?: string | null
        }
        Update: {
          contents?: string[]
          course_id?: string
          hours?: number | null
          id?: never
          place?: string | null
          round?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_item_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedule: {
        Row: {
          apply_end: string | null
          apply_start: string | null
          exam_end: string | null
          exam_start: string | null
          id: number
          result_dates: string[]
          round: string
          sort_order: number
          track_id: string
          year: number
        }
        Insert: {
          apply_end?: string | null
          apply_start?: string | null
          exam_end?: string | null
          exam_start?: string | null
          id?: never
          result_dates?: string[]
          round: string
          sort_order?: number
          track_id: string
          year: number
        }
        Update: {
          apply_end?: string | null
          apply_start?: string | null
          exam_end?: string | null
          exam_start?: string | null
          id?: never
          result_dates?: string[]
          round?: string
          sort_order?: number
          track_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedule_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "course_track"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry: {
        Row: {
          answer: string | null
          category: Database["public"]["Enums"]["inquiry_category"]
          content: string
          course_id: string | null
          created_at: string
          id: number
          name: string
          phone: string
          privacy_agreed: boolean
          status: Database["public"]["Enums"]["inquiry_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          answer?: string | null
          category: Database["public"]["Enums"]["inquiry_category"]
          content: string
          course_id?: string | null
          created_at?: string
          id?: never
          name: string
          phone: string
          privacy_agreed?: boolean
          status?: Database["public"]["Enums"]["inquiry_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string | null
          category?: Database["public"]["Enums"]["inquiry_category"]
          content?: string
          course_id?: string | null
          created_at?: string
          id?: never
          name?: string
          phone?: string
          privacy_agreed?: boolean
          status?: Database["public"]["Enums"]["inquiry_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      popup: {
        Row: {
          created_at: string
          end_at: string | null
          id: number
          image_url: string | null
          is_active: boolean
          link_url: string | null
          sort_order: number
          start_at: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          start_at?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          start_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      post: {
        Row: {
          category: Database["public"]["Enums"]["post_category"]
          content: string | null
          created_at: string
          id: number
          images: string[]
          is_deleted: boolean
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["post_category"]
          content?: string | null
          created_at?: string
          id?: never
          images?: string[]
          is_deleted?: boolean
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["post_category"]
          content?: string | null
          created_at?: string
          id?: never
          images?: string[]
          is_deleted?: boolean
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule: {
        Row: {
          course_id: string
          created_at: string
          id: number
          note: string | null
          open_date: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: never
          note?: string | null
          open_date?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: never
          note?: string | null
          open_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      site_section: {
        Row: {
          body: string[]
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string[]
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string[]
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          course_id: string | null
          created_at: string
          id: number
          name: string
          note: string | null
          phone: string
          privacy_agreed: boolean
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: never
          name: string
          note?: string | null
          phone: string
          privacy_agreed?: boolean
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: never
          name?: string
          note?: string | null
          phone?: string
          privacy_agreed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
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
      application_status: "신규" | "상담중" | "등록확인" | "보류"
      course_category: "집수리" | "건축목공입문" | "인테리어필름입문" | "기능사"
      funding_type: "경기도무료" | "국비지원" | "자부담"
      inquiry_category: "국비지원" | "과정문의" | "기타"
      inquiry_status: "답변대기" | "답변완료"
      post_category: "훈련사진" | "수강일지" | "수료식"
      recruit_status: "모집예정" | "모집중" | "마감"
      schedule_pattern: "평일주간" | "주말" | "단기"
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
      application_status: ["신규", "상담중", "등록확인", "보류"],
      course_category: ["집수리", "건축목공입문", "인테리어필름입문", "기능사"],
      funding_type: ["경기도무료", "국비지원", "자부담"],
      inquiry_category: ["국비지원", "과정문의", "기타"],
      inquiry_status: ["답변대기", "답변완료"],
      post_category: ["훈련사진", "수강일지", "수료식"],
      recruit_status: ["모집예정", "모집중", "마감"],
      schedule_pattern: ["평일주간", "주말", "단기"],
    },
  },
} as const

