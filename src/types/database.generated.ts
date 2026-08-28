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
      account_mappings: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          gl_account_id: string
          id: string
          mapping_key: string
          organization_id: string
          payment_account_id: string | null
          priority: number
          product_category_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          gl_account_id: string
          id?: string
          mapping_key: string
          organization_id: string
          payment_account_id?: string | null
          priority?: number
          product_category_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          gl_account_id?: string
          id?: string
          mapping_key?: string
          organization_id?: string
          payment_account_id?: string | null
          priority?: number
          product_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_mappings_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_gl_account_id_fkey"
            columns: ["organization_id", "gl_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_gl_account_id_fkey"
            columns: ["organization_id", "gl_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "account_mappings_organization_id_product_category_id_fkey"
            columns: ["organization_id", "product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      accounting_events: {
        Row: {
          attempts: number
          created_at: string
          error_code: string | null
          event_date: string
          id: string
          journal_id: string | null
          organization_id: string
          payload: Json
          posting_version: number
          processed_at: string | null
          source_id: string
          source_module: string
          source_type: string
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_code?: string | null
          event_date: string
          id?: string
          journal_id?: string | null
          organization_id: string
          payload?: Json
          posting_version?: number
          processed_at?: string | null
          source_id: string
          source_module: string
          source_type: string
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_code?: string | null
          event_date?: string
          id?: string
          journal_id?: string | null
          organization_id?: string
          payload?: Json
          posting_version?: number
          processed_at?: string | null
          source_id?: string
          source_module?: string
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_events_journal_fk"
            columns: ["organization_id", "journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "accounting_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          organization_id: string
          start_date: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          organization_id: string
          start_date: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          organization_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_settings: {
        Row: {
          accounting_method: string
          activation_date: string | null
          base_currency: string
          closed_period_policy: string
          created_at: string
          current_period_id: string | null
          fiscal_year_start_month: number
          organization_id: string
          retained_earnings_account_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accounting_method?: string
          activation_date?: string | null
          base_currency: string
          closed_period_policy?: string
          created_at?: string
          current_period_id?: string | null
          fiscal_year_start_month?: number
          organization_id: string
          retained_earnings_account_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accounting_method?: string
          activation_date?: string | null
          base_currency?: string
          closed_period_policy?: string
          created_at?: string
          current_period_id?: string | null
          fiscal_year_start_month?: number
          organization_id?: string
          retained_earnings_account_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_settings_period_fk"
            columns: ["organization_id", "current_period_id"]
            isOneToOne: false
            referencedRelation: "accounting_periods"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "accounting_settings_retained_fk"
            columns: ["organization_id", "retained_earnings_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "accounting_settings_retained_fk"
            columns: ["organization_id", "retained_earnings_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
        ]
      }
      approval_actions: {
        Row: {
          acted_at: string
          action: string
          actor_id: string
          approval_request_id: string
          comments: string | null
          id: string
          organization_id: string
          step_order: number
        }
        Insert: {
          acted_at?: string
          action: string
          actor_id: string
          approval_request_id: string
          comments?: string | null
          id?: string
          organization_id: string
          step_order: number
        }
        Update: {
          acted_at?: string
          action?: string
          actor_id?: string
          approval_request_id?: string
          comments?: string | null
          id?: string
          organization_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_organization_id_approval_request_id_fkey"
            columns: ["organization_id", "approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      approval_policies: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          currency: string
          document_type: string
          id: string
          is_active: boolean
          minimum_amount: number
          name: string
          organization_id: string
          prohibit_self_approval: boolean
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          currency: string
          document_type: string
          id?: string
          is_active?: boolean
          minimum_amount?: number
          name: string
          organization_id: string
          prohibit_self_approval?: boolean
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          document_type?: string
          id?: string
          is_active?: boolean
          minimum_amount?: number
          name?: string
          organization_id?: string
          prohibit_self_approval?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_policies_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "approval_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          amount: number
          branch_id: string | null
          currency: string
          current_step: number
          document_hash: string
          document_id: string
          document_type: string
          finalized_at: string | null
          id: string
          organization_id: string
          policy_id: string | null
          requester_id: string
          status: string
          submitted_at: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          currency: string
          current_step?: number
          document_hash: string
          document_id: string
          document_type: string
          finalized_at?: string | null
          id?: string
          organization_id: string
          policy_id?: string | null
          requester_id: string
          status?: string
          submitted_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          currency?: string
          current_step?: number
          document_hash?: string
          document_id?: string
          document_type?: string
          finalized_at?: string | null
          id?: string
          organization_id?: string
          policy_id?: string | null
          requester_id?: string
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "approval_requests_organization_id_policy_id_fkey"
            columns: ["organization_id", "policy_id"]
            isOneToOne: false
            referencedRelation: "approval_policies"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approvals_required: number
          id: string
          organization_id: string
          permission_code: string
          policy_id: string
          step_order: number
        }
        Insert: {
          approvals_required?: number
          id?: string
          organization_id: string
          permission_code: string
          policy_id: string
          step_order: number
        }
        Update: {
          approvals_required?: number
          id?: string
          organization_id?: string
          permission_code?: string
          policy_id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_organization_id_policy_id_fkey"
            columns: ["organization_id", "policy_id"]
            isOneToOne: false
            referencedRelation: "approval_policies"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_statement_imports: {
        Row: {
          column_mapping: Json
          file_name: string
          id: string
          imported_at: string
          imported_by: string
          organization_id: string
          payment_account_id: string
        }
        Insert: {
          column_mapping: Json
          file_name: string
          id?: string
          imported_at?: string
          imported_by: string
          organization_id: string
          payment_account_id: string
        }
        Update: {
          column_mapping?: Json
          file_name?: string
          id?: string
          imported_at?: string
          imported_by?: string
          organization_id?: string
          payment_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_imports_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "bank_statement_imports_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      bank_statement_lines: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          import_id: string
          matched_at: string | null
          matched_by: string | null
          matched_source_id: string | null
          matched_source_type: string | null
          organization_id: string
          payment_account_id: string
          reference: string | null
          status: string
          transaction_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          import_id: string
          matched_at?: string | null
          matched_by?: string | null
          matched_source_id?: string | null
          matched_source_type?: string | null
          organization_id: string
          payment_account_id: string
          reference?: string | null
          status?: string
          transaction_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          import_id?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_source_id?: string | null
          matched_source_type?: string | null
          organization_id?: string
          payment_account_id?: string
          reference?: string | null
          status?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statement_lines_organization_id_import_id_fkey"
            columns: ["organization_id", "import_id"]
            isOneToOne: false
            referencedRelation: "bank_statement_imports"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "bank_statement_lines_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "bank_statement_lines_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      bank_transfers: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string
          created_by: string
          currency: string
          destination_payment_account_id: string
          exchange_rate_snapshot: number
          fee_amount: number
          id: string
          journal_id: string | null
          organization_id: string
          posted_at: string | null
          reference: string | null
          source_payment_account_id: string
          status: string
          transfer_date: string
          transfer_number: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string
          created_by: string
          currency: string
          destination_payment_account_id: string
          exchange_rate_snapshot?: number
          fee_amount?: number
          id?: string
          journal_id?: string | null
          organization_id: string
          posted_at?: string | null
          reference?: string | null
          source_payment_account_id: string
          status?: string
          transfer_date: string
          transfer_number: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          destination_payment_account_id?: string
          exchange_rate_snapshot?: number
          fee_amount?: number
          id?: string
          journal_id?: string | null
          organization_id?: string
          posted_at?: string | null
          reference?: string | null
          source_payment_account_id?: string
          status?: string
          transfer_date?: string
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_destination_payment_account_fkey"
            columns: ["organization_id", "destination_payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_destination_payment_account_fkey"
            columns: ["organization_id", "destination_payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_journal_id_fkey"
            columns: ["organization_id", "journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_source_payment_account_id_fkey"
            columns: ["organization_id", "source_payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "bank_transfers_organization_id_source_payment_account_id_fkey"
            columns: ["organization_id", "source_payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      branches: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          business_id: string
          city: string | null
          code: string
          country_code: string | null
          created_at: string
          created_by: string
          currency_code: string | null
          default_price_list_id: string | null
          default_warehouse_id: string | null
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          region: string | null
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          business_id: string
          city?: string | null
          code: string
          country_code?: string | null
          created_at?: string
          created_by: string
          currency_code?: string | null
          default_price_list_id?: string | null
          default_warehouse_id?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          status?: string
          timezone: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          business_id?: string
          city?: string | null
          code?: string
          country_code?: string | null
          created_at?: string
          created_by?: string
          currency_code?: string | null
          default_price_list_id?: string | null
          default_warehouse_id?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "branches_default_price_list_fk"
            columns: ["organization_id", "default_price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "branches_default_warehouse_fk"
            columns: ["organization_id", "default_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: string
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          trading_name: string | null
          updated_at: string
        }
        Insert: {
          business_type: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          status?: string
          trading_name?: string | null
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          trading_name?: string | null
          updated_at?: string
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
      catalogue_import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_rows: number
          file_name: string
          id: string
          organization_id: string
          status: string
          total_rows: number
          valid_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_rows: number
          file_name: string
          id?: string
          organization_id: string
          status?: string
          total_rows: number
          valid_rows: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_rows?: number
          file_name?: string
          id?: string
          organization_id?: string
          status?: string
          total_rows?: number
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_import_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_type: string
          city: string | null
          country_code: string
          created_at: string
          customer_id: string
          id: string
          is_default_billing: boolean
          is_default_delivery: boolean
          line_1: string
          line_2: string | null
          organization_id: string
          postal_code: string | null
          state_region: string | null
          updated_at: string
        }
        Insert: {
          address_type: string
          city?: string | null
          country_code: string
          created_at?: string
          customer_id: string
          id?: string
          is_default_billing?: boolean
          is_default_delivery?: boolean
          line_1: string
          line_2?: string | null
          organization_id: string
          postal_code?: string | null
          state_region?: string | null
          updated_at?: string
        }
        Update: {
          address_type?: string
          city?: string | null
          country_code?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default_billing?: boolean
          is_default_delivery?: boolean
          line_1?: string
          line_2?: string | null
          organization_id?: string
          postal_code?: string | null
          state_region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_addresses_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          id: string
          is_billing: boolean
          is_delivery: boolean
          is_primary: boolean
          is_purchasing: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          email?: string | null
          id?: string
          is_billing?: boolean
          is_delivery?: boolean
          is_primary?: boolean
          is_purchasing?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          id?: string
          is_billing?: boolean
          is_delivery?: boolean
          is_primary?: boolean
          is_purchasing?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_contacts_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_credit_allocations: {
        Row: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at: string
          created_by: string
          credit_note_id: string
          id: string
          invoice_id: string
          organization_id: string
        }
        Insert: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at?: string
          created_by: string
          credit_note_id: string
          id?: string
          invoice_id: string
          organization_id: string
        }
        Update: {
          allocated_amount?: number
          allocated_base_amount?: number
          allocation_date?: string
          created_at?: string
          created_by?: string
          credit_note_id?: string
          id?: string
          invoice_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_allocations_organization_id_credit_note_id_fkey"
            columns: ["organization_id", "credit_note_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_notes"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_allocations_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_allocations_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_credit_notes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_currency_total: number
          branch_id: string
          created_at: string
          created_by: string
          credit_date: string
          credit_note_number: string
          currency: string
          customer_id: string
          customer_invoice_id: string | null
          exchange_rate: number
          id: string
          idempotency_key: string
          issued_at: string | null
          issued_by: string | null
          organization_id: string
          reason: string
          refund_disposition: string
          request_hash: string
          sales_return_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency_total: number
          branch_id: string
          created_at?: string
          created_by: string
          credit_date: string
          credit_note_number: string
          currency: string
          customer_id: string
          customer_invoice_id?: string | null
          exchange_rate: number
          id?: string
          idempotency_key: string
          issued_at?: string | null
          issued_by?: string | null
          organization_id: string
          reason: string
          refund_disposition?: string
          request_hash: string
          sales_return_id?: string | null
          status?: string
          subtotal: number
          tax?: number
          total: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency_total?: number
          branch_id?: string
          created_at?: string
          created_by?: string
          credit_date?: string
          credit_note_number?: string
          currency?: string
          customer_id?: string
          customer_invoice_id?: string | null
          exchange_rate?: number
          id?: string
          idempotency_key?: string
          issued_at?: string | null
          issued_by?: string | null
          organization_id?: string
          reason?: string
          refund_disposition?: string
          request_hash?: string
          sales_return_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_notes_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_notes_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_credit_notes_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_notes_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_notes_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_credit_notes_organization_id_sales_return_id_fkey"
            columns: ["organization_id", "sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          document_type: string
          file_name: string
          id: string
          media_type: string
          organization_id: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id: string
          document_type: string
          file_name: string
          id?: string
          media_type: string
          organization_id: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          document_type?: string
          file_name?: string
          id?: string
          media_type?: string
          organization_id?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_documents_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_invoice_fulfillments: {
        Row: {
          fulfilment_id: string
          invoice_id: string
          organization_id: string
        }
        Insert: {
          fulfilment_id: string
          invoice_id: string
          organization_id: string
        }
        Update: {
          fulfilment_id?: string
          invoice_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_fulfillments_organization_id_fulfilment_i_fkey"
            columns: ["organization_id", "fulfilment_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_fulfillments_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_fulfillments_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_invoice_lines: {
        Row: {
          conversion_snapshot: number
          description_snapshot: string
          discount: number
          id: string
          invoice_id: string
          line_total: number
          organization_id: string
          product_variant_id: string | null
          quantity: number
          sales_fulfillment_line_id: string | null
          sales_order_line_id: string | null
          sku_snapshot: string | null
          tax: number
          unit_price: number
        }
        Insert: {
          conversion_snapshot: number
          description_snapshot: string
          discount?: number
          id?: string
          invoice_id: string
          line_total: number
          organization_id: string
          product_variant_id?: string | null
          quantity: number
          sales_fulfillment_line_id?: string | null
          sales_order_line_id?: string | null
          sku_snapshot?: string | null
          tax?: number
          unit_price: number
        }
        Update: {
          conversion_snapshot?: number
          description_snapshot?: string
          discount?: number
          id?: string
          invoice_id?: string
          line_total?: number
          organization_id?: string
          product_variant_id?: string | null
          quantity?: number
          sales_fulfillment_line_id?: string | null
          sales_order_line_id?: string | null
          sku_snapshot?: string | null
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_lines_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_organization_id_invoice_id_fkey"
            columns: ["organization_id", "invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_organization_id_sales_fulfillment_l_fkey"
            columns: ["organization_id", "sales_fulfillment_line_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillment_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_organization_id_sales_order_line_id_fkey"
            columns: ["organization_id", "sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "sales_order_lines"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          amount_paid_base: number
          base_currency: string
          base_currency_total: number
          billing_address_snapshot: Json | null
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          credit_note_total_base: number
          currency: string
          customer_id: string
          customer_name_snapshot: string
          discount: number
          due_date: string | null
          exchange_rate: number
          id: string
          idempotency_key: string
          invoice_date: string
          invoice_number: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          organization_id: string
          payment_terms: string | null
          request_hash: string
          sales_order_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid_base?: number
          base_currency: string
          base_currency_total: number
          billing_address_snapshot?: Json | null
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          credit_note_total_base?: number
          currency: string
          customer_id: string
          customer_name_snapshot: string
          discount?: number
          due_date?: string | null
          exchange_rate: number
          id?: string
          idempotency_key: string
          invoice_date: string
          invoice_number: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          request_hash: string
          sales_order_id?: string | null
          status?: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          amount_paid_base?: number
          base_currency?: string
          base_currency_total?: number
          billing_address_snapshot?: Json | null
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          credit_note_total_base?: number
          currency?: string
          customer_id?: string
          customer_name_snapshot?: string
          discount?: number
          due_date?: string | null
          exchange_rate?: number
          id?: string
          idempotency_key?: string
          invoice_date?: string
          invoice_number?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          request_hash?: string
          sales_order_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_refunds: {
        Row: {
          amount: number
          approval_request_id: string | null
          approved_by: string | null
          base_currency_amount: number
          branch_id: string
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          exchange_rate_snapshot: number
          external_reference: string | null
          id: string
          idempotency_key: string
          organization_id: string
          payment_method_id: string
          posted_at: string | null
          processed_by: string | null
          reason: string
          refund_date: string
          refund_number: string
          request_hash: string
          settlement_account_id: string
          source_credit_note_id: string | null
          source_payment_id: string | null
          status: string
        }
        Insert: {
          amount: number
          approval_request_id?: string | null
          approved_by?: string | null
          base_currency_amount: number
          branch_id: string
          created_at?: string
          created_by: string
          currency: string
          customer_id: string
          exchange_rate_snapshot: number
          external_reference?: string | null
          id?: string
          idempotency_key: string
          organization_id: string
          payment_method_id: string
          posted_at?: string | null
          processed_by?: string | null
          reason: string
          refund_date: string
          refund_number: string
          request_hash: string
          settlement_account_id: string
          source_credit_note_id?: string | null
          source_payment_id?: string | null
          status: string
        }
        Update: {
          amount?: number
          approval_request_id?: string | null
          approved_by?: string | null
          base_currency_amount?: number
          branch_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string
          exchange_rate_snapshot?: number
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string
          payment_method_id?: string
          posted_at?: string | null
          processed_by?: string | null
          reason?: string
          refund_date?: string
          refund_number?: string
          request_hash?: string
          settlement_account_id?: string
          source_credit_note_id?: string | null
          source_payment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_refunds_organization_id_approval_request_id_fkey"
            columns: ["organization_id", "approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_payment_method_id_fkey"
            columns: ["organization_id", "payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_settlement_account_id_fkey"
            columns: ["organization_id", "settlement_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_settlement_account_id_fkey"
            columns: ["organization_id", "settlement_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_source_credit_note_id_fkey"
            columns: ["organization_id", "source_credit_note_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_notes"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_source_payment_id_fkey"
            columns: ["organization_id", "source_payment_id"]
            isOneToOne: false
            referencedRelation: "customer_unapplied_credits"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_source_payment_id_fkey"
            columns: ["organization_id", "source_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_refunds_organization_id_source_payment_id_fkey"
            columns: ["organization_id", "source_payment_id"]
            isOneToOne: false
            referencedRelation: "supplier_advances"
            referencedColumns: ["organization_id", "payment_id"]
          },
        ]
      }
      customers: {
        Row: {
          alternate_phone: string | null
          created_at: string
          created_by: string
          credit_limit: number
          credit_status: string
          customer_code: string
          customer_type: string
          default_currency: string
          default_payment_terms: string | null
          default_price_list_id: string | null
          display_name: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          legal_name: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          registration_number: string | null
          sales_rep_id: string | null
          status: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          alternate_phone?: string | null
          created_at?: string
          created_by: string
          credit_limit?: number
          credit_status?: string
          customer_code: string
          customer_type: string
          default_currency: string
          default_payment_terms?: string | null
          default_price_list_id?: string | null
          display_name: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          legal_name?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          registration_number?: string | null
          sales_rep_id?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          alternate_phone?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number
          credit_status?: string
          customer_code?: string
          customer_type?: string
          default_currency?: string
          default_payment_terms?: string | null
          default_price_list_id?: string | null
          display_name?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          legal_name?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          registration_number?: string | null
          sales_rep_id?: string | null
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_default_price_list_id_fkey"
            columns: ["organization_id", "default_price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_documents: {
        Row: {
          created_at: string
          document_type: string
          expense_id: string
          file_name: string
          id: string
          mime_type: string
          organization_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expense_id: string
          file_name: string
          id?: string
          mime_type: string
          organization_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expense_id?: string
          file_name?: string
          id?: string
          mime_type?: string
          organization_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_documents_organization_id_expense_id_fkey"
            columns: ["organization_id", "expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "expense_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approval_request_id: string | null
          approved_by: string | null
          branch_id: string
          created_at: string
          created_by: string
          currency: string
          description: string
          exchange_rate_snapshot: number
          expense_account_id: string
          expense_date: string
          expense_number: string
          id: string
          journal_id: string | null
          organization_id: string
          payee: string
          payment_account_id: string | null
          payment_terms: string
          posted_at: string | null
          reference: string | null
          status: string
          submitted_by: string | null
          tax_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          approval_request_id?: string | null
          approved_by?: string | null
          branch_id: string
          created_at?: string
          created_by: string
          currency: string
          description: string
          exchange_rate_snapshot?: number
          expense_account_id: string
          expense_date: string
          expense_number: string
          id?: string
          journal_id?: string | null
          organization_id: string
          payee: string
          payment_account_id?: string | null
          payment_terms?: string
          posted_at?: string | null
          reference?: string | null
          status?: string
          submitted_by?: string | null
          tax_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_request_id?: string | null
          approved_by?: string | null
          branch_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string
          exchange_rate_snapshot?: number
          expense_account_id?: string
          expense_date?: string
          expense_number?: string
          id?: string
          journal_id?: string | null
          organization_id?: string
          payee?: string
          payment_account_id?: string | null
          payment_terms?: string
          posted_at?: string | null
          reference?: string | null
          status?: string
          submitted_by?: string | null
          tax_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_approval_request_id_fkey"
            columns: ["organization_id", "approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "expenses_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "expenses_organization_id_expense_account_id_fkey"
            columns: ["organization_id", "expense_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "expenses_organization_id_expense_account_id_fkey"
            columns: ["organization_id", "expense_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_journal_id_fkey"
            columns: ["organization_id", "journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "expenses_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "expenses_organization_id_payment_account_id_fkey"
            columns: ["organization_id", "payment_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      gl_accounts: {
        Row: {
          account_code: string
          account_type: string
          allow_manual_posting: boolean
          control_type: string | null
          created_at: string
          created_by: string
          currency_restriction: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          normal_balance: string
          organization_id: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_type: string
          allow_manual_posting?: boolean
          control_type?: string | null
          created_at?: string
          created_by: string
          currency_restriction?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          normal_balance: string
          organization_id: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_type?: string
          allow_manual_posting?: boolean
          control_type?: string | null
          created_at?: string
          created_by?: string
          currency_restriction?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          normal_balance?: string
          organization_id?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gl_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_accounts_organization_id_parent_account_id_fkey"
            columns: ["organization_id", "parent_account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "gl_accounts_organization_id_parent_account_id_fkey"
            columns: ["organization_id", "parent_account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
        ]
      }
      goods_receipt_lines: {
        Row: {
          accepted_base_quantity: number
          accepted_quantity: number
          allocated_landed_cost_base: number
          conversion_snapshot: number
          damage_reason: string | null
          damaged_quantity: number
          delivered_quantity: number
          goods_receipt_id: string
          id: string
          inspection_status: string
          inventory_unit_cost_base: number
          notes: string | null
          ordered_quantity_snapshot: number
          organization_id: string
          packaging_id: string
          previously_accepted_base_quantity: number
          product_variant_id: string
          purchase_order_line_id: string
          rejected_quantity: number
          rejection_reason: string | null
          unit_purchase_cost_base: number
        }
        Insert: {
          accepted_base_quantity: number
          accepted_quantity: number
          allocated_landed_cost_base?: number
          conversion_snapshot: number
          damage_reason?: string | null
          damaged_quantity?: number
          delivered_quantity: number
          goods_receipt_id: string
          id?: string
          inspection_status: string
          inventory_unit_cost_base: number
          notes?: string | null
          ordered_quantity_snapshot: number
          organization_id: string
          packaging_id: string
          previously_accepted_base_quantity: number
          product_variant_id: string
          purchase_order_line_id: string
          rejected_quantity?: number
          rejection_reason?: string | null
          unit_purchase_cost_base: number
        }
        Update: {
          accepted_base_quantity?: number
          accepted_quantity?: number
          allocated_landed_cost_base?: number
          conversion_snapshot?: number
          damage_reason?: string | null
          damaged_quantity?: number
          delivered_quantity?: number
          goods_receipt_id?: string
          id?: string
          inspection_status?: string
          inventory_unit_cost_base?: number
          notes?: string | null
          ordered_quantity_snapshot?: number
          organization_id?: string
          packaging_id?: string
          previously_accepted_base_quantity?: number
          product_variant_id?: string
          purchase_order_line_id?: string
          rejected_quantity?: number
          rejection_reason?: string | null
          unit_purchase_cost_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_lines_organization_id_goods_receipt_id_fkey"
            columns: ["organization_id", "goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipt_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipt_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipt_lines_organization_id_purchase_order_line_id_fkey"
            columns: ["organization_id", "purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipt_lines_organization_id_purchase_order_line_id_fkey"
            columns: ["organization_id", "purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_outstanding"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          grn_number: string
          id: string
          idempotency_key: string
          inventory_transaction_id: string | null
          notes: string | null
          organization_id: string
          posted_at: string | null
          purchase_order_id: string
          received_at: string
          received_by: string
          status: string
          storage_location_id: string
          supplier_delivery_note: string | null
          supplier_id: string
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          grn_number: string
          id?: string
          idempotency_key: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          purchase_order_id: string
          received_at: string
          received_by: string
          status?: string
          storage_location_id: string
          supplier_delivery_note?: string | null
          supplier_id: string
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          grn_number?: string
          id?: string
          idempotency_key?: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          purchase_order_id?: string
          received_at?: string
          received_by?: string
          status?: string
          storage_location_id?: string
          supplier_delivery_note?: string | null
          supplier_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_inventory_transaction_id_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_storage_location_id_fkey"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "goods_receipts_organization_id_warehouse_id_fkey"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_balances: {
        Row: {
          average_unit_cost: number
          branch_id: string
          inventory_value: number
          last_movement_at: string | null
          on_hand_base_quantity: number
          organization_id: string
          product_variant_id: string
          reserved_base_quantity: number
          storage_location_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          average_unit_cost?: number
          branch_id: string
          inventory_value?: number
          last_movement_at?: string | null
          on_hand_base_quantity?: number
          organization_id: string
          product_variant_id: string
          reserved_base_quantity?: number
          storage_location_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          average_unit_cost?: number
          branch_id?: string
          inventory_value?: number
          last_movement_at?: string | null
          on_hand_base_quantity?: number
          organization_id?: string
          product_variant_id?: string
          reserved_base_quantity?: number
          storage_location_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balance_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_cost_allocations: {
        Row: {
          cost_layer_id: string
          created_at: string
          id: string
          organization_id: string
          outbound_movement_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          cost_layer_id: string
          created_at?: string
          id?: string
          organization_id: string
          outbound_movement_id: string
          quantity: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          cost_layer_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          outbound_movement_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_allocation_layer_fk"
            columns: ["organization_id", "cost_layer_id"]
            isOneToOne: false
            referencedRelation: "inventory_cost_layers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_allocation_movement_fk"
            columns: ["organization_id", "outbound_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_cost_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_cost_layers: {
        Row: {
          branch_id: string
          created_at: string
          effective_at: string
          fifo_sequence: number
          id: string
          inbound_movement_id: string
          organization_id: string
          original_quantity: number
          product_variant_id: string
          remaining_quantity: number
          storage_location_id: string
          unit_cost: number
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          effective_at: string
          fifo_sequence?: number
          id?: string
          inbound_movement_id: string
          organization_id: string
          original_quantity: number
          product_variant_id: string
          remaining_quantity: number
          storage_location_id: string
          unit_cost: number
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          effective_at?: string
          fifo_sequence?: number
          id?: string
          inbound_movement_id?: string
          organization_id?: string
          original_quantity?: number
          product_variant_id?: string
          remaining_quantity?: number
          storage_location_id?: string
          unit_cost?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_cost_layers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_layer_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_layer_movement_fk"
            columns: ["organization_id", "inbound_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_layer_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string
          conversion_to_base_snapshot: number
          costing_method_snapshot: string
          created_at: string
          entered_quantity: number
          expiry_date: string | null
          id: string
          lot_id: string | null
          movement_type: string
          occurred_at: string
          organization_id: string
          packaging_id: string
          posted_at: string
          product_variant_id: string
          quantity_delta_base: number
          reference_id: string | null
          reference_type: string | null
          serial_id: string | null
          storage_location_id: string
          transaction_id: string
          valuation_total: number
          valuation_unit_cost: number
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          conversion_to_base_snapshot: number
          costing_method_snapshot: string
          created_at?: string
          entered_quantity: number
          expiry_date?: string | null
          id?: string
          lot_id?: string | null
          movement_type: string
          occurred_at: string
          organization_id: string
          packaging_id: string
          posted_at: string
          product_variant_id: string
          quantity_delta_base: number
          reference_id?: string | null
          reference_type?: string | null
          serial_id?: string | null
          storage_location_id: string
          transaction_id: string
          valuation_total: number
          valuation_unit_cost: number
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          conversion_to_base_snapshot?: number
          costing_method_snapshot?: string
          created_at?: string
          entered_quantity?: number
          expiry_date?: string | null
          id?: string
          lot_id?: string | null
          movement_type?: string
          occurred_at?: string
          organization_id?: string
          packaging_id?: string
          posted_at?: string
          product_variant_id?: string
          quantity_delta_base?: number
          reference_id?: string | null
          reference_type?: string | null
          serial_id?: string | null
          storage_location_id?: string
          transaction_id?: string
          valuation_total?: number
          valuation_unit_cost?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movement_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movement_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movement_packaging_fk"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movement_transaction_fk"
            columns: ["organization_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movement_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movement_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_number_counters: {
        Row: {
          next_value: number
          organization_id: string
          prefix: string
          updated_at: string
        }
        Insert: {
          next_value?: number
          organization_id: string
          prefix: string
          updated_at?: string
        }
        Update: {
          next_value?: number
          organization_id?: string
          prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_number_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reason_codes: {
        Row: {
          applicable_types: string[]
          code: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          organization_id: string
          requires_notes: boolean
          updated_at: string
        }
        Insert: {
          applicable_types?: string[]
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          organization_id: string
          requires_notes?: boolean
          updated_at?: string
        }
        Update: {
          applicable_types?: string[]
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string
          requires_notes?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reason_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reorder_overrides: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string
          id: string
          organization_id: string
          product_variant_id: string
          reorder_point: number | null
          reorder_quantity: number | null
          safety_stock: number | null
          storage_location_id: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          product_variant_id: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          safety_stock?: number | null
          storage_location_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          product_variant_id?: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          safety_stock?: number | null
          storage_location_id?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reorder_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_override_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "reorder_override_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "reorder_override_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "reorder_override_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_reservation_events: {
        Row: {
          actor_id: string
          created_at: string
          event_type: string
          id: number
          idempotency_key: string
          organization_id: string
          quantity: number
          reservation_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event_type: string
          id?: never
          idempotency_key: string
          organization_id: string
          quantity: number
          reservation_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event_type?: string
          id?: never
          idempotency_key?: string
          organization_id?: string
          quantity?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_event_reservation_fk"
            columns: ["organization_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          idempotency_key: string
          organization_id: string
          product_variant_id: string
          quantity_base: number
          remaining_quantity: number
          request_hash: string
          source_id: string | null
          source_type: string
          status: string
          storage_location_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          idempotency_key: string
          organization_id: string
          product_variant_id: string
          quantity_base: number
          remaining_quantity: number
          request_hash: string
          source_id?: string | null
          source_type: string
          status?: string
          storage_location_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string
          product_variant_id?: string
          quantity_base?: number
          remaining_quantity?: number
          request_hash?: string
          source_id?: string | null
          source_type?: string
          status?: string
          storage_location_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservation_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservation_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservation_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_settings: {
        Row: {
          accounting_start_date: string | null
          allow_backdated: boolean
          costing_method: string
          count_mode: string
          created_at: string
          inventory_timezone: string
          negative_stock_policy: string
          organization_id: string
          quantity_precision: number
          updated_at: string
        }
        Insert: {
          accounting_start_date?: string | null
          allow_backdated?: boolean
          costing_method?: string
          count_mode?: string
          created_at?: string
          inventory_timezone?: string
          negative_stock_policy?: string
          organization_id: string
          quantity_precision?: number
          updated_at?: string
        }
        Update: {
          accounting_start_date?: string | null
          allow_backdated?: boolean
          costing_method?: string
          count_mode?: string
          created_at?: string
          inventory_timezone?: string
          negative_stock_policy?: string
          organization_id?: string
          quantity_precision?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          business_id: string
          client_created_at: string | null
          client_transaction_id: string | null
          created_at: string
          created_by: string
          device_id: string | null
          external_reference: string | null
          id: string
          idempotency_key: string
          notes: string | null
          organization_id: string
          posted_at: string | null
          posted_by: string | null
          reason_code_id: string | null
          reference_id: string | null
          reference_type: string | null
          request_hash: string
          reversal_transaction_id: string | null
          reversed_at: string | null
          reversed_by: string | null
          source: string
          status: string
          transaction_date: string
          transaction_number: string
          transaction_type: string
        }
        Insert: {
          business_id: string
          client_created_at?: string | null
          client_transaction_id?: string | null
          created_at?: string
          created_by: string
          device_id?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key: string
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          posted_by?: string | null
          reason_code_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          request_hash: string
          reversal_transaction_id?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          source?: string
          status?: string
          transaction_date: string
          transaction_number: string
          transaction_type: string
        }
        Update: {
          business_id?: string
          client_created_at?: string | null
          client_transaction_id?: string | null
          created_at?: string
          created_by?: string
          device_id?: string | null
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          posted_by?: string | null
          reason_code_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          request_hash?: string
          reversal_transaction_id?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          source?: string
          status?: string
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transaction_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_transaction_reason_fk"
            columns: ["organization_id", "reason_code_id"]
            isOneToOne: false
            referencedRelation: "inventory_reason_codes"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_transaction_reversal_fk"
            columns: ["organization_id", "reversal_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          approval_request_id: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          journal_date: string
          journal_number: string
          organization_id: string
          period_id: string
          posted_at: string | null
          posted_by: string | null
          posting_version: number
          reversal_of_id: string | null
          reversal_reason: string | null
          source_id: string | null
          source_module: string
          source_type: string
          status: string
        }
        Insert: {
          approval_request_id?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          journal_date: string
          journal_number: string
          organization_id: string
          period_id: string
          posted_at?: string | null
          posted_by?: string | null
          posting_version?: number
          reversal_of_id?: string | null
          reversal_reason?: string | null
          source_id?: string | null
          source_module: string
          source_type: string
          status?: string
        }
        Update: {
          approval_request_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          journal_date?: string
          journal_number?: string
          organization_id?: string
          period_id?: string
          posted_at?: string | null
          posted_by?: string | null
          posting_version?: number
          reversal_of_id?: string | null
          reversal_reason?: string | null
          source_id?: string | null
          source_module?: string
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_organization_id_approval_request_id_fkey"
            columns: ["organization_id", "approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_organization_id_period_id_fkey"
            columns: ["organization_id", "period_id"]
            isOneToOne: false
            referencedRelation: "accounting_periods"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_entries_organization_id_reversal_of_id_fkey"
            columns: ["organization_id", "reversal_of_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          base_credit: number
          base_debit: number
          branch_id: string | null
          created_at: string
          credit: number
          currency: string
          customer_id: string | null
          debit: number
          description: string | null
          exchange_rate_snapshot: number
          id: string
          journal_id: string
          line_number: number
          organization_id: string
          product_id: string | null
          supplier_id: string | null
        }
        Insert: {
          account_id: string
          base_credit?: number
          base_debit?: number
          branch_id?: string | null
          created_at?: string
          credit?: number
          currency: string
          customer_id?: string | null
          debit?: number
          description?: string | null
          exchange_rate_snapshot: number
          id?: string
          journal_id: string
          line_number: number
          organization_id: string
          product_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          account_id?: string
          base_credit?: number
          base_debit?: number
          branch_id?: string | null
          created_at?: string
          credit?: number
          currency?: string
          customer_id?: string | null
          debit?: number
          description?: string | null
          exchange_rate_snapshot?: number
          id?: string
          journal_id?: string
          line_number?: number
          organization_id?: string
          product_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_organization_id_account_id_fkey"
            columns: ["organization_id", "account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_account_id_fkey"
            columns: ["organization_id", "account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_journal_id_fkey"
            columns: ["organization_id", "journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      journal_number_counters: {
        Row: {
          fiscal_year: number
          last_number: number
          organization_id: string
        }
        Insert: {
          fiscal_year: number
          last_number?: number
          organization_id: string
        }
        Update: {
          fiscal_year?: number
          last_number?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_number_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      landed_cost_allocations: {
        Row: {
          allocated_amount_base: number
          created_at: string
          goods_receipt_line_id: string
          id: string
          landed_cost_id: string
          organization_id: string
        }
        Insert: {
          allocated_amount_base: number
          created_at?: string
          goods_receipt_line_id: string
          id?: string
          landed_cost_id: string
          organization_id: string
        }
        Update: {
          allocated_amount_base?: number
          created_at?: string
          goods_receipt_line_id?: string
          id?: string
          landed_cost_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "landed_cost_allocations_landed_cost_id_fkey"
            columns: ["landed_cost_id"]
            isOneToOne: false
            referencedRelation: "landed_costs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landed_cost_allocations_organization_id_goods_receipt_line_fkey"
            columns: ["organization_id", "goods_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_lines"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      landed_costs: {
        Row: {
          allocation_method: string
          amount: number
          base_currency_amount: number
          cost_type: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          exchange_rate: number
          goods_receipt_id: string | null
          id: string
          is_acquisition_cost: boolean
          organization_id: string
          purchase_order_id: string | null
        }
        Insert: {
          allocation_method: string
          amount: number
          base_currency_amount: number
          cost_type: string
          created_at?: string
          created_by: string
          currency: string
          description?: string | null
          exchange_rate: number
          goods_receipt_id?: string | null
          id?: string
          is_acquisition_cost?: boolean
          organization_id: string
          purchase_order_id?: string | null
        }
        Update: {
          allocation_method?: string
          amount?: number
          base_currency_amount?: number
          cost_type?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          exchange_rate?: number
          goods_receipt_id?: string | null
          id?: string
          is_acquisition_cost?: boolean
          organization_id?: string
          purchase_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landed_costs_organization_id_goods_receipt_id_fkey"
            columns: ["organization_id", "goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "landed_costs_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      member_branch_access: {
        Row: {
          branch_id: string
          created_at: string
          membership_id: string
          organization_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          membership_id: string
          organization_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          membership_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_branch_access_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_branch_access_membership_fk"
            columns: ["organization_id", "membership_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_branch_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roles: {
        Row: {
          created_at: string
          membership_id: string
          organization_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          membership_id: string
          organization_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          membership_id?: string
          organization_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_membership_fk"
            columns: ["organization_id", "membership_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_role_fk"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      offline_devices: {
        Row: {
          app_version: string
          branch_id: string
          device_identifier: string
          first_seen_at: string
          id: string
          label: string
          last_seen_at: string
          last_successful_sync_at: string | null
          organization_id: string
          registered_by: string
          revoked_at: string | null
          revoked_by: string | null
          status: string
          terminal_id: string
          updated_at: string
        }
        Insert: {
          app_version: string
          branch_id: string
          device_identifier: string
          first_seen_at?: string
          id?: string
          label: string
          last_seen_at?: string
          last_successful_sync_at?: string | null
          organization_id: string
          registered_by: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          terminal_id: string
          updated_at?: string
        }
        Update: {
          app_version?: string
          branch_id?: string
          device_identifier?: string
          first_seen_at?: string
          id?: string
          label?: string
          last_seen_at?: string
          last_successful_sync_at?: string | null
          organization_id?: string
          registered_by?: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_devices_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "offline_devices_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      offline_entitlement_leases: {
        Row: {
          created_at: string
          device_id: string
          expires_at: string
          feature_code: string
          id: string
          organization_id: string
          subscription_id: string | null
          validated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          expires_at: string
          feature_code?: string
          id?: string
          organization_id: string
          subscription_id?: string | null
          validated_at: string
        }
        Update: {
          created_at?: string
          device_id?: string
          expires_at?: string
          feature_code?: string
          id?: string
          organization_id?: string
          subscription_id?: string | null
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_entitlement_leases_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_code"]
          },
          {
            foreignKeyName: "offline_entitlement_leases_organization_id_device_id_fkey"
            columns: ["organization_id", "device_id"]
            isOneToOne: true
            referencedRelation: "offline_devices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "offline_entitlement_leases_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_sync_events: {
        Row: {
          actor_id: string
          attempted_at: string
          branch_id: string
          device_id: string
          error_code: string | null
          id: string
          local_transaction_id: string | null
          metadata: Json
          operation_type: string
          organization_id: string
          server_sale_id: string | null
          status: string
        }
        Insert: {
          actor_id: string
          attempted_at?: string
          branch_id: string
          device_id: string
          error_code?: string | null
          id?: string
          local_transaction_id?: string | null
          metadata?: Json
          operation_type: string
          organization_id: string
          server_sale_id?: string | null
          status: string
        }
        Update: {
          actor_id?: string
          attempted_at?: string
          branch_id?: string
          device_id?: string
          error_code?: string | null
          id?: string
          local_transaction_id?: string | null
          metadata?: Json
          operation_type?: string
          organization_id?: string
          server_sale_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_sync_events_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "offline_sync_events_organization_id_device_id_fkey"
            columns: ["organization_id", "device_id"]
            isOneToOne: false
            referencedRelation: "offline_devices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "offline_sync_events_organization_id_server_sale_id_fkey"
            columns: ["organization_id", "server_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "offline_sync_events_organization_id_server_sale_id_fkey"
            columns: ["organization_id", "server_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      organization_entitlement_overrides: {
        Row: {
          created_at: string
          created_by: string
          enabled: boolean | null
          entitlement_type: string
          expires_at: string | null
          feature_code: string
          id: string
          numeric_value: number | null
          organization_id: string
          reason: string
          text_value: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          enabled?: boolean | null
          entitlement_type: string
          expires_at?: string | null
          feature_code: string
          id?: string
          numeric_value?: number | null
          organization_id: string
          reason: string
          text_value?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          enabled?: boolean | null
          entitlement_type?: string
          expires_at?: string | null
          feature_code?: string
          id?: string
          numeric_value?: number | null
          organization_id?: string
          reason?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_entitlement_overrides_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_code"]
          },
          {
            foreignKeyName: "organization_entitlement_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          branch_ids: string[]
          created_at: string
          display_name: string | null
          email: string
          expires_at: string
          id: string
          invitation_note: string | null
          invited_by: string
          last_sent_at: string
          organization_id: string
          resend_count: number
          role_id: string | null
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          branch_ids?: string[]
          created_at?: string
          display_name?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_note?: string | null
          invited_by: string
          last_sent_at?: string
          organization_id: string
          resend_count?: number
          role_id?: string | null
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          branch_ids?: string[]
          created_at?: string
          display_name?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_note?: string | null
          invited_by?: string
          last_sent_at?: string
          organization_id?: string
          resend_count?: number
          role_id?: string | null
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_role_fk"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          deactivated_at: string | null
          display_name: string | null
          email: string | null
          id: string
          invited_at: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["membership_status"]
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          access_mode: string
          billing_interval: string
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          currency_snapshot: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_ends_at: string | null
          id: string
          manual_override: boolean
          organization_id: string
          plan_id: string
          price_snapshot: number
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          access_mode: string
          billing_interval: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency_snapshot: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          manual_override?: boolean
          organization_id: string
          plan_id: string
          price_snapshot: number
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          access_mode?: string
          billing_interval?: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency_snapshot?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          manual_override?: boolean
          organization_id?: string
          plan_id?: string
          price_snapshot?: number
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          country_code: string
          created_at: string
          created_by: string
          currency_code: string
          id: string
          name: string
          platform_suspended_at: string | null
          platform_suspension_reason: string | null
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          country_code: string
          created_at?: string
          created_by: string
          currency_code: string
          id?: string
          name: string
          platform_suspended_at?: string | null
          platform_suspension_reason?: string | null
          slug: string
          status?: string
          timezone: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          country_code?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          id?: string
          name?: string
          platform_suspended_at?: string | null
          platform_suspension_reason?: string | null
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_accounts: {
        Row: {
          account_code: string
          account_type: string
          branch_id: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_type: string
          branch_id?: string | null
          created_at?: string
          created_by: string
          currency: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_type?: string
          branch_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at: string
          created_by: string
          customer_invoice_id: string | null
          id: string
          is_reversal: boolean
          organization_id: string
          original_allocation_id: string | null
          payment_id: string
          supplier_invoice_id: string | null
        }
        Insert: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at?: string
          created_by: string
          customer_invoice_id?: string | null
          id?: string
          is_reversal?: boolean
          organization_id: string
          original_allocation_id?: string | null
          payment_id: string
          supplier_invoice_id?: string | null
        }
        Update: {
          allocated_amount?: number
          allocated_base_amount?: number
          allocation_date?: string
          created_at?: string
          created_by?: string
          customer_invoice_id?: string | null
          id?: string
          is_reversal?: boolean
          organization_id?: string
          original_allocation_id?: string | null
          payment_id?: string
          supplier_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_original_allocation_id_fkey"
            columns: ["organization_id", "original_allocation_id"]
            isOneToOne: false
            referencedRelation: "payment_allocations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "customer_unapplied_credits"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "supplier_advances"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          allows_overpayment: boolean
          branch_id: string | null
          code: string
          created_at: string
          created_by: string
          default_account_id: string | null
          id: string
          method_type: string
          name: string
          organization_id: string
          requires_approval: boolean
          requires_reference: boolean
          status: string
          updated_at: string
        }
        Insert: {
          allows_overpayment?: boolean
          branch_id?: string | null
          code: string
          created_at?: string
          created_by: string
          default_account_id?: string | null
          id?: string
          method_type: string
          name: string
          organization_id: string
          requires_approval?: boolean
          requires_reference?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          allows_overpayment?: boolean
          branch_id?: string | null
          code?: string
          created_at?: string
          created_by?: string
          default_account_id?: string | null
          id?: string
          method_type?: string
          name?: string
          organization_id?: string
          requires_approval?: boolean
          requires_reference?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_methods_organization_id_default_account_id_fkey"
            columns: ["organization_id", "default_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "payment_methods_organization_id_default_account_id_fkey"
            columns: ["organization_id", "default_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_number_counters: {
        Row: {
          next_value: number
          organization_id: string
          prefix: string
          updated_at: string
        }
        Insert: {
          next_value?: number
          organization_id: string
          prefix: string
          updated_at?: string
        }
        Update: {
          next_value?: number
          organization_id?: string
          prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_number_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          base_currency_amount: number
          branch_id: string
          counterparty_type: string
          created_at: string
          created_by: string
          currency: string
          customer_id: string | null
          direction: string
          exchange_rate_snapshot: number
          external_reference: string | null
          id: string
          idempotency_key: string
          is_reversal: boolean
          notes: string | null
          organization_id: string
          original_payment_id: string | null
          payment_date: string
          payment_method_id: string
          payment_number: string
          posted_at: string
          posted_by: string
          request_hash: string
          reversal_reason: string | null
          settlement_account_id: string
          status: string
          supplier_id: string | null
        }
        Insert: {
          amount: number
          base_currency_amount: number
          branch_id: string
          counterparty_type: string
          created_at?: string
          created_by: string
          currency: string
          customer_id?: string | null
          direction: string
          exchange_rate_snapshot: number
          external_reference?: string | null
          id?: string
          idempotency_key: string
          is_reversal?: boolean
          notes?: string | null
          organization_id: string
          original_payment_id?: string | null
          payment_date: string
          payment_method_id: string
          payment_number: string
          posted_at?: string
          posted_by: string
          request_hash: string
          reversal_reason?: string | null
          settlement_account_id: string
          status: string
          supplier_id?: string | null
        }
        Update: {
          amount?: number
          base_currency_amount?: number
          branch_id?: string
          counterparty_type?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string | null
          direction?: string
          exchange_rate_snapshot?: number
          external_reference?: string | null
          id?: string
          idempotency_key?: string
          is_reversal?: boolean
          notes?: string | null
          organization_id?: string
          original_payment_id?: string | null
          payment_date?: string
          payment_method_id?: string
          payment_number?: string
          posted_at?: string
          posted_by?: string
          request_hash?: string
          reversal_reason?: string | null
          settlement_account_id?: string
          status?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "payments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_original_payment_id_fkey"
            columns: ["organization_id", "original_payment_id"]
            isOneToOne: false
            referencedRelation: "customer_unapplied_credits"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "payments_organization_id_original_payment_id_fkey"
            columns: ["organization_id", "original_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_original_payment_id_fkey"
            columns: ["organization_id", "original_payment_id"]
            isOneToOne: false
            referencedRelation: "supplier_advances"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "payments_organization_id_payment_method_id_fkey"
            columns: ["organization_id", "payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_settlement_account_id_fkey"
            columns: ["organization_id", "settlement_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "payments_organization_id_settlement_account_id_fkey"
            columns: ["organization_id", "settlement_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      plan_entitlements: {
        Row: {
          created_at: string
          enabled: boolean | null
          entitlement_type: string
          feature_code: string
          numeric_value: number | null
          plan_id: string
          text_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          entitlement_type: string
          feature_code: string
          numeric_value?: number | null
          plan_id: string
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          entitlement_type?: string
          feature_code?: string
          numeric_value?: number | null
          plan_id?: string
          text_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_code"]
          },
          {
            foreignKeyName: "plan_entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          capabilities: string[]
          created_at: string
          created_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capabilities?: string[]
          created_at?: string
          created_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capabilities?: string[]
          created_at?: string
          created_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json
          before_data: Json
          created_at: string
          id: number
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json
          before_data?: Json
          created_at?: string
          id?: never
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json
          before_data?: Json
          created_at?: string
          id?: never
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      platform_billing_transactions: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          currency: string
          id: string
          organization_id: string
          paid_at: string | null
          plan_id: string
          provider: string
          provider_reference: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency: string
          id?: string
          organization_id: string
          paid_at?: string | null
          plan_id: string
          provider: string
          provider_reference?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          plan_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_billing_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_billing_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_billing_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_code: string
          id: string
          organization_id: string | null
          reason: string
          scope: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          enabled: boolean
          feature_code: string
          id?: string
          organization_id?: string | null
          reason: string
          scope: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_code?: string
          id?: string
          organization_id?: string | null
          reason?: string
          scope?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_feature_flags_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_code"]
          },
          {
            foreignKeyName: "platform_feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_features: {
        Row: {
          category: string
          created_at: string
          description: string
          feature_code: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          feature_code: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          feature_code?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          billing_provider: string
          default_trial_days: number
          default_trial_plan_id: string | null
          grace_period_days: number
          offline_entitlement_lease_hours: number
          singleton: boolean
          support_contact: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_provider?: string
          default_trial_days?: number
          default_trial_plan_id?: string | null
          grace_period_days?: number
          offline_entitlement_lease_hours?: number
          singleton?: boolean
          support_contact?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_provider?: string
          default_trial_days?: number
          default_trial_plan_id?: string | null
          grace_period_days?: number
          offline_entitlement_lease_hours?: number
          singleton?: boolean
          support_contact?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_trial_plan_fk"
            columns: ["default_trial_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_webhook_events: {
        Row: {
          error: string | null
          event_type: string
          id: string
          payload_hash: string
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string
          status: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id?: string
          payload_hash: string
          processed_at?: string | null
          provider: string
          provider_event_id: string
          received_at?: string
          status: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: string
          payload_hash?: string
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      pos_cash_events: {
        Row: {
          actor_id: string
          amount: number
          branch_id: string
          created_at: string
          direction: string
          event_type: string
          id: string
          organization_id: string
          reason: string | null
          session_id: string
          source_id: string | null
          source_type: string | null
          terminal_id: string
        }
        Insert: {
          actor_id: string
          amount: number
          branch_id: string
          created_at?: string
          direction: string
          event_type: string
          id?: string
          organization_id: string
          reason?: string | null
          session_id: string
          source_id?: string | null
          source_type?: string | null
          terminal_id: string
        }
        Update: {
          actor_id?: string
          amount?: number
          branch_id?: string
          created_at?: string
          direction?: string
          event_type?: string
          id?: string
          organization_id?: string
          reason?: string | null
          session_id?: string
          source_id?: string | null
          source_type?: string | null
          terminal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_cash_events_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_cash_events_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_session_summaries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_cash_events_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_cash_events_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_held_carts: {
        Row: {
          branch_id: string
          cart: Json
          cashier_user_id: string
          customer_id: string | null
          expires_at: string
          held_at: string
          id: string
          notes: string | null
          organization_id: string
          session_id: string
          status: string
          terminal_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          cart: Json
          cashier_user_id: string
          customer_id?: string | null
          expires_at: string
          held_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          session_id: string
          status?: string
          terminal_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          cart?: Json
          cashier_user_id?: string
          customer_id?: string | null
          expires_at?: string
          held_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          session_id?: string
          status?: string
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_held_carts_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_held_carts_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "pos_held_carts_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_held_carts_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_session_summaries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_held_carts_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_held_carts_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_receipt_reprints: {
        Row: {
          id: string
          organization_id: string
          pos_sale_id: string
          reason: string | null
          reprinted_at: string
          reprinted_by: string
        }
        Insert: {
          id?: string
          organization_id: string
          pos_sale_id: string
          reason?: string | null
          reprinted_at?: string
          reprinted_by: string
        }
        Update: {
          id?: string
          organization_id?: string
          pos_sale_id?: string
          reason?: string | null
          reprinted_at?: string
          reprinted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_receipt_reprints_organization_id_pos_sale_id_fkey"
            columns: ["organization_id", "pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_receipt_reprints_organization_id_pos_sale_id_fkey"
            columns: ["organization_id", "pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_sale_settlements: {
        Row: {
          amount: number
          change_amount: number
          created_at: string
          external_reference: string | null
          id: string
          organization_id: string
          payment_id: string | null
          payment_method_id: string | null
          pos_sale_id: string
          settlement_type: string
          source_id: string | null
          tendered_amount: number | null
        }
        Insert: {
          amount: number
          change_amount?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          organization_id: string
          payment_id?: string | null
          payment_method_id?: string | null
          pos_sale_id: string
          settlement_type: string
          source_id?: string | null
          tendered_amount?: number | null
        }
        Update: {
          amount?: number
          change_amount?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          organization_id?: string
          payment_id?: string | null
          payment_method_id?: string | null
          pos_sale_id?: string
          settlement_type?: string
          source_id?: string | null
          tendered_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_settlements_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "customer_unapplied_credits"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "pos_sale_settlements_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sale_settlements_organization_id_payment_id_fkey"
            columns: ["organization_id", "payment_id"]
            isOneToOne: false
            referencedRelation: "supplier_advances"
            referencedColumns: ["organization_id", "payment_id"]
          },
          {
            foreignKeyName: "pos_sale_settlements_organization_id_payment_method_id_fkey"
            columns: ["organization_id", "payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sale_settlements_organization_id_pos_sale_id_fkey"
            columns: ["organization_id", "pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sale_settlements_organization_id_pos_sale_id_fkey"
            columns: ["organization_id", "pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          branch_id: string
          cash_tendered: number | null
          cashier_user_id: string
          change_due: number
          completed_at: string
          currency: string
          customer_id: string
          customer_invoice_id: string
          discount: number
          fulfilment_id: string
          id: string
          idempotency_key: string
          inventory_transaction_id: string
          local_created_at: string | null
          local_transaction_id: string | null
          offline_device_id: string | null
          offline_request_hash: string | null
          organization_id: string
          originated_offline: boolean
          receipt_number: string
          request_hash: string
          sales_order_id: string
          server_received_at: string | null
          session_id: string
          status: string
          subtotal: number
          tax: number
          terminal_id: string
          total: number
          voided_at: string | null
        }
        Insert: {
          branch_id: string
          cash_tendered?: number | null
          cashier_user_id: string
          change_due?: number
          completed_at?: string
          currency: string
          customer_id: string
          customer_invoice_id: string
          discount?: number
          fulfilment_id: string
          id?: string
          idempotency_key: string
          inventory_transaction_id: string
          local_created_at?: string | null
          local_transaction_id?: string | null
          offline_device_id?: string | null
          offline_request_hash?: string | null
          organization_id: string
          originated_offline?: boolean
          receipt_number: string
          request_hash: string
          sales_order_id: string
          server_received_at?: string | null
          session_id: string
          status?: string
          subtotal: number
          tax?: number
          terminal_id: string
          total: number
          voided_at?: string | null
        }
        Update: {
          branch_id?: string
          cash_tendered?: number | null
          cashier_user_id?: string
          change_due?: number
          completed_at?: string
          currency?: string
          customer_id?: string
          customer_invoice_id?: string
          discount?: number
          fulfilment_id?: string
          id?: string
          idempotency_key?: string
          inventory_transaction_id?: string
          local_created_at?: string | null
          local_transaction_id?: string | null
          offline_device_id?: string | null
          offline_request_hash?: string | null
          organization_id?: string
          originated_offline?: boolean
          receipt_number?: string
          request_hash?: string
          sales_order_id?: string
          server_received_at?: string | null
          session_id?: string
          status?: string
          subtotal?: number
          tax?: number
          terminal_id?: string
          total?: number
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_offline_device_fk"
            columns: ["organization_id", "offline_device_id"]
            isOneToOne: false
            referencedRelation: "offline_devices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_fulfilment_id_fkey"
            columns: ["organization_id", "fulfilment_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_inventory_transaction_id_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_session_summaries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_sessions: {
        Row: {
          approved_by: string | null
          branch_id: string
          cashier_user_id: string
          closed_at: string | null
          closing_notes: string | null
          counted_cash: number | null
          created_at: string
          expected_cash: number | null
          id: string
          opened_at: string
          opening_float: number
          opening_notes: string | null
          organization_id: string
          session_number: string
          status: string
          terminal_id: string
          variance: number | null
          variance_reason: string | null
        }
        Insert: {
          approved_by?: string | null
          branch_id: string
          cashier_user_id: string
          closed_at?: string | null
          closing_notes?: string | null
          counted_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          opened_at?: string
          opening_float: number
          opening_notes?: string | null
          organization_id: string
          session_number: string
          status?: string
          terminal_id: string
          variance?: number | null
          variance_reason?: string | null
        }
        Update: {
          approved_by?: string | null
          branch_id?: string
          cashier_user_id?: string
          closed_at?: string | null
          closing_notes?: string | null
          counted_cash?: number | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          opened_at?: string
          opening_float?: number
          opening_notes?: string | null
          organization_id?: string
          session_number?: string
          status?: string
          terminal_id?: string
          variance?: number | null
          variance_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sessions_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_settings: {
        Row: {
          allow_discounts: boolean
          allow_walk_in: boolean
          cash_variance_tolerance: number
          discount_threshold_percent: number
          hold_expiration_minutes: number
          offline_cache_max_age_hours: number
          offline_card_allowed: boolean
          offline_credit_allowed: boolean
          offline_enabled: boolean
          offline_history_retention_days: number
          offline_price_policy: string
          offline_stock_policy: string
          offline_transfer_allowed: boolean
          organization_id: string
          require_customer: boolean
          require_open_session: boolean
          return_policy: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_discounts?: boolean
          allow_walk_in?: boolean
          cash_variance_tolerance?: number
          discount_threshold_percent?: number
          hold_expiration_minutes?: number
          offline_cache_max_age_hours?: number
          offline_card_allowed?: boolean
          offline_credit_allowed?: boolean
          offline_enabled?: boolean
          offline_history_retention_days?: number
          offline_price_policy?: string
          offline_stock_policy?: string
          offline_transfer_allowed?: boolean
          organization_id: string
          require_customer?: boolean
          require_open_session?: boolean
          return_policy?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_discounts?: boolean
          allow_walk_in?: boolean
          cash_variance_tolerance?: number
          discount_threshold_percent?: number
          hold_expiration_minutes?: number
          offline_cache_max_age_hours?: number
          offline_card_allowed?: boolean
          offline_credit_allowed?: boolean
          offline_enabled?: boolean
          offline_history_retention_days?: number
          offline_price_policy?: string
          offline_stock_policy?: string
          offline_transfer_allowed?: boolean
          organization_id?: string
          require_customer?: boolean
          require_open_session?: boolean
          return_policy?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string
          default_cash_account_id: string
          default_customer_id: string | null
          default_storage_location_id: string
          default_warehouse_id: string
          id: string
          name: string
          organization_id: string
          receipt_footer: string | null
          receipt_width: string
          status: string
          terminal_code: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          default_cash_account_id: string
          default_customer_id?: string | null
          default_storage_location_id: string
          default_warehouse_id: string
          id?: string
          name: string
          organization_id: string
          receipt_footer?: string | null
          receipt_width?: string
          status?: string
          terminal_code: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          default_cash_account_id?: string
          default_customer_id?: string | null
          default_storage_location_id?: string
          default_warehouse_id?: string
          id?: string
          name?: string
          organization_id?: string
          receipt_footer?: string | null
          receipt_width?: string
          status?: string
          terminal_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_cash_account_id_fkey"
            columns: ["organization_id", "default_cash_account_id"]
            isOneToOne: false
            referencedRelation: "operational_settlement_balances"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_cash_account_id_fkey"
            columns: ["organization_id", "default_cash_account_id"]
            isOneToOne: false
            referencedRelation: "payment_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_customer_id_fkey"
            columns: ["organization_id", "default_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_customer_id_fkey"
            columns: ["organization_id", "default_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_storage_location_id_fkey"
            columns: ["organization_id", "default_storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_terminals_organization_id_default_warehouse_id_fkey"
            columns: ["organization_id", "default_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      price_lists: {
        Row: {
          code: string
          created_at: string
          created_by: string
          currency_code: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          currency_code: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          currency_code?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          document_id: string
          document_type: string
          id: number
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          document_id: string
          document_type: string
          id?: never
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          document_id?: string
          document_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_settings: {
        Row: {
          organization_id: string
          over_delivery_policy: string
          over_delivery_tolerance_percent: number
          require_inspection: boolean
          require_po_approval: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          organization_id: string
          over_delivery_policy?: string
          over_delivery_tolerance_percent?: number
          require_inspection?: boolean
          require_po_approval?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          organization_id?: string
          over_delivery_policy?: string
          over_delivery_tolerance_percent?: number
          require_inspection?: boolean
          require_po_approval?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurement_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_barcodes: {
        Row: {
          barcode: string
          barcode_type: string
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          packaging_id: string | null
          product_variant_id: string
        }
        Insert: {
          barcode: string
          barcode_type?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          packaging_id?: string | null
          product_variant_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          packaging_id?: string | null
          product_variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_barcodes_packaging_fk"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_barcodes_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          organization_id: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_fk"
            columns: ["organization_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          byte_size: number
          created_at: string
          created_by: string
          id: string
          is_primary: boolean
          mime_type: string
          organization_id: string
          product_id: string
          product_variant_id: string | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          byte_size: number
          created_at?: string
          created_by: string
          id?: string
          is_primary?: boolean
          mime_type: string
          organization_id: string
          product_id: string
          product_variant_id?: string | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          byte_size?: number
          created_at?: string
          created_by?: string
          id?: string
          is_primary?: boolean
          mime_type?: string
          organization_id?: string
          product_id?: string
          product_variant_id?: string | null
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_images_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          product_option_id: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          product_option_id: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          product_option_id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_fk"
            columns: ["organization_id", "product_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_option_values_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_options_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_prices: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string
          created_by: string
          effective_from: string | null
          effective_to: string | null
          id: string
          min_quantity: number
          organization_id: string
          packaging_id: string
          price_list_id: string
          product_variant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string
          created_by: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          min_quantity?: number
          organization_id: string
          packaging_id: string
          price_list_id: string
          product_variant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          created_by?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          min_quantity?: number
          organization_id?: string
          packaging_id?: string
          price_list_id?: string
          product_variant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_prices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_packaging_fk"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_prices_price_list_fk"
            columns: ["organization_id", "price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_prices_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_variant_packaging: {
        Row: {
          can_purchase: boolean
          can_sell: boolean
          conversion_to_base: number
          created_at: string
          id: string
          is_active: boolean
          is_base_unit: boolean
          name: string
          organization_id: string
          product_variant_id: string
          unit_of_measure_id: string
          updated_at: string
        }
        Insert: {
          can_purchase?: boolean
          can_sell?: boolean
          conversion_to_base: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_unit?: boolean
          name: string
          organization_id: string
          product_variant_id: string
          unit_of_measure_id: string
          updated_at?: string
        }
        Update: {
          can_purchase?: boolean
          can_sell?: boolean
          conversion_to_base?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_base_unit?: boolean
          name?: string
          organization_id?: string
          product_variant_id?: string
          unit_of_measure_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_packaging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_packaging_unit_fk"
            columns: ["organization_id", "unit_of_measure_id"]
            isOneToOne: false
            referencedRelation: "units_of_measure"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_variant_packaging_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_variants: {
        Row: {
          archived_at: string | null
          created_at: string
          height: number | null
          id: string
          internal_code: string | null
          length: number | null
          manufacturer_part_number: string | null
          name: string
          option_signature: string | null
          organization_id: string
          product_id: string
          reorder_point: number | null
          reorder_quantity: number | null
          safety_stock: number | null
          sku: string | null
          status: string
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          height?: number | null
          id?: string
          internal_code?: string | null
          length?: number | null
          manufacturer_part_number?: string | null
          name: string
          option_signature?: string | null
          organization_id: string
          product_id: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          safety_stock?: number | null
          sku?: string | null
          status?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          height?: number | null
          id?: string
          internal_code?: string | null
          length?: number | null
          manufacturer_part_number?: string | null
          name?: string
          option_signature?: string | null
          organization_id?: string
          product_id?: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          safety_stock?: number | null
          sku?: string | null
          status?: string
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          allow_negative_stock: boolean
          archived_at: string | null
          batch_tracking: boolean
          brand_id: string | null
          business_id: string
          category_id: string | null
          created_at: string
          created_by: string
          description: string | null
          expiry_tracking: boolean
          id: string
          idempotency_key: string | null
          name: string
          organization_id: string
          product_type: string
          reference_cost: number | null
          serial_tracking: boolean
          status: string
          tax_profile_id: string | null
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          allow_negative_stock?: boolean
          archived_at?: string | null
          batch_tracking?: boolean
          brand_id?: string | null
          business_id: string
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          expiry_tracking?: boolean
          id?: string
          idempotency_key?: string | null
          name: string
          organization_id: string
          product_type: string
          reference_cost?: number | null
          serial_tracking?: boolean
          status?: string
          tax_profile_id?: string | null
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          allow_negative_stock?: boolean
          archived_at?: string | null
          batch_tracking?: boolean
          brand_id?: string | null
          business_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          expiry_tracking?: boolean
          id?: string
          idempotency_key?: string | null
          name?: string
          organization_id?: string
          product_type?: string
          reference_cost?: number | null
          serial_tracking?: boolean
          status?: string
          tax_profile_id?: string | null
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_fk"
            columns: ["organization_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_category_fk"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tax_profile_fk"
            columns: ["organization_id", "tax_profile_id"]
            isOneToOne: false
            referencedRelation: "tax_profiles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          accepted_base_quantity: number
          conversion_snapshot: number
          discount: number
          id: string
          line_total: number
          ordered_base_quantity: number
          ordered_quantity: number
          organization_id: string
          packaging_id: string
          product_description_snapshot: string
          product_variant_id: string
          purchase_order_id: string
          rejected_base_quantity: number
          supplier_item_code_snapshot: string | null
          tax: number
          unit_price: number
        }
        Insert: {
          accepted_base_quantity?: number
          conversion_snapshot: number
          discount?: number
          id?: string
          line_total: number
          ordered_base_quantity: number
          ordered_quantity: number
          organization_id: string
          packaging_id: string
          product_description_snapshot: string
          product_variant_id: string
          purchase_order_id: string
          rejected_base_quantity?: number
          supplier_item_code_snapshot?: string | null
          tax?: number
          unit_price: number
        }
        Update: {
          accepted_base_quantity?: number
          conversion_snapshot?: number
          discount?: number
          id?: string
          line_total?: number
          ordered_base_quantity?: number
          ordered_quantity?: number
          organization_id?: string
          packaging_id?: string
          product_description_snapshot?: string
          product_variant_id?: string
          purchase_order_id?: string
          rejected_base_quantity?: number
          supplier_item_code_snapshot?: string | null
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_order_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_order_lines_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_currency: string
          base_currency_total: number
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          currency: string
          discount: number
          exchange_rate: number
          expected_delivery_date: string | null
          freight: number
          id: string
          notes: string | null
          order_date: string
          organization_id: string
          originating_quotation_id: string | null
          originating_requisition_id: string | null
          originating_rfq_id: string | null
          other_cost: number
          payment_terms: string | null
          purchase_order_number: string
          receiving_location_id: string
          receiving_warehouse_id: string
          revision: number
          status: string
          subtotal: number
          supplier_code_snapshot: string
          supplier_id: string
          supplier_name_snapshot: string
          supplier_terms_snapshot: string | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency: string
          base_currency_total: number
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          currency: string
          discount?: number
          exchange_rate: number
          expected_delivery_date?: string | null
          freight?: number
          id?: string
          notes?: string | null
          order_date: string
          organization_id: string
          originating_quotation_id?: string | null
          originating_requisition_id?: string | null
          originating_rfq_id?: string | null
          other_cost?: number
          payment_terms?: string | null
          purchase_order_number: string
          receiving_location_id: string
          receiving_warehouse_id: string
          revision?: number
          status?: string
          subtotal: number
          supplier_code_snapshot: string
          supplier_id: string
          supplier_name_snapshot: string
          supplier_terms_snapshot?: string | null
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency?: string
          base_currency_total?: number
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          discount?: number
          exchange_rate?: number
          expected_delivery_date?: string | null
          freight?: number
          id?: string
          notes?: string | null
          order_date?: string
          organization_id?: string
          originating_quotation_id?: string | null
          originating_requisition_id?: string | null
          originating_rfq_id?: string | null
          other_cost?: number
          payment_terms?: string | null
          purchase_order_number?: string
          receiving_location_id?: string
          receiving_warehouse_id?: string
          revision?: number
          status?: string
          subtotal?: number
          supplier_code_snapshot?: string
          supplier_id?: string
          supplier_name_snapshot?: string
          supplier_terms_snapshot?: string | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_originating_quotation_id_fkey"
            columns: ["organization_id", "originating_quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_originating_requisition_id_fkey"
            columns: ["organization_id", "originating_requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_originating_rfq_id_fkey"
            columns: ["organization_id", "originating_rfq_id"]
            isOneToOne: false
            referencedRelation: "request_for_quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_receiving_location_id_fkey"
            columns: ["organization_id", "receiving_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_receiving_warehouse_id_fkey"
            columns: ["organization_id", "receiving_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_requisition_lines: {
        Row: {
          conversion_snapshot: number
          estimated_unit_cost: number | null
          id: string
          notes: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          requested_base_quantity: number
          requested_quantity: number
          requisition_id: string
        }
        Insert: {
          conversion_snapshot: number
          estimated_unit_cost?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          requested_base_quantity: number
          requested_quantity: number
          requisition_id: string
        }
        Update: {
          conversion_snapshot?: number
          estimated_unit_cost?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          requested_base_quantity?: number
          requested_quantity?: number
          requisition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_organization_id_product_variant_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_organization_id_requisition_id_fkey"
            columns: ["organization_id", "requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          business_id: string
          created_at: string
          department: string | null
          id: string
          justification: string | null
          organization_id: string
          priority: string
          rejected_at: string | null
          requesting_branch_id: string
          requesting_user_id: string
          required_by_date: string | null
          requisition_number: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          business_id: string
          created_at?: string
          department?: string | null
          id?: string
          justification?: string | null
          organization_id: string
          priority?: string
          rejected_at?: string | null
          requesting_branch_id: string
          requesting_user_id: string
          required_by_date?: string | null
          requisition_number: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          business_id?: string
          created_at?: string
          department?: string | null
          id?: string
          justification?: string | null
          organization_id?: string
          priority?: string
          rejected_at?: string | null
          requesting_branch_id?: string
          requesting_user_id?: string
          required_by_date?: string | null
          requisition_number?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_requisitions_organization_id_requesting_branch_id_fkey"
            columns: ["organization_id", "requesting_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_return_lines: {
        Row: {
          base_quantity: number
          conversion_snapshot: number
          goods_receipt_line_id: string | null
          id: string
          organization_id: string
          packaging_id: string
          product_variant_id: string
          purchase_return_id: string
          quantity: number
          unit_cost_base: number
        }
        Insert: {
          base_quantity: number
          conversion_snapshot: number
          goods_receipt_line_id?: string | null
          id?: string
          organization_id: string
          packaging_id: string
          product_variant_id: string
          purchase_return_id: string
          quantity: number
          unit_cost_base: number
        }
        Update: {
          base_quantity?: number
          conversion_snapshot?: number
          goods_receipt_line_id?: string | null
          id?: string
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          purchase_return_id?: string
          quantity?: number
          unit_cost_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_lines_organization_id_goods_receipt_line_i_fkey"
            columns: ["organization_id", "goods_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_return_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_return_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_return_lines_organization_id_purchase_return_id_fkey"
            columns: ["organization_id", "purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          goods_receipt_id: string | null
          id: string
          idempotency_key: string
          inventory_transaction_id: string | null
          notes: string | null
          organization_id: string
          posted_at: string | null
          purchase_order_id: string | null
          reason: string
          return_date: string
          return_number: string
          status: string
          storage_location_id: string
          supplier_id: string
          supplier_return_reference: string | null
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          goods_receipt_id?: string | null
          id?: string
          idempotency_key: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          purchase_order_id?: string | null
          reason: string
          return_date: string
          return_number: string
          status?: string
          storage_location_id: string
          supplier_id: string
          supplier_return_reference?: string | null
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          goods_receipt_id?: string | null
          id?: string
          idempotency_key?: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          purchase_order_id?: string | null
          reason?: string
          return_date?: string
          return_number?: string
          status?: string
          storage_location_id?: string
          supplier_id?: string
          supplier_return_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_goods_receipt_id_fkey"
            columns: ["organization_id", "goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_inventory_transaction_id_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_storage_location_id_fkey"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_returns_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      request_for_quotations: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          delivery_location_id: string
          id: string
          notes: string | null
          organization_id: string
          required_delivery_date: string | null
          requisition_id: string | null
          response_deadline: string | null
          rfq_number: string
          status: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          delivery_location_id: string
          id?: string
          notes?: string | null
          organization_id: string
          required_delivery_date?: string | null
          requisition_id?: string | null
          response_deadline?: string | null
          rfq_number: string
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          delivery_location_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          required_delivery_date?: string | null
          requisition_id?: string | null
          response_deadline?: string | null
          rfq_number?: string
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_for_quotations_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "request_for_quotations_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "request_for_quotations_organization_id_delivery_location_i_fkey"
            columns: ["organization_id", "delivery_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "request_for_quotations_organization_id_requisition_id_fkey"
            columns: ["organization_id", "requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      rfq_lines: {
        Row: {
          conversion_snapshot: number
          id: string
          organization_id: string
          packaging_id: string
          product_description_snapshot: string
          product_variant_id: string
          requested_quantity: number
          requisition_line_id: string | null
          rfq_id: string
        }
        Insert: {
          conversion_snapshot: number
          id?: string
          organization_id: string
          packaging_id: string
          product_description_snapshot: string
          product_variant_id: string
          requested_quantity: number
          requisition_line_id?: string | null
          rfq_id: string
        }
        Update: {
          conversion_snapshot?: number
          id?: string
          organization_id?: string
          packaging_id?: string
          product_description_snapshot?: string
          product_variant_id?: string
          requested_quantity?: number
          requisition_line_id?: string | null
          rfq_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "rfq_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "rfq_lines_organization_id_rfq_id_fkey"
            columns: ["organization_id", "rfq_id"]
            isOneToOne: false
            referencedRelation: "request_for_quotations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      rfq_suppliers: {
        Row: {
          organization_id: string
          rfq_id: string
          status: string
          supplier_id: string
        }
        Insert: {
          organization_id: string
          rfq_id: string
          status?: string
          supplier_id: string
        }
        Update: {
          organization_id?: string
          rfq_id?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_suppliers_organization_id_rfq_id_fkey"
            columns: ["organization_id", "rfq_id"]
            isOneToOne: false
            referencedRelation: "request_for_quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "rfq_suppliers_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          organization_id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fk"
            columns: ["organization_id", "role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          annual_price: number
          code: string
          created_at: string
          currency: string
          description: string
          display_order: number
          id: string
          is_custom: boolean
          is_public: boolean
          monthly_price: number
          name: string
          status: string
          trial_days: number
          updated_at: string
        }
        Insert: {
          annual_price?: number
          code: string
          created_at?: string
          currency: string
          description?: string
          display_order?: number
          id?: string
          is_custom?: boolean
          is_public?: boolean
          monthly_price?: number
          name: string
          status?: string
          trial_days?: number
          updated_at?: string
        }
        Update: {
          annual_price?: number
          code?: string
          created_at?: string
          currency?: string
          description?: string
          display_order?: number
          id?: string
          is_custom?: boolean
          is_public?: boolean
          monthly_price?: number
          name?: string
          status?: string
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          document_id: string
          document_type: string
          id: number
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          document_id: string
          document_type: string
          id?: never
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          document_id?: string
          document_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_activity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_fulfillment_lines: {
        Row: {
          base_quantity: number
          conversion_snapshot: number
          entered_quantity: number
          fulfilment_id: string
          gross_margin_base: number
          gross_profit_base: number
          id: string
          inventory_cost_base: number
          inventory_movement_id: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          revenue_base: number
          sales_order_line_id: string
        }
        Insert: {
          base_quantity: number
          conversion_snapshot: number
          entered_quantity: number
          fulfilment_id: string
          gross_margin_base?: number
          gross_profit_base?: number
          id?: string
          inventory_cost_base?: number
          inventory_movement_id?: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          revenue_base: number
          sales_order_line_id: string
        }
        Update: {
          base_quantity?: number
          conversion_snapshot?: number
          entered_quantity?: number
          fulfilment_id?: string
          gross_margin_base?: number
          gross_profit_base?: number
          id?: string
          inventory_cost_base?: number
          inventory_movement_id?: string | null
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          revenue_base?: number
          sales_order_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_fulfillment_line_movement_fk"
            columns: ["organization_id", "inventory_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillment_lines_organization_id_fulfilment_id_fkey"
            columns: ["organization_id", "fulfilment_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillment_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillment_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillment_lines_organization_id_sales_order_line_i_fkey"
            columns: ["organization_id", "sales_order_line_id"]
            isOneToOne: false
            referencedRelation: "sales_order_lines"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_fulfillments: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          customer_id: string
          delivery_address_snapshot: Json | null
          fulfilled_at: string
          fulfilled_by: string
          fulfilment_number: string
          id: string
          idempotency_key: string
          inventory_transaction_id: string | null
          notes: string | null
          organization_id: string
          request_hash: string
          sales_order_id: string
          status: string
          storage_location_id: string
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          customer_id: string
          delivery_address_snapshot?: Json | null
          fulfilled_at: string
          fulfilled_by: string
          fulfilment_number: string
          id?: string
          idempotency_key: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id: string
          request_hash: string
          sales_order_id: string
          status?: string
          storage_location_id: string
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          customer_id?: string
          delivery_address_snapshot?: Json | null
          fulfilled_at?: string
          fulfilled_by?: string
          fulfilment_number?: string
          id?: string
          idempotency_key?: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id?: string
          request_hash?: string
          sales_order_id?: string
          status?: string
          storage_location_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_fulfillments_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_inventory_transaction_i_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_storage_location_id_fkey"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_fulfillments_organization_id_warehouse_id_fkey"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_order_lines: {
        Row: {
          backordered_base_quantity: number
          cancelled_base_quantity: number
          conversion_snapshot: number
          description_snapshot: string
          discount: number
          fulfilled_base_quantity: number
          id: string
          line_total: number
          ordered_base_quantity: number
          ordered_quantity: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          reservation_id: string | null
          reserved_base_quantity: number
          sales_order_id: string
          sku_snapshot: string
          tax: number
          unit_price: number
        }
        Insert: {
          backordered_base_quantity?: number
          cancelled_base_quantity?: number
          conversion_snapshot: number
          description_snapshot: string
          discount?: number
          fulfilled_base_quantity?: number
          id?: string
          line_total: number
          ordered_base_quantity: number
          ordered_quantity: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          reservation_id?: string | null
          reserved_base_quantity?: number
          sales_order_id: string
          sku_snapshot: string
          tax?: number
          unit_price: number
        }
        Update: {
          backordered_base_quantity?: number
          cancelled_base_quantity?: number
          conversion_snapshot?: number
          description_snapshot?: string
          discount?: number
          fulfilled_base_quantity?: number
          id?: string
          line_total?: number
          ordered_base_quantity?: number
          ordered_quantity?: number
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          reservation_id?: string | null
          reserved_base_quantity?: number
          sales_order_id?: string
          sku_snapshot?: string
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_order_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_order_lines_organization_id_reservation_id_fkey"
            columns: ["organization_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_order_lines_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          base_currency: string
          base_currency_total: number
          billing_address_snapshot: Json | null
          branch_id: string
          business_id: string
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string
          credit_override_by: string | null
          currency: string
          customer_id: string
          customer_name_snapshot: string
          delivery_address_snapshot: Json | null
          discount: number
          exchange_rate: number
          fulfilment_location_id: string
          fulfilment_warehouse_id: string
          id: string
          idempotency_key: string | null
          notes: string | null
          order_date: string
          organization_id: string
          originating_quotation_id: string | null
          payment_terms: string | null
          price_list_id: string | null
          request_hash: string | null
          requested_delivery_date: string | null
          sales_order_number: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          base_currency: string
          base_currency_total: number
          billing_address_snapshot?: Json | null
          branch_id: string
          business_id: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          credit_override_by?: string | null
          currency: string
          customer_id: string
          customer_name_snapshot: string
          delivery_address_snapshot?: Json | null
          discount?: number
          exchange_rate: number
          fulfilment_location_id: string
          fulfilment_warehouse_id: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_date: string
          organization_id: string
          originating_quotation_id?: string | null
          payment_terms?: string | null
          price_list_id?: string | null
          request_hash?: string | null
          requested_delivery_date?: string | null
          sales_order_number: string
          status?: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          base_currency?: string
          base_currency_total?: number
          billing_address_snapshot?: Json | null
          branch_id?: string
          business_id?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          credit_override_by?: string | null
          currency?: string
          customer_id?: string
          customer_name_snapshot?: string
          delivery_address_snapshot?: Json | null
          discount?: number
          exchange_rate?: number
          fulfilment_location_id?: string
          fulfilment_warehouse_id?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          order_date?: string
          organization_id?: string
          originating_quotation_id?: string | null
          payment_terms?: string | null
          price_list_id?: string | null
          request_hash?: string | null
          requested_delivery_date?: string | null
          sales_order_number?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fulfilment_location_id_fkey"
            columns: ["organization_id", "fulfilment_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fulfilment_warehouse_id_fkey"
            columns: ["organization_id", "fulfilment_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_originating_quotation_id_fkey"
            columns: ["organization_id", "originating_quotation_id"]
            isOneToOne: false
            referencedRelation: "sales_quotations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_quotation_lines: {
        Row: {
          base_quantity: number
          conversion_snapshot: number
          description_snapshot: string
          discount: number
          entered_quantity: number
          id: string
          line_total: number
          minimum_price_snapshot: number | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quotation_id: string
          sku_snapshot: string
          tax: number
          unit_price: number
        }
        Insert: {
          base_quantity: number
          conversion_snapshot: number
          description_snapshot: string
          discount?: number
          entered_quantity: number
          id?: string
          line_total: number
          minimum_price_snapshot?: number | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quotation_id: string
          sku_snapshot: string
          tax?: number
          unit_price: number
        }
        Update: {
          base_quantity?: number
          conversion_snapshot?: number
          description_snapshot?: string
          discount?: number
          entered_quantity?: number
          id?: string
          line_total?: number
          minimum_price_snapshot?: number | null
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          quotation_id?: string
          sku_snapshot?: string
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_quotation_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_quotation_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_quotation_lines_organization_id_quotation_id_fkey"
            columns: ["organization_id", "quotation_id"]
            isOneToOne: false
            referencedRelation: "sales_quotations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_quotations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_currency: string
          base_currency_total: number
          billing_address_snapshot: Json | null
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          currency: string
          customer_id: string
          customer_name_snapshot: string
          delivery_address_snapshot: Json | null
          discount: number
          exchange_rate: number
          expiry_date: string | null
          id: string
          idempotency_key: string | null
          notes: string | null
          organization_id: string
          price_list_id: string | null
          quotation_date: string
          quotation_number: string
          request_hash: string | null
          status: string
          subtotal: number
          tax: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency: string
          base_currency_total: number
          billing_address_snapshot?: Json | null
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          currency: string
          customer_id: string
          customer_name_snapshot: string
          delivery_address_snapshot?: Json | null
          discount?: number
          exchange_rate: number
          expiry_date?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          organization_id: string
          price_list_id?: string | null
          quotation_date: string
          quotation_number: string
          request_hash?: string | null
          status?: string
          subtotal: number
          tax?: number
          terms?: string | null
          total: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_currency?: string
          base_currency_total?: number
          billing_address_snapshot?: Json | null
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string
          customer_name_snapshot?: string
          delivery_address_snapshot?: Json | null
          discount?: number
          exchange_rate?: number
          expiry_date?: string | null
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          organization_id?: string
          price_list_id?: string | null
          quotation_date?: string
          quotation_number?: string
          request_hash?: string | null
          status?: string
          subtotal?: number
          tax?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_quotations_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_quotations_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_quotations_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "sales_quotations_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_quotations_organization_id_price_list_id_fkey"
            columns: ["organization_id", "price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_return_cost_allocations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          original_cost_allocation_id: string | null
          quantity_base: number
          sales_return_line_id: string
          unit_cost_base: number
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          original_cost_allocation_id?: string | null
          quantity_base: number
          sales_return_line_id: string
          unit_cost_base: number
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          original_cost_allocation_id?: string | null
          quantity_base?: number
          sales_return_line_id?: string
          unit_cost_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_cost_allocations_organization_id_original_cos_fkey"
            columns: ["organization_id", "original_cost_allocation_id"]
            isOneToOne: false
            referencedRelation: "inventory_cost_allocations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_return_cost_allocations_organization_id_sales_return_fkey"
            columns: ["organization_id", "sales_return_line_id"]
            isOneToOne: false
            referencedRelation: "sales_return_lines"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_return_lines: {
        Row: {
          accepted_base_quantity: number
          accepted_quantity: number
          condition: string | null
          conversion_snapshot: number
          destination_location_id: string | null
          disposition: string | null
          id: string
          notes: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          received_quantity: number
          rejected_quantity: number
          requested_quantity: number
          return_unit_cost_base: number | null
          sales_fulfillment_line_id: string
          sales_return_id: string
        }
        Insert: {
          accepted_base_quantity?: number
          accepted_quantity?: number
          condition?: string | null
          conversion_snapshot: number
          destination_location_id?: string | null
          disposition?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          packaging_id: string
          product_variant_id: string
          received_quantity?: number
          rejected_quantity?: number
          requested_quantity: number
          return_unit_cost_base?: number | null
          sales_fulfillment_line_id: string
          sales_return_id: string
        }
        Update: {
          accepted_base_quantity?: number
          accepted_quantity?: number
          condition?: string | null
          conversion_snapshot?: number
          destination_location_id?: string | null
          disposition?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          received_quantity?: number
          rejected_quantity?: number
          requested_quantity?: number
          return_unit_cost_base?: number | null
          sales_fulfillment_line_id?: string
          sales_return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_lines_organization_id_destination_location_id_fkey"
            columns: ["organization_id", "destination_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_return_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_return_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_return_lines_organization_id_sales_fulfillment_line__fkey"
            columns: ["organization_id", "sales_fulfillment_line_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillment_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_return_lines_organization_id_sales_return_id_fkey"
            columns: ["organization_id", "sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_return_reasons: {
        Row: {
          code: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          requires_notes: boolean
        }
        Insert: {
          code: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          requires_notes?: boolean
        }
        Update: {
          code?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          requires_notes?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_reasons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string
          credit_note_id: string | null
          customer_id: string
          customer_invoice_id: string | null
          id: string
          idempotency_key: string
          inventory_transaction_id: string | null
          notes: string | null
          organization_id: string
          posted_at: string | null
          reason_id: string
          request_hash: string
          return_date: string
          return_number: string
          sales_fulfilment_id: string | null
          sales_order_id: string | null
          status: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by: string
          credit_note_id?: string | null
          customer_id: string
          customer_invoice_id?: string | null
          id?: string
          idempotency_key: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          reason_id: string
          request_hash: string
          return_date: string
          return_number: string
          sales_fulfilment_id?: string | null
          sales_order_id?: string | null
          status?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string
          credit_note_id?: string | null
          customer_id?: string
          customer_invoice_id?: string | null
          id?: string
          idempotency_key?: string
          inventory_transaction_id?: string | null
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          reason_id?: string
          request_hash?: string
          return_date?: string
          return_number?: string
          sales_fulfilment_id?: string | null
          sales_order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_credit_note_fk"
            columns: ["organization_id", "credit_note_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_notes"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_inventory_transaction_id_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_reason_id_fkey"
            columns: ["organization_id", "reason_id"]
            isOneToOne: false
            referencedRelation: "sales_return_reasons"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_sales_fulfilment_id_fkey"
            columns: ["organization_id", "sales_fulfilment_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      sales_settings: {
        Row: {
          backorder_policy: string
          credit_limit_policy: string
          minimum_price_policy: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          backorder_policy?: string
          credit_limit_policy?: string
          minimum_price_policy?: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          backorder_policy?: string
          credit_limit_policy?: string
          minimum_price_policy?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_counters: {
        Row: {
          next_value: number
          organization_id: string
          prefix: string
          updated_at: string
        }
        Insert: {
          next_value?: number
          organization_id: string
          prefix?: string
          updated_at?: string
        }
        Update: {
          next_value?: number
          organization_id?: string
          prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_lines: {
        Row: {
          count_session_id: string
          counted_at: string | null
          counted_by: string | null
          counted_quantity: number | null
          expected_quantity_snapshot: number
          id: string
          movement_since_snapshot: number
          notes: string | null
          organization_id: string
          product_variant_id: string
          recount_quantity: number | null
          storage_location_id: string
          variance_quantity: number | null
          variance_value: number | null
        }
        Insert: {
          count_session_id: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity_snapshot: number
          id?: string
          movement_since_snapshot?: number
          notes?: string | null
          organization_id: string
          product_variant_id: string
          recount_quantity?: number | null
          storage_location_id: string
          variance_quantity?: number | null
          variance_value?: number | null
        }
        Update: {
          count_session_id?: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity_snapshot?: number
          id?: string
          movement_since_snapshot?: number
          notes?: string | null
          organization_id?: string
          product_variant_id?: string
          recount_quantity?: number | null
          storage_location_id?: string
          variance_quantity?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_line_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_line_session_fk"
            columns: ["organization_id", "count_session_id"]
            isOneToOne: false
            referencedRelation: "stock_count_sessions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_line_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_sessions: {
        Row: {
          blind_count: boolean
          branch_id: string
          business_id: string
          count_number: string
          count_type: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          organization_id: string
          posted_at: string | null
          posted_by: string | null
          posting_transaction_id: string | null
          snapshot_at: string | null
          status: string
          storage_location_id: string | null
          submitted_at: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          blind_count?: boolean
          branch_id: string
          business_id: string
          count_number: string
          count_type: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          posted_by?: string | null
          posting_transaction_id?: string | null
          snapshot_at?: string | null
          status?: string
          storage_location_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          blind_count?: boolean
          branch_id?: string
          business_id?: string
          count_number?: string
          count_type?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          posted_by?: string | null
          posting_transaction_id?: string | null
          snapshot_at?: string | null
          status?: string
          storage_location_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_count_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      stock_transfer_lines: {
        Row: {
          conversion_snapshot: number | null
          damaged_base_quantity: number
          dispatched_base_quantity: number
          id: string
          missing_base_quantity: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          received_base_quantity: number
          requested_quantity: number
          transfer_id: string
          transfer_unit_cost: number | null
        }
        Insert: {
          conversion_snapshot?: number | null
          damaged_base_quantity?: number
          dispatched_base_quantity?: number
          id?: string
          missing_base_quantity?: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          received_base_quantity?: number
          requested_quantity: number
          transfer_id: string
          transfer_unit_cost?: number | null
        }
        Update: {
          conversion_snapshot?: number | null
          damaged_base_quantity?: number
          dispatched_base_quantity?: number
          id?: string
          missing_base_quantity?: number
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          received_base_quantity?: number
          requested_quantity?: number
          transfer_id?: string
          transfer_unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_line_packaging_fk"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_line_transfer_fk"
            columns: ["organization_id", "transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_line_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          destination_branch_id: string
          destination_location_id: string
          destination_warehouse_id: string
          dispatched_by: string | null
          dispatched_transaction_id: string | null
          external_reference: string | null
          id: string
          notes: string | null
          organization_id: string
          received_at: string | null
          source_branch_id: string
          source_location_id: string
          source_warehouse_id: string
          status: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          destination_branch_id: string
          destination_location_id: string
          destination_warehouse_id: string
          dispatched_by?: string | null
          dispatched_transaction_id?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          received_at?: string | null
          source_branch_id: string
          source_location_id: string
          source_warehouse_id: string
          status?: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          destination_branch_id?: string
          destination_location_id?: string
          destination_warehouse_id?: string
          dispatched_by?: string | null
          dispatched_transaction_id?: string | null
          external_reference?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          received_at?: string | null
          source_branch_id?: string
          source_location_id?: string
          source_warehouse_id?: string
          status?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_destination_branch_fk"
            columns: ["organization_id", "destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_destination_location_fk"
            columns: ["organization_id", "destination_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_destination_warehouse_fk"
            columns: ["organization_id", "destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_source_branch_fk"
            columns: ["organization_id", "source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_source_location_fk"
            columns: ["organization_id", "source_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfer_source_warehouse_fk"
            columns: ["organization_id", "source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "stock_transfers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          branch_id: string
          code: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          location_type: string
          name: string
          organization_id: string
          parent_location_id: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          branch_id: string
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_type: string
          name: string
          organization_id: string
          parent_location_id?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          branch_id?: string
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location_type?: string
          name?: string
          organization_id?: string
          parent_location_id?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "storage_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_locations_parent_fk"
            columns: ["organization_id", "parent_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "storage_locations_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_addresses: {
        Row: {
          address_type: string
          city: string | null
          country_code: string
          created_at: string
          id: string
          is_primary: boolean
          line_1: string
          line_2: string | null
          organization_id: string
          postal_code: string | null
          state_region: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          address_type: string
          city?: string | null
          country_code: string
          created_at?: string
          id?: string
          is_primary?: boolean
          line_1: string
          line_2?: string | null
          organization_id: string
          postal_code?: string | null
          state_region?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          address_type?: string
          city?: string | null
          country_code?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          line_1?: string
          line_2?: string | null
          organization_id?: string
          postal_code?: string | null
          state_region?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_addresses_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_finance: boolean
          is_primary: boolean
          is_procurement: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          status: string
          supplier_id: string
          title: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_finance?: boolean
          is_primary?: boolean
          is_procurement?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          status?: string
          supplier_id: string
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_finance?: boolean
          is_primary?: boolean
          is_procurement?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: string
          supplier_id?: string
          title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_credit_allocations: {
        Row: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          supplier_credit_id: string
          supplier_invoice_id: string
        }
        Insert: {
          allocated_amount: number
          allocated_base_amount: number
          allocation_date: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          supplier_credit_id: string
          supplier_invoice_id: string
        }
        Update: {
          allocated_amount?: number
          allocated_base_amount?: number
          allocation_date?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          supplier_credit_id?: string
          supplier_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_credit_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_credit_allocations_organization_id_supplier_credi_fkey"
            columns: ["organization_id", "supplier_credit_id"]
            isOneToOne: false
            referencedRelation: "supplier_credits"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_credit_allocations_organization_id_supplier_invoi_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_credit_allocations_organization_id_supplier_invoi_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_credits: {
        Row: {
          amount: number
          base_currency_amount: number
          created_at: string
          credit_date: string
          credit_number: string
          currency: string
          exchange_rate: number
          id: string
          organization_id: string
          purchase_return_id: string | null
          reason: string
          status: string
          supplier_id: string
          supplier_invoice_id: string | null
        }
        Insert: {
          amount: number
          base_currency_amount: number
          created_at?: string
          credit_date: string
          credit_number: string
          currency: string
          exchange_rate: number
          id?: string
          organization_id: string
          purchase_return_id?: string | null
          reason: string
          status?: string
          supplier_id: string
          supplier_invoice_id?: string | null
        }
        Update: {
          amount?: number
          base_currency_amount?: number
          created_at?: string
          credit_date?: string
          credit_number?: string
          currency?: string
          exchange_rate?: number
          id?: string
          organization_id?: string
          purchase_return_id?: string | null
          reason?: string
          status?: string
          supplier_id?: string
          supplier_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_credits_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_credits_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_credits_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_credits_purchase_return_fk"
            columns: ["organization_id", "purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_documents: {
        Row: {
          created_at: string
          created_by: string
          document_type: string
          file_name: string
          id: string
          media_type: string
          notes: string | null
          organization_id: string
          size_bytes: number
          storage_path: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_type: string
          file_name: string
          id?: string
          media_type: string
          notes?: string | null
          organization_id: string
          size_bytes: number
          storage_path: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_type?: string
          file_name?: string
          id?: string
          media_type?: string
          notes?: string | null
          organization_id?: string
          size_bytes?: number
          storage_path?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_invoice_lines: {
        Row: {
          description: string
          discount: number
          goods_receipt_line_id: string | null
          id: string
          line_total: number
          match_variance_base: number
          organization_id: string
          product_variant_id: string | null
          purchase_order_line_id: string | null
          quantity: number
          supplier_invoice_id: string
          tax: number
          unit_price: number
        }
        Insert: {
          description: string
          discount?: number
          goods_receipt_line_id?: string | null
          id?: string
          line_total: number
          match_variance_base?: number
          organization_id: string
          product_variant_id?: string | null
          purchase_order_line_id?: string | null
          quantity: number
          supplier_invoice_id: string
          tax?: number
          unit_price: number
        }
        Update: {
          description?: string
          discount?: number
          goods_receipt_line_id?: string | null
          id?: string
          line_total?: number
          match_variance_base?: number
          organization_id?: string
          product_variant_id?: string | null
          purchase_order_line_id?: string | null
          quantity?: number
          supplier_invoice_id?: string
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_goods_receipt_line__fkey"
            columns: ["organization_id", "goods_receipt_line_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_purchase_order_line_fkey"
            columns: ["organization_id", "purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_purchase_order_line_fkey"
            columns: ["organization_id", "purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_outstanding"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_lines_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_invoice_links: {
        Row: {
          goods_receipt_id: string
          organization_id: string
          purchase_order_id: string
          supplier_invoice_id: string
        }
        Insert: {
          goods_receipt_id: string
          organization_id: string
          purchase_order_id: string
          supplier_invoice_id: string
        }
        Update: {
          goods_receipt_id?: string
          organization_id?: string
          purchase_order_id?: string
          supplier_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_links_organization_id_goods_receipt_id_fkey"
            columns: ["organization_id", "goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_links_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_links_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_invoice_links_organization_id_supplier_invoice_id_fkey"
            columns: ["organization_id", "supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          amount_paid_base: number
          approved_at: string | null
          approved_by: string | null
          attachment_path: string | null
          base_currency: string
          base_currency_total: number
          created_at: string
          created_by: string
          currency: string
          discount: number
          due_date: string | null
          exchange_rate: number
          freight_charges: number
          id: string
          invoice_date: string
          invoice_number: string
          match_status: string
          notes: string | null
          organization_id: string
          status: string
          subtotal: number
          supplier_id: string
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid_base?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_path?: string | null
          base_currency: string
          base_currency_total: number
          created_at?: string
          created_by: string
          currency: string
          discount?: number
          due_date?: string | null
          exchange_rate: number
          freight_charges?: number
          id?: string
          invoice_date: string
          invoice_number: string
          match_status?: string
          notes?: string | null
          organization_id: string
          status?: string
          subtotal: number
          supplier_id: string
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          amount_paid_base?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_path?: string | null
          base_currency?: string
          base_currency_total?: number
          created_at?: string
          created_by?: string
          currency?: string
          discount?: number
          due_date?: string | null
          exchange_rate?: number
          freight_charges?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          match_status?: string
          notes?: string | null
          organization_id?: string
          status?: string
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_price_history: {
        Row: {
          base_currency: string
          base_currency_price: number
          created_at: string
          currency: string
          effective_date: string
          exchange_rate: number
          id: string
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quoted_price: number
          source_quotation_id: string | null
          supplier_id: string
        }
        Insert: {
          base_currency: string
          base_currency_price: number
          created_at?: string
          currency: string
          effective_date: string
          exchange_rate: number
          id?: string
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quoted_price: number
          source_quotation_id?: string | null
          supplier_id: string
        }
        Update: {
          base_currency?: string
          base_currency_price?: number
          created_at?: string
          currency?: string
          effective_date?: string
          exchange_rate?: number
          id?: string
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          quoted_price?: number
          source_quotation_id?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_price_history_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_price_history_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_price_history_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_preferred: boolean
          last_quoted_price: number | null
          lead_time_days: number
          minimum_order_quantity: number
          order_multiple: number
          organization_id: string
          preferred_packaging_id: string | null
          product_variant_id: string
          supplier_description: string | null
          supplier_id: string
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_preferred?: boolean
          last_quoted_price?: number | null
          lead_time_days?: number
          minimum_order_quantity?: number
          order_multiple?: number
          organization_id: string
          preferred_packaging_id?: string | null
          product_variant_id: string
          supplier_description?: string | null
          supplier_id: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_preferred?: boolean
          last_quoted_price?: number | null
          lead_time_days?: number
          minimum_order_quantity?: number
          order_multiple?: number
          organization_id?: string
          preferred_packaging_id?: string | null
          product_variant_id?: string
          supplier_description?: string | null
          supplier_id?: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_organization_id_preferred_packaging_id_fkey"
            columns: ["organization_id", "preferred_packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_products_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_products_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_quotation_lines: {
        Row: {
          awarded_quantity: number
          conversion_snapshot: number
          discount: number
          expected_delivery_date: string | null
          id: string
          is_alternative: boolean
          line_total: number
          offered_quantity: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quotation_id: string
          rfq_line_id: string | null
          tax: number
          unit_price: number
        }
        Insert: {
          awarded_quantity?: number
          conversion_snapshot: number
          discount?: number
          expected_delivery_date?: string | null
          id?: string
          is_alternative?: boolean
          line_total: number
          offered_quantity: number
          organization_id: string
          packaging_id: string
          product_variant_id: string
          quotation_id: string
          rfq_line_id?: string | null
          tax?: number
          unit_price: number
        }
        Update: {
          awarded_quantity?: number
          conversion_snapshot?: number
          discount?: number
          expected_delivery_date?: string | null
          id?: string
          is_alternative?: boolean
          line_total?: number
          offered_quantity?: number
          organization_id?: string
          packaging_id?: string
          product_variant_id?: string
          quotation_id?: string
          rfq_line_id?: string | null
          tax?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotation_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_quotation_lines_organization_id_product_variant_i_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_quotation_lines_organization_id_quotation_id_fkey"
            columns: ["organization_id", "quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_quotations: {
        Row: {
          attachment_path: string | null
          base_currency: string
          created_at: string
          created_by: string
          currency: string
          delivery_period_days: number | null
          discount: number
          exchange_rate: number
          expiry_date: string | null
          freight: number
          id: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          quote_date: string
          quote_number: string
          rfq_id: string
          shipping_terms: string | null
          status: string
          subtotal: number
          supplier_id: string
          tax: number
          total: number
        }
        Insert: {
          attachment_path?: string | null
          base_currency: string
          created_at?: string
          created_by: string
          currency: string
          delivery_period_days?: number | null
          discount?: number
          exchange_rate: number
          expiry_date?: string | null
          freight?: number
          id?: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          quote_date: string
          quote_number: string
          rfq_id: string
          shipping_terms?: string | null
          status?: string
          subtotal: number
          supplier_id: string
          tax?: number
          total: number
        }
        Update: {
          attachment_path?: string | null
          base_currency?: string
          created_at?: string
          created_by?: string
          currency?: string
          delivery_period_days?: number | null
          discount?: number
          exchange_rate?: number
          expiry_date?: string | null
          freight?: number
          id?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          quote_date?: string
          quote_number?: string
          rfq_id?: string
          shipping_terms?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_organization_id_rfq_id_fkey"
            columns: ["organization_id", "rfq_id"]
            isOneToOne: false
            referencedRelation: "request_for_quotations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "supplier_quotations_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      suppliers: {
        Row: {
          alternate_phone: string | null
          created_at: string
          created_by: string
          credit_limit: number
          default_currency: string
          default_payment_terms: string | null
          email: string | null
          id: string
          lead_time_days: number
          legal_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          registration_number: string | null
          status: string
          supplier_code: string
          supplier_type: string
          tax_number: string | null
          trading_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          alternate_phone?: string | null
          created_at?: string
          created_by: string
          credit_limit?: number
          default_currency: string
          default_payment_terms?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number
          legal_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          registration_number?: string | null
          status?: string
          supplier_code: string
          supplier_type?: string
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          alternate_phone?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number
          default_currency?: string
          default_payment_terms?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number
          legal_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          registration_number?: string | null
          status?: string
          supplier_code?: string
          supplier_type?: string
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_profiles: {
        Row: {
          calculation: string
          code: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          rate: number
          tax_treatment: string
          updated_at: string
        }
        Insert: {
          calculation?: string
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          rate: number
          tax_treatment?: string
          updated_at?: string
        }
        Update: {
          calculation?: string
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          rate?: number
          tax_treatment?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          created_at: string
          created_by: string
          dimension: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          organization_id: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dimension: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          organization_id: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dimension?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_of_measure_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_option_values: {
        Row: {
          created_at: string
          organization_id: string
          product_option_id: string
          product_option_value_id: string
          product_variant_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          product_option_id: string
          product_option_value_id: string
          product_variant_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          product_option_id?: string
          product_option_value_id?: string
          product_variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_fk"
            columns: ["organization_id", "product_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "variant_option_values_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_value_fk"
            columns: ["organization_id", "product_option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          branch_id: string
          business_id: string
          city: string | null
          code: string
          country_code: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          postal_code: string | null
          region: string | null
          status: string
          updated_at: string
          warehouse_type: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          branch_id: string
          business_id: string
          city?: string | null
          code: string
          country_code?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          postal_code?: string | null
          region?: string | null
          status?: string
          updated_at?: string
          warehouse_type?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          branch_id?: string
          business_id?: string
          city?: string | null
          code?: string
          country_code?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          postal_code?: string | null
          region?: string | null
          status?: string
          updated_at?: string
          warehouse_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "warehouses_business_fk"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bank_match_suggestions: {
        Row: {
          date_distance: number | null
          organization_id: string | null
          source_amount: number | null
          source_date: string | null
          source_id: string | null
          source_reference: string | null
          source_type: string | null
          statement_line_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_exposure: {
        Row: {
          confirmed_commitments_base: number | null
          customer_id: string | null
          exposure_base: number | null
          organization_id: string | null
          outstanding_receivables_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoice_settlement: {
        Row: {
          amount_paid_base: number | null
          base_currency: string | null
          base_currency_total: number | null
          billing_address_snapshot: Json | null
          branch_id: string | null
          business_id: string | null
          created_at: string | null
          created_by: string | null
          credit_allocated_base: number | null
          credit_note_total_base: number | null
          currency: string | null
          customer_id: string | null
          customer_name_snapshot: string | null
          discount: number | null
          due_date: string | null
          exchange_rate: number | null
          id: string | null
          idempotency_key: string | null
          invoice_date: string | null
          invoice_number: string | null
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          organization_id: string | null
          outstanding_base: number | null
          payment_allocated_base: number | null
          payment_terms: string | null
          request_hash: string | null
          sales_order_id: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid_base?: number | null
          base_currency?: string | null
          base_currency_total?: number | null
          billing_address_snapshot?: Json | null
          branch_id?: string | null
          business_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_allocated_base?: never
          credit_note_total_base?: number | null
          currency?: string | null
          customer_id?: string | null
          customer_name_snapshot?: string | null
          discount?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string | null
          idempotency_key?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id?: string | null
          outstanding_base?: never
          payment_allocated_base?: never
          payment_terms?: string | null
          request_hash?: string | null
          sales_order_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid_base?: number | null
          base_currency?: string | null
          base_currency_total?: number | null
          billing_address_snapshot?: Json | null
          branch_id?: string | null
          business_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_allocated_base?: never
          credit_note_total_base?: number | null
          currency?: string | null
          customer_id?: string | null
          customer_name_snapshot?: string | null
          discount?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          id?: string | null
          idempotency_key?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id?: string | null
          outstanding_base?: never
          payment_allocated_base?: never
          payment_terms?: string | null
          request_hash?: string | null
          sales_order_id?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_business_id_fkey"
            columns: ["organization_id", "business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_receivables: {
        Row: {
          customer_id: string | null
          oldest_due_date: string | null
          organization_id: string | null
          outstanding_base: number | null
          overdue_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "customer_invoices_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      customer_statement_transactions: {
        Row: {
          credit_base: number | null
          customer_id: string | null
          debit_base: number | null
          document_id: string | null
          document_number: string | null
          document_type: string | null
          organization_id: string | null
          transaction_date: string | null
        }
        Relationships: []
      }
      customer_unapplied_credit_documents: {
        Row: {
          currency: string | null
          customer_id: string | null
          document_number: string | null
          organization_id: string | null
          source_id: string | null
          source_type: string | null
          unapplied_amount: number | null
        }
        Relationships: []
      }
      customer_unapplied_credits: {
        Row: {
          amount: number | null
          currency: string | null
          customer_id: string | null
          organization_id: string | null
          payment_id: string | null
          payment_number: string | null
          unapplied_amount: number | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          customer_id?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_number?: string | null
          unapplied_amount?: never
        }
        Update: {
          amount?: number | null
          currency?: string | null
          customer_id?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_number?: string | null
          unapplied_amount?: never
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "payments_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reconciliation: {
        Row: {
          gl_balance: number | null
          organization_id: string | null
          reconciliation_type: string | null
          subledger_balance: number | null
        }
        Relationships: []
      }
      financial_statement_balances: {
        Row: {
          account_code: string | null
          account_type: string | null
          balance: number | null
          name: string | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          account_type: string | null
          base_credit: number | null
          base_debit: number | null
          branch_id: string | null
          customer_id: string | null
          description: string | null
          journal_date: string | null
          journal_description: string | null
          journal_id: string | null
          journal_number: string | null
          line_number: number | null
          organization_id: string | null
          period_id: string | null
          product_id: string | null
          running_balance: number | null
          source_id: string | null
          source_module: string | null
          source_type: string | null
          supplier_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_organization_id_account_id_fkey"
            columns: ["organization_id", "account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_account_id_fkey"
            columns: ["organization_id", "account_id"]
            isOneToOne: false
            referencedRelation: "trial_balance"
            referencedColumns: ["organization_id", "account_id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_product_id_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "journal_lines_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_availability: {
        Row: {
          available_base_quantity: number | null
          average_unit_cost: number | null
          branch_id: string | null
          inventory_value: number | null
          last_movement_at: string | null
          on_hand_base_quantity: number | null
          organization_id: string | null
          product_variant_id: string | null
          reserved_base_quantity: number | null
          storage_location_id: string | null
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          available_base_quantity?: never
          average_unit_cost?: number | null
          branch_id?: string | null
          inventory_value?: number | null
          last_movement_at?: string | null
          on_hand_base_quantity?: number | null
          organization_id?: string | null
          product_variant_id?: string | null
          reserved_base_quantity?: number | null
          storage_location_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          available_base_quantity?: never
          average_unit_cost?: number | null
          branch_id?: string | null
          inventory_value?: number | null
          last_movement_at?: string | null
          on_hand_base_quantity?: number | null
          organization_id?: string | null
          product_variant_id?: string | null
          reserved_base_quantity?: number | null
          storage_location_id?: string | null
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balance_branch_fk"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_location_fk"
            columns: ["organization_id", "storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_variant_fk"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balance_warehouse_fk"
            columns: ["organization_id", "warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "inventory_balances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_settlement_balances: {
        Row: {
          account_code: string | null
          account_id: string | null
          currency: string | null
          name: string | null
          operational_balance: number | null
          organization_id: string | null
        }
        Insert: {
          account_code?: string | null
          account_id?: string | null
          currency?: string | null
          name?: string | null
          operational_balance?: never
          organization_id?: string | null
        }
        Update: {
          account_code?: string | null
          account_id?: string | null
          currency?: string | null
          name?: string | null
          operational_balance?: never
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_daily_summary: {
        Row: {
          average_transaction: number | null
          branch_id: string | null
          currency: string | null
          discounts: number | null
          gross_sales: number | null
          organization_id: string | null
          sale_date: string | null
          tax: number | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_receipts: {
        Row: {
          branch_id: string | null
          branch_name: string | null
          cash_tendered: number | null
          cashier_user_id: string | null
          change_due: number | null
          completed_at: string | null
          currency: string | null
          customer_id: string | null
          customer_invoice_id: string | null
          customer_name: string | null
          discount: number | null
          fulfilment_id: string | null
          id: string | null
          inventory_transaction_id: string | null
          invoice_number: string | null
          local_created_at: string | null
          local_transaction_id: string | null
          offline_device_id: string | null
          organization_id: string | null
          originated_offline: boolean | null
          receipt_number: string | null
          sales_order_id: string | null
          server_received_at: string | null
          session_id: string | null
          settlements: Json | null
          status: string | null
          subtotal: number | null
          tax: number | null
          terminal_code: string | null
          terminal_id: string | null
          terminal_name: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_offline_device_fk"
            columns: ["organization_id", "offline_device_id"]
            isOneToOne: false
            referencedRelation: "offline_devices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_exposure"
            referencedColumns: ["organization_id", "customer_id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_id_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoice_settlement"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_customer_invoice_id_fkey"
            columns: ["organization_id", "customer_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_fulfilment_id_fkey"
            columns: ["organization_id", "fulfilment_id"]
            isOneToOne: false
            referencedRelation: "sales_fulfillments"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_inventory_transaction_id_fkey"
            columns: ["organization_id", "inventory_transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_sales_order_id_fkey"
            columns: ["organization_id", "sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_session_summaries"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_session_id_fkey"
            columns: ["organization_id", "session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sales_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      pos_session_summaries: {
        Row: {
          approved_by: string | null
          branch_id: string | null
          cashier_user_id: string | null
          closed_at: string | null
          closing_notes: string | null
          counted_cash: number | null
          created_at: string | null
          expected_cash: number | null
          id: string | null
          live_expected_cash: number | null
          opened_at: string | null
          opening_float: number | null
          opening_notes: string | null
          organization_id: string | null
          sales_total: number | null
          session_number: string | null
          status: string | null
          terminal_code: string | null
          terminal_id: string | null
          terminal_name: string | null
          transaction_count: number | null
          variance: number | null
          variance_reason: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_organization_id_branch_id_fkey"
            columns: ["organization_id", "branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "pos_sessions_organization_id_terminal_id_fkey"
            columns: ["organization_id", "terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      purchase_order_outstanding: {
        Row: {
          accepted_base_quantity: number | null
          conversion_snapshot: number | null
          discount: number | null
          id: string | null
          line_total: number | null
          ordered_base_quantity: number | null
          ordered_quantity: number | null
          organization_id: string | null
          outstanding_base_quantity: number | null
          packaging_id: string | null
          product_description_snapshot: string | null
          product_variant_id: string | null
          purchase_order_id: string | null
          rejected_base_quantity: number | null
          supplier_item_code_snapshot: string | null
          tax: number | null
          unit_price: number | null
        }
        Insert: {
          accepted_base_quantity?: number | null
          conversion_snapshot?: number | null
          discount?: number | null
          id?: string | null
          line_total?: number | null
          ordered_base_quantity?: number | null
          ordered_quantity?: number | null
          organization_id?: string | null
          outstanding_base_quantity?: never
          packaging_id?: string | null
          product_description_snapshot?: string | null
          product_variant_id?: string | null
          purchase_order_id?: string | null
          rejected_base_quantity?: number | null
          supplier_item_code_snapshot?: string | null
          tax?: number | null
          unit_price?: number | null
        }
        Update: {
          accepted_base_quantity?: number | null
          conversion_snapshot?: number | null
          discount?: number | null
          id?: string | null
          line_total?: number | null
          ordered_base_quantity?: number | null
          ordered_quantity?: number | null
          organization_id?: string | null
          outstanding_base_quantity?: never
          packaging_id?: string | null
          product_description_snapshot?: string | null
          product_variant_id?: string | null
          purchase_order_id?: string | null
          rejected_base_quantity?: number | null
          supplier_item_code_snapshot?: string | null
          tax?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_organization_id_packaging_id_fkey"
            columns: ["organization_id", "packaging_id"]
            isOneToOne: false
            referencedRelation: "product_variant_packaging"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_order_lines_organization_id_product_variant_id_fkey"
            columns: ["organization_id", "product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "purchase_order_lines_organization_id_purchase_order_id_fkey"
            columns: ["organization_id", "purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_advances: {
        Row: {
          amount: number | null
          currency: string | null
          organization_id: string | null
          payment_id: string | null
          payment_number: string | null
          supplier_id: string | null
          unapplied_amount: number | null
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_number?: string | null
          supplier_id?: string | null
          unapplied_amount?: never
        }
        Update: {
          amount?: number | null
          currency?: string | null
          organization_id?: string | null
          payment_id?: string | null
          payment_number?: string | null
          supplier_id?: string | null
          unapplied_amount?: never
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_invoice_settlement: {
        Row: {
          amount_paid_base: number | null
          approved_at: string | null
          approved_by: string | null
          attachment_path: string | null
          base_currency: string | null
          base_currency_total: number | null
          created_at: string | null
          created_by: string | null
          credit_allocated_base: number | null
          currency: string | null
          discount: number | null
          due_date: string | null
          exchange_rate: number | null
          freight_charges: number | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          match_status: string | null
          notes: string | null
          organization_id: string | null
          outstanding_base: number | null
          payment_allocated_base: number | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid_base?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_path?: string | null
          base_currency?: string | null
          base_currency_total?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_allocated_base?: never
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          freight_charges?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          match_status?: string | null
          notes?: string | null
          organization_id?: string | null
          outstanding_base?: never
          payment_allocated_base?: never
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid_base?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_path?: string | null
          base_currency?: string | null
          base_currency_total?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_allocated_base?: never
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          exchange_rate?: number | null
          freight_charges?: number | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          match_status?: string | null
          notes?: string | null
          organization_id?: string | null
          outstanding_base?: never
          payment_allocated_base?: never
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_payables: {
        Row: {
          organization_id: string | null
          outstanding_base: number | null
          supplier_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_organization_id_supplier_id_fkey"
            columns: ["organization_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      supplier_statement_transactions: {
        Row: {
          credit_base: number | null
          debit_base: number | null
          document_id: string | null
          document_number: string | null
          document_type: string | null
          organization_id: string | null
          supplier_id: string | null
          transaction_date: string | null
        }
        Relationships: []
      }
      trial_balance: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_type: string | null
          credit_balance: number | null
          debit_balance: number | null
          name: string | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abandon_pos_cart: {
        Args: { target_cart_id: string; target_organization_id: string }
        Returns: undefined
      }
      accept_team_invitation: {
        Args: { target_token: string }
        Returns: string
      }
      act_on_approval: {
        Args: {
          target_action: string
          target_approval_request_id: string
          target_comments: string
          target_organization_id: string
        }
        Returns: string
      }
      activate_accounting: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      add_customer_address: {
        Args: {
          target_address: Json
          target_customer_id: string
          target_organization_id: string
        }
        Returns: string
      }
      add_customer_contact: {
        Args: {
          target_contact: Json
          target_customer_id: string
          target_organization_id: string
        }
        Returns: string
      }
      add_supplier_product: {
        Args: {
          target_description: string
          target_lead_days: number
          target_minimum: number
          target_multiple: number
          target_organization_id: string
          target_packaging_id: string
          target_preferred: boolean
          target_supplier_id: string
          target_supplier_sku: string
          target_variant_id: string
        }
        Returns: string
      }
      allocate_customer_credit: {
        Args: {
          target_amount: number
          target_credit_note_id: string
          target_invoice_id: string
          target_organization_id: string
        }
        Returns: string
      }
      allocate_existing_payment: {
        Args: {
          target_allocations: Json
          target_organization_id: string
          target_payment_id: string
        }
        Returns: Json
      }
      allocate_landed_cost: {
        Args: {
          target_amount: number
          target_cost_type: string
          target_currency: string
          target_description: string
          target_exchange_rate: number
          target_goods_receipt_id: string
          target_manual_allocations?: Json
          target_method: string
          target_organization_id: string
        }
        Returns: string
      }
      allocate_supplier_credit: {
        Args: {
          target_amount: number
          target_organization_id: string
          target_supplier_credit_id: string
          target_supplier_invoice_id: string
        }
        Returns: string
      }
      approve_expense: {
        Args: {
          target_approve: boolean
          target_comments: string
          target_expense_id: string
          target_organization_id: string
        }
        Returns: string
      }
      approve_purchase_order: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_purchase_order_id: string
        }
        Returns: string
      }
      approve_supplier_invoice: {
        Args: { target_invoice_id: string; target_organization_id: string }
        Returns: undefined
      }
      assert_organization_feature: {
        Args: {
          target_feature_code: string
          target_organization_id: string
          write_required?: boolean
        }
        Returns: undefined
      }
      assert_organization_limit: {
        Args: {
          current_usage: number
          target_feature_code: string
          target_organization_id: string
        }
        Returns: undefined
      }
      assert_team_actor: {
        Args: { target_organization_id: string; target_permission: string }
        Returns: string
      }
      assign_team_member_roles: {
        Args: {
          target_membership_id: string
          target_organization_id: string
          target_role_ids: string[]
        }
        Returns: string
      }
      award_quotation: {
        Args: {
          target_awards: Json
          target_organization_id: string
          target_quotation_id: string
        }
        Returns: undefined
      }
      can_access_branch: {
        Args: { target_branch_id: string; target_organization_id: string }
        Returns: boolean
      }
      can_assign_role: {
        Args: { target_organization_id: string; target_role_id: string }
        Returns: boolean
      }
      can_grant_permission: {
        Args: { target_organization_id: string; target_permission_id: string }
        Returns: boolean
      }
      cancel_organization_subscription: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      cancel_sales_order: {
        Args: { target_organization_id: string; target_sales_order_id: string }
        Returns: Json
      }
      close_pos_session: {
        Args: {
          target_counted_cash: number
          target_notes: string
          target_organization_id: string
          target_session_id: string
          target_variance_reason: string
        }
        Returns: Json
      }
      confirm_sales_order: {
        Args: {
          target_allow_backorder?: boolean
          target_credit_override?: boolean
          target_organization_id: string
          target_sales_order_id: string
        }
        Returns: Json
      }
      consume_sales_reservation: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_quantity: number
          target_reservation_id: string
        }
        Returns: string
      }
      convert_quotation_to_sales_order: {
        Args: {
          target_idempotency_key: string
          target_location_id: string
          target_organization_id: string
          target_quotation_id: string
          target_requested_delivery_date: string
          target_warehouse_id: string
        }
        Returns: string
      }
      create_customer: {
        Args: { target_customer: Json; target_organization_id: string }
        Returns: string
      }
      create_customer_invoice: {
        Args: {
          target_due_date: string
          target_fulfilment_ids: string[]
          target_idempotency_key: string
          target_invoice_date: string
          target_notes: string
          target_organization_id: string
          target_sales_order_id: string
        }
        Returns: string
      }
      create_expense: {
        Args: {
          target_amount: number
          target_branch_id: string
          target_currency: string
          target_date: string
          target_description: string
          target_expense_account_id: string
          target_organization_id: string
          target_payee: string
          target_payment_account_id: string
          target_payment_terms: string
          target_reference: string
          target_tax: number
        }
        Returns: string
      }
      create_gl_account: {
        Args: {
          target_code: string
          target_currency: string
          target_description: string
          target_name: string
          target_organization_id: string
          target_parent_id: string
          target_type: string
        }
        Returns: string
      }
      create_manual_journal: {
        Args: {
          target_date: string
          target_description: string
          target_lines: Json
          target_organization_id: string
        }
        Returns: string
      }
      create_organization: {
        Args: {
          country_code: string
          currency_code: string
          organization_name: string
          organization_slug: string
          organization_timezone: string
        }
        Returns: string
      }
      create_payment_account: {
        Args: {
          target_account_code: string
          target_account_type: string
          target_branch_id: string
          target_currency: string
          target_description: string
          target_name: string
          target_organization_id: string
        }
        Returns: string
      }
      create_payment_method: {
        Args: {
          target_allows_overpayment: boolean
          target_branch_id: string
          target_code: string
          target_default_account_id: string
          target_method_type: string
          target_name: string
          target_organization_id: string
          target_requires_approval: boolean
          target_requires_reference: boolean
        }
        Returns: string
      }
      create_pos_terminal: {
        Args: {
          target_branch_id: string
          target_cash_account_id: string
          target_code: string
          target_customer_id: string
          target_location_id: string
          target_name: string
          target_organization_id: string
          target_receipt_footer: string
          target_receipt_width: string
          target_warehouse_id: string
        }
        Returns: string
      }
      create_purchase_order: {
        Args: {
          target_branch_id: string
          target_business_id: string
          target_currency: string
          target_exchange_rate: number
          target_expected_date: string
          target_lines: Json
          target_location_id: string
          target_notes: string
          target_order_date: string
          target_organization_id: string
          target_payment_terms: string
          target_supplier_id: string
          target_warehouse_id: string
        }
        Returns: string
      }
      create_purchase_requisition: {
        Args: {
          target_branch_id: string
          target_business_id: string
          target_department: string
          target_justification: string
          target_lines: Json
          target_organization_id: string
          target_priority: string
          target_required_by: string
        }
        Returns: string
      }
      create_rfq: {
        Args: {
          target_branch_id: string
          target_business_id: string
          target_deadline: string
          target_lines: Json
          target_location_id: string
          target_notes: string
          target_organization_id: string
          target_required_date: string
          target_requisition_id: string
          target_supplier_ids: string[]
          target_terms: string
        }
        Returns: string
      }
      create_sales_fulfilment: {
        Args: {
          target_fulfilled_at: string
          target_idempotency_key: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_sales_order_id: string
        }
        Returns: string
      }
      create_sales_order: {
        Args: {
          target_billing_address: Json
          target_branch_id: string
          target_business_id: string
          target_currency: string
          target_customer_id: string
          target_delivery_address: Json
          target_exchange_rate: number
          target_idempotency_key: string
          target_lines: Json
          target_location_id: string
          target_notes: string
          target_organization_id: string
          target_price_list_id: string
          target_requested_delivery_date: string
          target_warehouse_id: string
        }
        Returns: string
      }
      create_sales_quotation: {
        Args: {
          target_billing_address: Json
          target_branch_id: string
          target_business_id: string
          target_currency: string
          target_customer_id: string
          target_delivery_address: Json
          target_exchange_rate: number
          target_expiry_date: string
          target_idempotency_key: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_price_list_id: string
          target_terms: string
        }
        Returns: string
      }
      create_sales_return: {
        Args: {
          target_fulfilment_id: string
          target_idempotency_key: string
          target_invoice_id: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_reason_id: string
        }
        Returns: string
      }
      create_simple_product: {
        Args: {
          product_name: string
          target_barcode: string
          target_brand_id: string
          target_business_id: string
          target_category_id: string
          target_idempotency_key: string
          target_organization_id: string
          target_price: number
          target_price_list_id: string
          target_product_type: string
          target_reference_cost: number
          target_reorder_point: number
          target_sku: string
          target_tax_profile_id: string
          target_track_inventory: boolean
          target_unit_id: string
        }
        Returns: string
      }
      create_stock_count: {
        Args: {
          target_blind: boolean
          target_branch_id: string
          target_business_id: string
          target_count_type: string
          target_organization_id: string
          target_storage_location_id: string
          target_variant_ids?: string[]
          target_warehouse_id: string
        }
        Returns: string
      }
      create_stock_transfer: {
        Args: {
          target_business_id: string
          target_destination_location_id: string
          target_external_reference: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_source_location_id: string
        }
        Returns: string
      }
      create_supplier: {
        Args: {
          target_code: string
          target_currency: string
          target_email: string
          target_legal_name: string
          target_notes: string
          target_organization_id: string
          target_payment_terms: string
          target_phone: string
          target_trading_name: string
          target_type: string
        }
        Returns: string
      }
      create_team_role: {
        Args: {
          target_description: string
          target_name: string
          target_organization_id: string
          target_permission_ids: string[]
        }
        Returns: string
      }
      create_variant_product: {
        Args: {
          option_definitions: Json
          product_name: string
          target_brand_id: string
          target_business_id: string
          target_category_id: string
          target_idempotency_key: string
          target_organization_id: string
          target_product_type: string
          target_reference_cost: number
          target_tax_profile_id: string
          target_track_inventory: boolean
          variant_definitions: Json
        }
        Returns: string
      }
      create_warehouse: {
        Args: {
          make_default: boolean
          target_branch_id: string
          target_warehouse_type: string
          warehouse_code: string
          warehouse_description: string
          warehouse_name: string
        }
        Returns: string
      }
      dispatch_stock_transfer: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_transfer_id: string
        }
        Returns: Json
      }
      finalize_approved_customer_refund: {
        Args: { target_organization_id: string; target_refund_id: string }
        Returns: string
      }
      finance_account_balance: {
        Args: {
          target_account_type: string
          target_credits: number
          target_debits: number
        }
        Returns: number
      }
      finance_mapping: {
        Args: {
          target_branch_id?: string
          target_key: string
          target_organization_id: string
          target_payment_account_id?: string
        }
        Returns: string
      }
      finance_next_journal_number: {
        Args: { target_date: string; target_organization_id: string }
        Returns: string
      }
      finance_period_for_date: {
        Args: { target_date: string; target_organization_id: string }
        Returns: string
      }
      finance_post_lines: {
        Args: {
          target_created_by?: string
          target_date: string
          target_description: string
          target_lines: Json
          target_organization_id: string
          target_posting_version?: number
          target_source_id: string
          target_source_module: string
          target_source_type: string
        }
        Returns: string
      }
      finance_process_event: {
        Args: { target_event_id: string }
        Returns: string
      }
      finance_record_event: {
        Args: {
          target_date: string
          target_module: string
          target_organization_id: string
          target_payload: Json
          target_source_id: string
          target_type: string
        }
        Returns: string
      }
      generate_sku: {
        Args: { target_organization_id: string }
        Returns: string
      }
      get_effective_permissions: {
        Args: { target_organization_id: string }
        Returns: string[]
      }
      has_permission: {
        Args: { permission_code: string; target_organization_id: string }
        Returns: boolean
      }
      hold_pos_cart: {
        Args: {
          target_cart: Json
          target_cart_id?: string
          target_customer_id: string
          target_notes: string
          target_organization_id: string
          target_session_id: string
        }
        Returns: string
      }
      import_bank_statement: {
        Args: {
          target_file_name: string
          target_mapping: Json
          target_organization_id: string
          target_payment_account_id: string
          target_rows: Json
        }
        Returns: string
      }
      initialize_accounting: {
        Args: {
          target_activation_date: string
          target_base_currency: string
          target_fiscal_month: number
          target_organization_id: string
        }
        Returns: Json
      }
      inspect_sales_return: {
        Args: {
          target_lines: Json
          target_organization_id: string
          target_sales_return_id: string
        }
        Returns: undefined
      }
      invite_team_member: {
        Args: {
          target_branch_ids: string[]
          target_display_name: string
          target_email: string
          target_expires_at: string
          target_note: string
          target_organization_id: string
          target_role_id: string
          target_token: string
        }
        Returns: string
      }
      is_active_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args: { required_capability?: string }
        Returns: boolean
      }
      is_protected_owner: {
        Args: { target_membership_id: string; target_organization_id: string }
        Returns: boolean
      }
      issue_customer_credit_note: {
        Args: {
          target_base_amount: number
          target_idempotency_key: string
          target_invoice_id: string
          target_organization_id: string
          target_reason: string
          target_sales_return_id: string
        }
        Returns: string
      }
      issue_customer_invoice: {
        Args: { target_invoice_id: string; target_organization_id: string }
        Returns: Json
      }
      issue_offline_entitlement_lease: {
        Args: { target_device_id: string; target_organization_id: string }
        Returns: string
      }
      issue_rfq: {
        Args: { target_organization_id: string; target_rfq_id: string }
        Returns: undefined
      }
      manage_offline_device: {
        Args: {
          target_device_id: string
          target_label: string
          target_organization_id: string
          target_status: string
        }
        Returns: undefined
      }
      map_payment_account: {
        Args: {
          target_gl_account_id: string
          target_organization_id: string
          target_payment_account_id: string
        }
        Returns: undefined
      }
      match_bank_statement_line: {
        Args: {
          target_exclude: boolean
          target_line_id: string
          target_organization_id: string
          target_source_id: string
          target_source_type: string
        }
        Returns: undefined
      }
      next_inventory_number: {
        Args: { target_organization_id: string; target_prefix: string }
        Returns: string
      }
      next_payment_number: {
        Args: { target_organization_id: string; target_prefix: string }
        Returns: string
      }
      next_procurement_number: {
        Args: { target_organization_id: string; target_prefix: string }
        Returns: string
      }
      offline_lease_allows_sale: {
        Args: {
          target_device_id: string
          target_local_created_at: string
          target_organization_id: string
        }
        Returns: boolean
      }
      open_pos_session: {
        Args: {
          target_notes: string
          target_opening_float: number
          target_organization_id: string
          target_terminal_id: string
        }
        Returns: string
      }
      organization_access_mode: {
        Args: { target_organization_id: string }
        Returns: string
      }
      organization_entitlement: {
        Args: { target_feature_code: string; target_organization_id: string }
        Returns: Json
      }
      organization_has_feature: {
        Args: { target_feature_code: string; target_organization_id: string }
        Returns: boolean
      }
      organization_usage: {
        Args: { target_organization_id: string }
        Returns: Json
      }
      platform_change_subscription: {
        Args: {
          target_effective_at: string
          target_interval: string
          target_organization_id: string
          target_plan_id: string
          target_reason: string
          target_status: string
        }
        Returns: string
      }
      platform_create_plan: {
        Args: {
          target_annual_price: number
          target_code: string
          target_currency: string
          target_description: string
          target_is_public: boolean
          target_monthly_price: number
          target_name: string
          target_trial_days: number
        }
        Returns: string
      }
      platform_extend_trial: {
        Args: {
          target_new_end: string
          target_organization_id: string
          target_reason: string
        }
        Returns: undefined
      }
      platform_set_feature_flag: {
        Args: {
          target_enabled: boolean
          target_feature_code: string
          target_organization_id: string
          target_reason: string
          target_scope: string
        }
        Returns: string
      }
      platform_set_plan_entitlement: {
        Args: {
          target_enabled: boolean
          target_feature_code: string
          target_numeric_value: number
          target_plan_id: string
          target_reason: string
          target_text_value: string
          target_type: string
        }
        Returns: undefined
      }
      platform_set_tenant_suspension: {
        Args: {
          target_organization_id: string
          target_reason: string
          target_suspended: boolean
        }
        Returns: undefined
      }
      pos_expected_cash: {
        Args: { target_session_id: string }
        Returns: number
      }
      post_bank_transfer: {
        Args: {
          target_amount: number
          target_branch_id: string
          target_currency: string
          target_date: string
          target_destination_account_id: string
          target_fee: number
          target_organization_id: string
          target_reference: string
          target_source_account_id: string
        }
        Returns: string
      }
      post_customer_payment: {
        Args: {
          target_allocations: Json
          target_amount: number
          target_branch_id: string
          target_currency: string
          target_customer_id: string
          target_exchange_rate: number
          target_external_reference: string
          target_idempotency_key: string
          target_notes: string
          target_organization_id: string
          target_payment_date: string
          target_payment_method_id: string
          target_settlement_account_id: string
        }
        Returns: Json
      }
      post_customer_refund: {
        Args: {
          target_amount: number
          target_branch_id: string
          target_currency: string
          target_customer_id: string
          target_exchange_rate: number
          target_external_reference: string
          target_idempotency_key: string
          target_organization_id: string
          target_payment_method_id: string
          target_reason: string
          target_refund_date: string
          target_settlement_account_id: string
          target_source_credit_note_id: string
          target_source_payment_id: string
        }
        Returns: Json
      }
      post_expense: {
        Args: { target_expense_id: string; target_organization_id: string }
        Returns: string
      }
      post_goods_receipt: {
        Args: {
          target_allow_override: boolean
          target_idempotency_key: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_override_reason: string
          target_purchase_order_id: string
          target_received_at: string
          target_supplier_delivery_note: string
        }
        Returns: Json
      }
      post_inventory_transaction: {
        Args: {
          target_allow_negative_override?: boolean
          target_business_id: string
          target_client_created_at?: string
          target_client_transaction_id?: string
          target_device_id?: string
          target_external_reference: string
          target_idempotency_key: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_reason_code_id: string
          target_reference_id?: string
          target_reference_type?: string
          target_source?: string
          target_transaction_date: string
          target_transaction_type: string
        }
        Returns: Json
      }
      post_opening_balances: {
        Args: {
          target_date: string
          target_lines: Json
          target_organization_id: string
          target_reason: string
        }
        Returns: string
      }
      post_pos_sale: {
        Args: {
          target_cash_tendered: number
          target_customer_credit_amount: number
          target_customer_id: string
          target_held_cart_id: string
          target_idempotency_key: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_session_id: string
          target_settlements: Json
        }
        Returns: Json
      }
      post_purchase_return: {
        Args: {
          target_branch_id: string
          target_business_id: string
          target_grn_id: string
          target_idempotency_key: string
          target_lines: Json
          target_location_id: string
          target_notes: string
          target_organization_id: string
          target_po_id: string
          target_reason: string
          target_supplier_id: string
        }
        Returns: Json
      }
      post_sales_fulfilment: {
        Args: { target_fulfilment_id: string; target_organization_id: string }
        Returns: Json
      }
      post_sales_return: {
        Args: { target_organization_id: string; target_sales_return_id: string }
        Returns: Json
      }
      post_shared_payment: {
        Args: {
          target_allocations: Json
          target_amount: number
          target_branch_id: string
          target_counterparty_id: string
          target_counterparty_type: string
          target_currency: string
          target_exchange_rate: number
          target_external_reference: string
          target_idempotency_key: string
          target_notes: string
          target_organization_id: string
          target_payment_date: string
          target_payment_method_id: string
          target_settlement_account_id: string
        }
        Returns: Json
      }
      post_stock_count: {
        Args: {
          target_count_id: string
          target_idempotency_key: string
          target_organization_id: string
          target_reason_code_id: string
        }
        Returns: Json
      }
      post_supplier_payment: {
        Args: {
          target_allocations: Json
          target_amount: number
          target_branch_id: string
          target_currency: string
          target_exchange_rate: number
          target_external_reference: string
          target_idempotency_key: string
          target_notes: string
          target_organization_id: string
          target_payment_date: string
          target_payment_method_id: string
          target_settlement_account_id: string
          target_supplier_id: string
        }
        Returns: Json
      }
      purge_ephemeral_finance_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      purge_ephemeral_payment_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      purge_ephemeral_pos_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      purge_ephemeral_procurement_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      purge_ephemeral_sales_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      purge_ephemeral_team_verification: {
        Args: { target_organization_id: string }
        Returns: undefined
      }
      receive_stock_transfer: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_receipts: Json
          target_transfer_id: string
        }
        Returns: Json
      }
      reconcile_inventory_balances: {
        Args: { rebuild?: boolean; target_organization_id: string }
        Returns: Json
      }
      record_offline_sync_failure: {
        Args: {
          target_device_id: string
          target_error_code: string
          target_local_transaction_id: string
          target_organization_id: string
          target_status: string
        }
        Returns: string
      }
      record_platform_webhook_event: {
        Args: {
          target_event_id: string
          target_event_type: string
          target_payload_hash: string
          target_provider: string
        }
        Returns: boolean
      }
      record_pos_cash_event: {
        Args: {
          target_amount: number
          target_event_type: string
          target_organization_id: string
          target_reason: string
          target_session_id: string
        }
        Returns: string
      }
      record_pos_cash_refund: {
        Args: {
          target_organization_id: string
          target_refund_id: string
          target_session_id: string
        }
        Returns: string
      }
      record_pos_receipt_reprint: {
        Args: {
          target_organization_id: string
          target_reason: string
          target_sale_id: string
        }
        Returns: string
      }
      record_stock_count: {
        Args: {
          target_count_id: string
          target_lines: Json
          target_organization_id: string
        }
        Returns: undefined
      }
      record_supplier_invoice: {
        Args: {
          target_currency: string
          target_discount: number
          target_due_date: string
          target_exchange_rate: number
          target_freight: number
          target_grn_ids: string[]
          target_invoice_date: string
          target_invoice_number: string
          target_notes: string
          target_organization_id: string
          target_po_ids: string[]
          target_subtotal: number
          target_supplier_id: string
          target_tax: number
          target_total: number
        }
        Returns: string
      }
      record_supplier_quotation: {
        Args: {
          target_currency: string
          target_delivery_days: number
          target_discount: number
          target_exchange_rate: number
          target_expiry_date: string
          target_freight: number
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_payment_terms: string
          target_quote_date: string
          target_quote_number: string
          target_rfq_id: string
          target_shipping_terms: string
          target_supplier_id: string
          target_tax: number
        }
        Returns: string
      }
      refresh_customer_invoice_settlement: {
        Args: { target_invoice_id: string; target_organization_id: string }
        Returns: undefined
      }
      refresh_supplier_invoice_settlement: {
        Args: { target_invoice_id: string; target_organization_id: string }
        Returns: undefined
      }
      register_offline_device: {
        Args: {
          target_app_version: string
          target_branch_id: string
          target_device_identifier: string
          target_label: string
          target_organization_id: string
          target_terminal_id: string
        }
        Returns: string
      }
      release_inventory_reservation: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_quantity: number
          target_reservation_id: string
        }
        Returns: string
      }
      replay_offline_pos_sale: {
        Args: {
          target_cash_tendered: number
          target_customer_credit_amount: number
          target_customer_id: string
          target_device_id: string
          target_idempotency_key: string
          target_lines: Json
          target_local_created_at: string
          target_local_transaction_id: string
          target_notes: string
          target_organization_id: string
          target_session_id: string
          target_settlements: Json
        }
        Returns: Json
      }
      resend_team_invitation: {
        Args: {
          target_expires_at: string
          target_invitation_id: string
          target_organization_id: string
          target_token: string
        }
        Returns: string
      }
      reserve_inventory: {
        Args: {
          target_expires_at: string
          target_idempotency_key: string
          target_organization_id: string
          target_product_variant_id: string
          target_quantity: number
          target_source_id: string
          target_source_type: string
          target_storage_location_id: string
        }
        Returns: string
      }
      resolve_sales_price: {
        Args: {
          target_at?: string
          target_branch_id: string
          target_organization_id: string
          target_packaging_id: string
          target_price_list_id: string
          target_product_variant_id: string
          target_quantity: number
        }
        Returns: number
      }
      reverse_inventory_transaction: {
        Args: {
          target_idempotency_key: string
          target_notes: string
          target_organization_id: string
          target_transaction_id: string
        }
        Returns: Json
      }
      reverse_journal: {
        Args: {
          target_date: string
          target_journal_id: string
          target_organization_id: string
          target_reason: string
        }
        Returns: string
      }
      reverse_payment: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_payment_id: string
          target_reason: string
        }
        Returns: Json
      }
      review_pos_session: {
        Args: {
          target_approve: boolean
          target_notes: string
          target_organization_id: string
          target_session_id: string
        }
        Returns: undefined
      }
      revoke_team_invitation: {
        Args: { target_invitation_id: string; target_organization_id: string }
        Returns: string
      }
      sales_assert_access: {
        Args: {
          target_branch_id: string
          target_organization_id: string
          target_permission: string
        }
        Returns: string
      }
      sales_payload_hash: { Args: { payload: Json }; Returns: string }
      sales_return_credit_amount: {
        Args: {
          target_accepted_base_quantity: number
          target_fulfilment_line_id: string
          target_organization_id: string
        }
        Returns: number
      }
      set_accounting_period_status: {
        Args: {
          target_organization_id: string
          target_period_id: string
          target_status: string
        }
        Returns: undefined
      }
      set_default_price_list: {
        Args: { target_organization_id: string; target_price_list_id: string }
        Returns: undefined
      }
      set_default_warehouse: {
        Args: { target_branch_id: string; target_warehouse_id: string }
        Returns: undefined
      }
      set_gl_account_status: {
        Args: {
          target_account_id: string
          target_active: boolean
          target_organization_id: string
        }
        Returns: undefined
      }
      set_team_member_status: {
        Args: {
          target_membership_id: string
          target_organization_id: string
          target_reason: string
          target_status: Database["public"]["Enums"]["membership_status"]
        }
        Returns: string
      }
      submit_expense: {
        Args: { target_expense_id: string; target_organization_id: string }
        Returns: string
      }
      submit_purchase_requisition: {
        Args: {
          target_idempotency_key: string
          target_organization_id: string
          target_requisition_id: string
        }
        Returns: string
      }
      transition_sales_quotation: {
        Args: {
          target_action: string
          target_organization_id: string
          target_quotation_id: string
        }
        Returns: string
      }
      update_customer: {
        Args: {
          target_customer: Json
          target_customer_id: string
          target_organization_id: string
        }
        Returns: string
      }
      update_inventory_settings: {
        Args: {
          target_accounting_start_date: string
          target_allow_backdated: boolean
          target_costing_method: string
          target_count_mode: string
          target_negative_stock_policy: string
          target_organization_id: string
        }
        Returns: undefined
      }
      update_offline_settings: {
        Args: {
          target_cache_max_age_hours: number
          target_card_allowed: boolean
          target_credit_allowed: boolean
          target_history_retention_days: number
          target_offline_enabled: boolean
          target_organization_id: string
          target_price_policy: string
          target_stock_policy: string
          target_transfer_allowed: boolean
        }
        Returns: undefined
      }
      update_payment_account: {
        Args: {
          target_account_id: string
          target_description: string
          target_name: string
          target_organization_id: string
          target_status: string
        }
        Returns: string
      }
      update_payment_method: {
        Args: {
          target_allows_overpayment: boolean
          target_method_id: string
          target_name: string
          target_organization_id: string
          target_requires_approval: boolean
          target_requires_reference: boolean
          target_status: string
        }
        Returns: string
      }
      update_pos_settings: {
        Args: {
          target_allow_discounts: boolean
          target_allow_walk_in: boolean
          target_cash_variance_tolerance: number
          target_discount_threshold_percent: number
          target_hold_expiration_minutes: number
          target_organization_id: string
          target_require_customer: boolean
          target_return_policy: string
        }
        Returns: undefined
      }
      update_pos_terminal: {
        Args: {
          target_cash_account_id: string
          target_customer_id: string
          target_name: string
          target_organization_id: string
          target_receipt_footer: string
          target_receipt_width: string
          target_status: string
          target_terminal_id: string
        }
        Returns: undefined
      }
      update_sales_quotation: {
        Args: {
          target_billing_address: Json
          target_delivery_address: Json
          target_expiry_date: string
          target_lines: Json
          target_notes: string
          target_organization_id: string
          target_quotation_id: string
          target_terms: string
        }
        Returns: string
      }
      update_team_member_branches: {
        Args: {
          target_branch_ids: string[]
          target_membership_id: string
          target_organization_id: string
        }
        Returns: string
      }
      update_team_role: {
        Args: {
          target_description: string
          target_is_active: boolean
          target_name: string
          target_organization_id: string
          target_permission_ids: string[]
          target_role_id: string
        }
        Returns: string
      }
    }
    Enums: {
      membership_status: "invited" | "active" | "suspended" | "deactivated"
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
      membership_status: ["invited", "active", "suspended", "deactivated"],
    },
  },
} as const
