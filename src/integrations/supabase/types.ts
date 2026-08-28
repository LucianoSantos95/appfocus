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
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          module: string
          record_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          module: string
          record_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          module?: string
          record_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_errors: {
        Row: {
          created_at: string
          id: string
          message: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          accepted: boolean
          accepted_at: string
          consent_type: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          consent_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          consent_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          open_count: number
          opened_at: string | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          open_count?: number
          opened_at?: string | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          open_count?: number
          opened_at?: string | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          id: number
          produto: string | null
          sessao: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: number
          produto?: string | null
          sessao?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          id?: number
          produto?: string | null
          sessao?: string | null
          tipo?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          avaliacao: number | null
          created_at: string | null
          email: string | null
          id: string
          mensagem: string
          nome: string | null
          pagina: string | null
          user_id: string | null
        }
        Insert: {
          avaliacao?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          mensagem: string
          nome?: string | null
          pagina?: string | null
          user_id?: string | null
        }
        Update: {
          avaliacao?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          mensagem?: string
          nome?: string | null
          pagina?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          atuacao: string | null
          created_at: string
          customizacao: string | null
          email: string
          empresa: string | null
          id: string
          nome: string
          origem: string | null
          produto: string | null
          site: string | null
          status: string
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          atuacao?: string | null
          created_at?: string
          customizacao?: string | null
          email: string
          empresa?: string | null
          id?: string
          nome: string
          origem?: string | null
          produto?: string | null
          site?: string | null
          status?: string
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          atuacao?: string | null
          created_at?: string
          customizacao?: string | null
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          origem?: string | null
          produto?: string | null
          site?: string | null
          status?: string
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          action: string
          enabled: boolean
          id: string
          module: string
          plan: string
        }
        Insert: {
          action: string
          enabled?: boolean
          id?: string
          module: string
          plan: string
        }
        Update: {
          action?: string
          enabled?: boolean
          id?: string
          module?: string
          plan?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          capa: string | null
          captura_lead: boolean
          created_at: string
          descricao: string | null
          destaque: boolean
          detalhes: string | null
          emoji: string | null
          gratuito: boolean
          id: string
          imagens: string[]
          link_destino: string | null
          nome: string
          ordem: number
          preco: number | null
          slug: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          capa?: string | null
          captura_lead?: boolean
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          detalhes?: string | null
          emoji?: string | null
          gratuito?: boolean
          id?: string
          imagens?: string[]
          link_destino?: string | null
          nome: string
          ordem?: number
          preco?: number | null
          slug: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          capa?: string | null
          captura_lead?: boolean
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          detalhes?: string | null
          emoji?: string | null
          gratuito?: boolean
          id?: string
          imagens?: string[]
          link_destino?: string | null
          nome?: string
          ordem?: number
          preco?: number | null
          slug?: string
          tipo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          canal_aquisicao: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          employee_count: string | null
          id: string
          last_sign_in_at: string | null
          onboarding_completed: boolean
          phone: string | null
          segment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          canal_aquisicao?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          employee_count?: string | null
          id?: string
          last_sign_in_at?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          segment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          canal_aquisicao?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          employee_count?: string | null
          id?: string
          last_sign_in_at?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          segment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          endpoint: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          endpoint?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          asaas_subscription_id: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          ends_at: string | null
          id: string
          last_payment_id: string | null
          payment_mode: string | null
          pending_renewal_url: string | null
          plan: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          ends_at?: string | null
          id?: string
          last_payment_id?: string | null
          payment_mode?: string | null
          pending_renewal_url?: string | null
          plan?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          ends_at?: string | null
          id?: string
          last_payment_id?: string | null
          payment_mode?: string | null
          pending_renewal_url?: string | null
          plan?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      vw_user_engagement: {
        Row: {
          actions_by_module: Json | null
          active_days_30d: number | null
          classificacao: string | null
          display_name: string | null
          first_seen_at: string | null
          last_active_at: string | null
          plan: string | null
          total_actions_30d: number | null
          total_actions_90d: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_login_rate_limit: { Args: { p_email: string }; Returns: Json }
      cleanup_old_client_errors: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_owner: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_module: string
          p_record_id?: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_login_attempt: { Args: { p_email: string }; Returns: undefined }
      update_integration_access_token: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_provider: string
          p_user_id: string
        }
        Returns: undefined
      }
      verify_cron_token: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
