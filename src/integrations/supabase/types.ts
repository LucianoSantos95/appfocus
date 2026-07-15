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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agenda_items: {
        Row: {
          created_at: string
          date: string
          id: string
          priority: string | null
          time: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          priority?: string | null
          time: string
          title: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          priority?: string | null
          time?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      bulletin_notes: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campanha_clientes: {
        Row: {
          campanha_id: string
          cliente_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campanha_id: string
          cliente_id: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          campanha_id?: string
          cliente_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          budget: number | null
          conversoes: number
          created_at: string
          end_date: string | null
          id: string
          leads_gerados: number
          name: string
          objective: string | null
          platforms: string | null
          receita_atribuida: number
          responsible: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          conversoes?: number
          created_at?: string
          end_date?: string | null
          id?: string
          leads_gerados?: number
          name: string
          objective?: string | null
          platforms?: string | null
          receita_atribuida?: number
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          budget?: number | null
          conversoes?: number
          created_at?: string
          end_date?: string | null
          id?: string
          leads_gerados?: number
          name?: string
          objective?: string | null
          platforms?: string | null
          receita_atribuida?: number
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cancellation_feedback: {
        Row: {
          comentario: string | null
          created_at: string
          email: string
          id: string
          motivo: string
          nome: string
          plano_anterior: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          email: string
          id?: string
          motivo: string
          nome: string
          plano_anterior: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          email?: string
          id?: string
          motivo?: string
          nome?: string
          plano_anterior?: string
          user_id?: string
        }
        Relationships: []
      }
      client_recordings: {
        Row: {
          audio_url: string
          cliente_id: string
          created_at: string
          duration_sec: number | null
          id: string
          next_actions: string | null
          status: string
          storage_path: string
          summary: string | null
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url: string
          cliente_id: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          next_actions?: string | null
          status?: string
          storage_path: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          audio_url?: string
          cliente_id?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          next_actions?: string | null
          status?: string
          storage_path?: string
          summary?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          analisado_em: string | null
          anexo_url: string | null
          classificacao: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          meeting_notes: string | null
          nome: string
          palavras_chave: string[] | null
          potencial: string | null
          prioridade_contato: string | null
          proxima_acao_sugerida: string | null
          segmento: string | null
          status: string
          telefone: string | null
          tipo_contrato: string | null
          ultima_interacao: string | null
          updated_at: string
          user_id: string | null
          valor_total: number | null
        }
        Insert: {
          analisado_em?: string | null
          anexo_url?: string | null
          classificacao?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          meeting_notes?: string | null
          nome: string
          palavras_chave?: string[] | null
          potencial?: string | null
          prioridade_contato?: string | null
          proxima_acao_sugerida?: string | null
          segmento?: string | null
          status?: string
          telefone?: string | null
          tipo_contrato?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          user_id?: string | null
          valor_total?: number | null
        }
        Update: {
          analisado_em?: string | null
          anexo_url?: string | null
          classificacao?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          meeting_notes?: string | null
          nome?: string
          palavras_chave?: string[] | null
          potencial?: string | null
          prioridade_contato?: string | null
          proxima_acao_sugerida?: string | null
          segmento?: string | null
          status?: string
          telefone?: string | null
          tipo_contrato?: string | null
          ultima_interacao?: string | null
          updated_at?: string
          user_id?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          created_at: string
          department: string | null
          documents: Json | null
          email: string | null
          id: string
          manager: string | null
          name: string
          phone: string | null
          role: string | null
          salary: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          manager?: string | null
          name: string
          phone?: string | null
          role?: string | null
          salary?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          manager?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          salary?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      contas_bancarias: {
        Row: {
          balance: number
          created_at: string
          id: string
          institution: string | null
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          institution?: string | null
          name: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          institution?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conteudos: {
        Row: {
          approval_feedback: string | null
          approval_status: string
          created_at: string
          description: string | null
          id: string
          platform: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_feedback?: string | null
          approval_status?: string
          created_at?: string
          description?: string | null
          id?: string
          platform?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          approval_feedback?: string | null
          approval_status?: string
          created_at?: string
          description?: string | null
          id?: string
          platform?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          created_at: string
          download_expires_at: string | null
          download_url: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_expires_at?: string | null
          download_url?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_expires_at?: string | null
          download_url?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      email_automation_log: {
        Row: {
          automation_type: string
          created_at: string
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string
          sequence_step: number
          status: string
          template_name: string
          user_id: string
        }
        Insert: {
          automation_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string
          sequence_step?: number
          status?: string
          template_name: string
          user_id: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string
          sequence_step?: number
          status?: string
          template_name?: string
          user_id?: string
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
      import_history: {
        Row: {
          created_at: string
          error_records: number
          file_name: string | null
          id: string
          imported_records: number
          metadata: Json | null
          module: string
          status: string
          total_records: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_records?: number
          file_name?: string | null
          id?: string
          imported_records?: number
          metadata?: Json | null
          module: string
          status?: string
          total_records?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          error_records?: number
          file_name?: string | null
          id?: string
          imported_records?: number
          metadata?: Json | null
          module?: string
          status?: string
          total_records?: number
          user_id?: string
        }
        Relationships: []
      }
      invite_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          team_member_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          team_member_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          team_member_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_tokens_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
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
      onboarding_progress: {
        Row: {
          completed_at: string
          id: string
          step_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          step_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_sessions: {
        Row: {
          achievements: Json
          completed_at: string | null
          completed_modules: Json
          coupon_code: string | null
          coupon_expires_at: string | null
          coupon_shown: boolean
          created_at: string
          current_step: string
          id: string
          last_reengagement_step: number
          priority_pain: string | null
          segment: string | null
          started_at: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          achievements?: Json
          completed_at?: string | null
          completed_modules?: Json
          coupon_code?: string | null
          coupon_expires_at?: string | null
          coupon_shown?: boolean
          created_at?: string
          current_step?: string
          id?: string
          last_reengagement_step?: number
          priority_pain?: string | null
          segment?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          achievements?: Json
          completed_at?: string | null
          completed_modules?: Json
          coupon_code?: string | null
          coupon_expires_at?: string | null
          coupon_shown?: boolean
          created_at?: string
          current_step?: string
          id?: string
          last_reengagement_step?: number
          priority_pain?: string | null
          segment?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      plan_change_history: {
        Row: {
          change_type: string
          changed_at: string
          created_at: string
          from_plan: string | null
          id: string
          metadata: Json | null
          stripe_subscription_id: string | null
          to_plan: string
          user_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          created_at?: string
          from_plan?: string | null
          id?: string
          metadata?: Json | null
          stripe_subscription_id?: string | null
          to_plan: string
          user_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          created_at?: string
          from_plan?: string | null
          id?: string
          metadata?: Json | null
          stripe_subscription_id?: string | null
          to_plan?: string
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
      processos: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          id: string
          name: string
          owner: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name: string
          owner?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name?: string
          owner?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
      projetos: {
        Row: {
          attachments: Json | null
          budget: number | null
          cliente_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: string | null
          responsible: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          budget?: number | null
          cliente_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          attachments?: Json | null
          budget?: number | null
          cliente_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
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
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_granted: boolean
          status: string
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_granted?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_granted?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      relatorio_contatos: {
        Row: {
          canais_preferidos: string[] | null
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canais_preferidos?: string[] | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          canais_preferidos?: string[] | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relatorios_enviados: {
        Row: {
          canal: string
          created_at: string
          destinatario: string
          destinatario_nome: string | null
          error_message: string | null
          formato: string
          id: string
          metadata: Json | null
          modulo: string
          pdf_url: string | null
          secao: string
          status: string
          user_id: string
        }
        Insert: {
          canal: string
          created_at?: string
          destinatario: string
          destinatario_nome?: string | null
          error_message?: string | null
          formato: string
          id?: string
          metadata?: Json | null
          modulo: string
          pdf_url?: string | null
          secao: string
          status?: string
          user_id?: string
        }
        Update: {
          canal?: string
          created_at?: string
          destinatario?: string
          destinatario_nome?: string | null
          error_message?: string | null
          formato?: string
          id?: string
          metadata?: Json | null
          modulo?: string
          pdf_url?: string | null
          secao?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_touchpoints: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          outcome: string | null
          reason: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          reason: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          processed_at: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id: string
          payload?: Json | null
          processed_at?: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      subscriber_extras: {
        Row: {
          canal_aquisicao: string | null
          created_at: string
          data_conversao: string | null
          id: string
          ltv: number | null
          notas: string | null
          origem: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canal_aquisicao?: string | null
          created_at?: string
          data_conversao?: string | null
          id?: string
          ltv?: number | null
          notas?: string | null
          origem?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canal_aquisicao?: string | null
          created_at?: string
          data_conversao?: string | null
          id?: string
          ltv?: number | null
          notas?: string | null
          origem?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriber_followups: {
        Row: {
          ai_rationale: string | null
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          id: string
          next_followup_at: string | null
          recipient_email: string
          sent_at: string | null
          sequence_step: number
          status: string
          subject: string
          suggested_next_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_rationale?: string | null
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_followup_at?: string | null
          recipient_email: string
          sent_at?: string | null
          sequence_step?: number
          status?: string
          subject: string
          suggested_next_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_rationale?: string | null
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          next_followup_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          sequence_step?: number
          status?: string
          subject?: string
          suggested_next_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
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
      tarefas: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          responsible: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          responsible?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          responsible?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_member_permissions: {
        Row: {
          id: string
          page_slug: string
          team_member_id: string
        }
        Insert: {
          id?: string
          page_slug: string
          team_member_id: string
        }
        Update: {
          id?: string
          page_slug?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_permissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          member_email: string
          member_user_id: string | null
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_email: string
          member_user_id?: string | null
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_email?: string
          member_user_id?: string | null
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          bank_account_id: string | null
          category: string | null
          client: string | null
          created_at: string
          date: string | null
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          provider: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          bank_account_id?: string | null
          category?: string | null
          client?: string | null
          created_at?: string
          date?: string | null
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          provider?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          value: number
        }
        Update: {
          bank_account_id?: string | null
          category?: string | null
          client?: string | null
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          provider?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "contas_bancarias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_funnel_stage: {
        Row: {
          activated_at: string | null
          churn_at: string | null
          converted_at: string | null
          created_at: string
          hot_at: string | null
          last_activity_at: string | null
          last_computed_at: string
          notes: string | null
          score: number
          stage: Database["public"]["Enums"]["funnel_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          churn_at?: string | null
          converted_at?: string | null
          created_at?: string
          hot_at?: string | null
          last_activity_at?: string | null
          last_computed_at?: string
          notes?: string | null
          score?: number
          stage?: Database["public"]["Enums"]["funnel_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          churn_at?: string | null
          converted_at?: string | null
          created_at?: string
          hot_at?: string | null
          last_activity_at?: string | null
          last_computed_at?: string
          notes?: string | null
          score?: number
          stage?: Database["public"]["Enums"]["funnel_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scopes: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scopes?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scopes?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          milestone_key: string
          reached_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          milestone_key: string
          reached_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          milestone_key?: string
          reached_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_widgets: Json
          id: string
          language: string
          notify_email_product_updates: boolean
          notify_email_weekly_report: boolean
          notify_inapp_clientes: boolean
          notify_inapp_financeiro: boolean
          notify_inapp_tasks: boolean
          sidebar_collapsed: boolean
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_widgets?: Json
          id?: string
          language?: string
          notify_email_product_updates?: boolean
          notify_email_weekly_report?: boolean
          notify_inapp_clientes?: boolean
          notify_inapp_financeiro?: boolean
          notify_inapp_tasks?: boolean
          sidebar_collapsed?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_widgets?: Json
          id?: string
          language?: string
          notify_email_product_updates?: boolean
          notify_email_weekly_report?: boolean
          notify_inapp_clientes?: boolean
          notify_inapp_financeiro?: boolean
          notify_inapp_tasks?: boolean
          sidebar_collapsed?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
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
      whatsapp_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          notify_clientes: boolean
          notify_financeiro: boolean
          notify_tarefas: boolean
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          notify_clientes?: boolean
          notify_financeiro?: boolean
          notify_tarefas?: boolean
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          notify_clientes?: boolean
          notify_financeiro?: boolean
          notify_tarefas?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_integrations_status: {
        Row: {
          connected: boolean | null
          connected_at: string | null
          email: string | null
          provider: string | null
          user_id: string | null
        }
        Insert: {
          connected?: never
          connected_at?: string | null
          email?: never
          provider?: string | null
          user_id?: string | null
        }
        Update: {
          connected?: never
          connected_at?: string | null
          email?: never
          provider?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vw_assinantes: {
        Row: {
          assinatura_fim: string | null
          assinatura_inicio: string | null
          cadastro_em: string | null
          canal_aquisicao: string | null
          company_name: string | null
          data_conversao: string | null
          display_name: string | null
          employee_count: string | null
          ltv: number | null
          notas: string | null
          origem: string | null
          phone: string | null
          plano: string | null
          segment: string | null
          status_assinatura: string | null
          stripe_customer_id: string | null
          tags: string[] | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_funnel_summary: {
        Row: {
          ativos_7d: number | null
          score_medio: number | null
          stage: Database["public"]["Enums"]["funnel_stage"] | null
          usuarios: number | null
        }
        Relationships: []
      }
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
      cleanup_rate_limits: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_integration_tokens: {
        Args: { p_provider: string; p_user_id: string }
        Returns: {
          access_token: string
          id: string
          refresh_token: string
          token_expires_at: string
        }[]
      }
      get_user_engagement: {
        Args: never
        Returns: {
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
        }[]
        SetofOptions: {
          from: "*"
          to: "vw_user_engagement"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      recompute_funnel_stage: {
        Args: { p_user_id: string }
        Returns: {
          activated_at: string | null
          churn_at: string | null
          converted_at: string | null
          created_at: string
          hot_at: string | null
          last_activity_at: string | null
          last_computed_at: string
          notes: string | null
          score: number
          stage: Database["public"]["Enums"]["funnel_stage"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_funnel_stage"
          isOneToOne: true
          isSetofReturn: false
        }
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
      upsert_integration: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_metadata?: Json
          p_provider: string
          p_refresh_token: string
          p_scopes?: string
          p_user_id: string
        }
        Returns: undefined
      }
      verify_cron_token: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      funnel_stage: "novo" | "ativado" | "quente" | "convertido" | "churn"
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
      funnel_stage: ["novo", "ativado", "quente", "convertido", "churn"],
    },
  },
} as const
