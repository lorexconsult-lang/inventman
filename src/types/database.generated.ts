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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
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
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
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
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
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
      organizations: {
        Row: {
          archived_at: string | null
          country_code: string
          created_at: string
          created_by: string
          currency_code: string
          id: string
          name: string
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
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Functions: {
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
      generate_sku: {
        Args: { target_organization_id: string }
        Returns: string
      }
      has_permission: {
        Args: { permission_code: string; target_organization_id: string }
        Returns: boolean
      }
      is_active_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      next_inventory_number: {
        Args: { target_organization_id: string; target_prefix: string }
        Returns: string
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
      post_stock_count: {
        Args: {
          target_count_id: string
          target_idempotency_key: string
          target_organization_id: string
          target_reason_code_id: string
        }
        Returns: Json
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
      record_stock_count: {
        Args: {
          target_count_id: string
          target_lines: Json
          target_organization_id: string
        }
        Returns: undefined
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
      reverse_inventory_transaction: {
        Args: {
          target_idempotency_key: string
          target_notes: string
          target_organization_id: string
          target_transaction_id: string
        }
        Returns: Json
      }
      set_default_price_list: {
        Args: { target_organization_id: string; target_price_list_id: string }
        Returns: undefined
      }
      set_default_warehouse: {
        Args: { target_branch_id: string; target_warehouse_id: string }
        Returns: undefined
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
    }
    Enums: {
      membership_status: "invited" | "active" | "suspended" | "deactivated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
