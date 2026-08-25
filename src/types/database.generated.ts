export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
          organization_id: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: never;
          organization_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: never;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      branches: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          business_id: string;
          city: string | null;
          code: string;
          country_code: string | null;
          created_at: string;
          created_by: string;
          currency_code: string | null;
          default_price_list_id: string | null;
          default_warehouse_id: string | null;
          email: string | null;
          id: string;
          name: string;
          organization_id: string;
          phone: string | null;
          postal_code: string | null;
          region: string | null;
          status: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          business_id: string;
          city?: string | null;
          code: string;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          currency_code?: string | null;
          default_price_list_id?: string | null;
          default_warehouse_id?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          phone?: string | null;
          postal_code?: string | null;
          region?: string | null;
          status?: string;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          business_id?: string;
          city?: string | null;
          code?: string;
          country_code?: string | null;
          created_at?: string;
          created_by?: string;
          currency_code?: string | null;
          default_price_list_id?: string | null;
          default_warehouse_id?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          region?: string | null;
          status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_business_fk";
            columns: ["organization_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "branches_default_price_list_fk";
            columns: ["organization_id", "default_price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "branches_default_warehouse_fk";
            columns: ["organization_id", "default_warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "branches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_active: boolean;
          logo_path: string | null;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_path?: string | null;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          logo_path?: string | null;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          business_type: string;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          trading_name: string | null;
          updated_at: string;
        };
        Insert: {
          business_type: string;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          organization_id: string;
          status?: string;
          trading_name?: string | null;
          updated_at?: string;
        };
        Update: {
          business_type?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          trading_name?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      catalogue_import_batches: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string;
          error_rows: number;
          file_name: string;
          id: string;
          organization_id: string;
          status: string;
          total_rows: number;
          valid_rows: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by: string;
          error_rows: number;
          file_name: string;
          id?: string;
          organization_id: string;
          status?: string;
          total_rows: number;
          valid_rows: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string;
          error_rows?: number;
          file_name?: string;
          id?: string;
          organization_id?: string;
          status?: string;
          total_rows?: number;
          valid_rows?: number;
        };
        Relationships: [
          {
            foreignKeyName: "catalogue_import_batches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      member_branch_access: {
        Row: {
          branch_id: string;
          created_at: string;
          membership_id: string;
          organization_id: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          membership_id: string;
          organization_id: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          membership_id?: string;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_branch_access_branch_fk";
            columns: ["organization_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "member_branch_access_membership_fk";
            columns: ["organization_id", "membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "member_branch_access_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      member_roles: {
        Row: {
          created_at: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          membership_id?: string;
          organization_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_roles_membership_fk";
            columns: ["organization_id", "membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "member_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_roles_role_fk";
            columns: ["organization_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          organization_id: string;
          status: string;
          token_hash: string;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          organization_id: string;
          status?: string;
          token_hash: string;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          organization_id?: string;
          status?: string;
          token_hash?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          invited_at: string;
          invited_by: string | null;
          joined_at: string | null;
          organization_id: string;
          status: Database["public"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id?: string;
          status?: Database["public"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          archived_at: string | null;
          country_code: string;
          created_at: string;
          created_by: string;
          currency_code: string;
          id: string;
          name: string;
          slug: string;
          status: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          country_code: string;
          created_at?: string;
          created_by: string;
          currency_code: string;
          id?: string;
          name: string;
          slug: string;
          status?: string;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          country_code?: string;
          created_at?: string;
          created_by?: string;
          currency_code?: string;
          id?: string;
          name?: string;
          slug?: string;
          status?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description: string;
          id?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string;
          id?: string;
        };
        Relationships: [];
      };
      price_lists: {
        Row: {
          code: string;
          created_at: string;
          created_by: string;
          currency_code: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_default: boolean;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by: string;
          currency_code: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string;
          currency_code?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_lists_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      product_barcodes: {
        Row: {
          barcode: string;
          barcode_type: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          organization_id: string;
          packaging_id: string | null;
          product_variant_id: string;
        };
        Insert: {
          barcode: string;
          barcode_type?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          organization_id: string;
          packaging_id?: string | null;
          product_variant_id: string;
        };
        Update: {
          barcode?: string;
          barcode_type?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          organization_id?: string;
          packaging_id?: string | null;
          product_variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_barcodes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_barcodes_packaging_fk";
            columns: ["organization_id", "packaging_id"];
            isOneToOne: false;
            referencedRelation: "product_variant_packaging";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_barcodes_variant_fk";
            columns: ["organization_id", "product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_categories: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          image_path: string | null;
          is_active: boolean;
          name: string;
          organization_id: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          name: string;
          organization_id: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_parent_fk";
            columns: ["organization_id", "parent_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          byte_size: number;
          created_at: string;
          created_by: string;
          id: string;
          is_primary: boolean;
          mime_type: string;
          organization_id: string;
          product_id: string;
          product_variant_id: string | null;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          alt_text?: string | null;
          byte_size: number;
          created_at?: string;
          created_by: string;
          id?: string;
          is_primary?: boolean;
          mime_type: string;
          organization_id: string;
          product_id: string;
          product_variant_id?: string | null;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          alt_text?: string | null;
          byte_size?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_primary?: boolean;
          mime_type?: string;
          organization_id?: string;
          product_id?: string;
          product_variant_id?: string | null;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_fk";
            columns: ["organization_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_images_variant_fk";
            columns: ["organization_id", "product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_option_values: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          product_option_id: string;
          sort_order: number;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          product_option_id: string;
          sort_order?: number;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          product_option_id?: string;
          sort_order?: number;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_fk";
            columns: ["organization_id", "product_option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_option_values_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          organization_id: string;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          organization_id: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_options_product_fk";
            columns: ["organization_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_prices: {
        Row: {
          amount: number;
          branch_id: string | null;
          created_at: string;
          created_by: string;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          min_quantity: number;
          organization_id: string;
          packaging_id: string;
          price_list_id: string;
          product_variant_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount: number;
          branch_id?: string | null;
          created_at?: string;
          created_by: string;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          min_quantity?: number;
          organization_id: string;
          packaging_id: string;
          price_list_id: string;
          product_variant_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          branch_id?: string | null;
          created_at?: string;
          created_by?: string;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          min_quantity?: number;
          organization_id?: string;
          packaging_id?: string;
          price_list_id?: string;
          product_variant_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_prices_branch_fk";
            columns: ["organization_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_prices_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_prices_packaging_fk";
            columns: ["organization_id", "packaging_id"];
            isOneToOne: false;
            referencedRelation: "product_variant_packaging";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_prices_price_list_fk";
            columns: ["organization_id", "price_list_id"];
            isOneToOne: false;
            referencedRelation: "price_lists";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_prices_variant_fk";
            columns: ["organization_id", "product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_variant_packaging: {
        Row: {
          can_purchase: boolean;
          can_sell: boolean;
          conversion_to_base: number;
          created_at: string;
          id: string;
          is_active: boolean;
          is_base_unit: boolean;
          name: string;
          organization_id: string;
          product_variant_id: string;
          unit_of_measure_id: string;
          updated_at: string;
        };
        Insert: {
          can_purchase?: boolean;
          can_sell?: boolean;
          conversion_to_base: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_base_unit?: boolean;
          name: string;
          organization_id: string;
          product_variant_id: string;
          unit_of_measure_id: string;
          updated_at?: string;
        };
        Update: {
          can_purchase?: boolean;
          can_sell?: boolean;
          conversion_to_base?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_base_unit?: boolean;
          name?: string;
          organization_id?: string;
          product_variant_id?: string;
          unit_of_measure_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_packaging_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_packaging_unit_fk";
            columns: ["organization_id", "unit_of_measure_id"];
            isOneToOne: false;
            referencedRelation: "units_of_measure";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "product_variant_packaging_variant_fk";
            columns: ["organization_id", "product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      product_variants: {
        Row: {
          archived_at: string | null;
          created_at: string;
          height: number | null;
          id: string;
          internal_code: string | null;
          length: number | null;
          manufacturer_part_number: string | null;
          name: string;
          option_signature: string | null;
          organization_id: string;
          product_id: string;
          reorder_point: number | null;
          reorder_quantity: number | null;
          safety_stock: number | null;
          sku: string | null;
          status: string;
          updated_at: string;
          weight: number | null;
          width: number | null;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          internal_code?: string | null;
          length?: number | null;
          manufacturer_part_number?: string | null;
          name: string;
          option_signature?: string | null;
          organization_id: string;
          product_id: string;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          safety_stock?: number | null;
          sku?: string | null;
          status?: string;
          updated_at?: string;
          weight?: number | null;
          width?: number | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          internal_code?: string | null;
          length?: number | null;
          manufacturer_part_number?: string | null;
          name?: string;
          option_signature?: string | null;
          organization_id?: string;
          product_id?: string;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          safety_stock?: number | null;
          sku?: string | null;
          status?: string;
          updated_at?: string;
          weight?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_fk";
            columns: ["organization_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      products: {
        Row: {
          allow_negative_stock: boolean;
          archived_at: string | null;
          batch_tracking: boolean;
          brand_id: string | null;
          business_id: string;
          category_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          expiry_tracking: boolean;
          id: string;
          idempotency_key: string | null;
          name: string;
          organization_id: string;
          product_type: string;
          reference_cost: number | null;
          serial_tracking: boolean;
          status: string;
          tax_profile_id: string | null;
          track_inventory: boolean;
          updated_at: string;
        };
        Insert: {
          allow_negative_stock?: boolean;
          archived_at?: string | null;
          batch_tracking?: boolean;
          brand_id?: string | null;
          business_id: string;
          category_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          expiry_tracking?: boolean;
          id?: string;
          idempotency_key?: string | null;
          name: string;
          organization_id: string;
          product_type: string;
          reference_cost?: number | null;
          serial_tracking?: boolean;
          status?: string;
          tax_profile_id?: string | null;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Update: {
          allow_negative_stock?: boolean;
          archived_at?: string | null;
          batch_tracking?: boolean;
          brand_id?: string | null;
          business_id?: string;
          category_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          expiry_tracking?: boolean;
          id?: string;
          idempotency_key?: string | null;
          name?: string;
          organization_id?: string;
          product_type?: string;
          reference_cost?: number | null;
          serial_tracking?: boolean;
          status?: string;
          tax_profile_id?: string | null;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_fk";
            columns: ["organization_id", "brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "products_business_fk";
            columns: ["organization_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "products_category_fk";
            columns: ["organization_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "product_categories";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "products_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_tax_profile_fk";
            columns: ["organization_id", "tax_profile_id"];
            isOneToOne: false;
            referencedRelation: "tax_profiles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          organization_id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          organization_id: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_fk";
            columns: ["organization_id", "role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system: boolean;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sku_counters: {
        Row: {
          next_value: number;
          organization_id: string;
          prefix: string;
          updated_at: string;
        };
        Insert: {
          next_value?: number;
          organization_id: string;
          prefix?: string;
          updated_at?: string;
        };
        Update: {
          next_value?: number;
          organization_id?: string;
          prefix?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sku_counters_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: true;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      storage_locations: {
        Row: {
          branch_id: string;
          code: string;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_active: boolean;
          location_type: string;
          name: string;
          organization_id: string;
          parent_location_id: string | null;
          updated_at: string;
          warehouse_id: string;
        };
        Insert: {
          branch_id: string;
          code: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          location_type: string;
          name: string;
          organization_id: string;
          parent_location_id?: string | null;
          updated_at?: string;
          warehouse_id: string;
        };
        Update: {
          branch_id?: string;
          code?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          location_type?: string;
          name?: string;
          organization_id?: string;
          parent_location_id?: string | null;
          updated_at?: string;
          warehouse_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "storage_locations_branch_fk";
            columns: ["organization_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "storage_locations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "storage_locations_parent_fk";
            columns: ["organization_id", "parent_location_id"];
            isOneToOne: false;
            referencedRelation: "storage_locations";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "storage_locations_warehouse_fk";
            columns: ["organization_id", "warehouse_id"];
            isOneToOne: false;
            referencedRelation: "warehouses";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      tax_profiles: {
        Row: {
          calculation: string;
          code: string;
          created_at: string;
          created_by: string;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          rate: number;
          tax_treatment: string;
          updated_at: string;
        };
        Insert: {
          calculation?: string;
          code: string;
          created_at?: string;
          created_by: string;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          rate: number;
          tax_treatment?: string;
          updated_at?: string;
        };
        Update: {
          calculation?: string;
          code?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          rate?: number;
          tax_treatment?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tax_profiles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      units_of_measure: {
        Row: {
          created_at: string;
          created_by: string;
          dimension: string;
          id: string;
          is_active: boolean;
          is_system: boolean;
          name: string;
          organization_id: string;
          symbol: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          dimension: string;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name: string;
          organization_id: string;
          symbol: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          dimension?: string;
          id?: string;
          is_active?: boolean;
          is_system?: boolean;
          name?: string;
          organization_id?: string;
          symbol?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_of_measure_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_option_values: {
        Row: {
          created_at: string;
          organization_id: string;
          product_option_id: string;
          product_option_value_id: string;
          product_variant_id: string;
        };
        Insert: {
          created_at?: string;
          organization_id: string;
          product_option_id: string;
          product_option_value_id: string;
          product_variant_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          product_option_id?: string;
          product_option_value_id?: string;
          product_variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_fk";
            columns: ["organization_id", "product_option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "variant_option_values_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variant_option_values_value_fk";
            columns: ["organization_id", "product_option_value_id"];
            isOneToOne: false;
            referencedRelation: "product_option_values";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "variant_option_values_variant_fk";
            columns: ["organization_id", "product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      warehouses: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          branch_id: string;
          business_id: string;
          city: string | null;
          code: string;
          country_code: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_default: boolean;
          name: string;
          organization_id: string;
          postal_code: string | null;
          region: string | null;
          status: string;
          updated_at: string;
          warehouse_type: string;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          branch_id: string;
          business_id: string;
          city?: string | null;
          code: string;
          country_code?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name: string;
          organization_id: string;
          postal_code?: string | null;
          region?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_type?: string;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          branch_id?: string;
          business_id?: string;
          city?: string | null;
          code?: string;
          country_code?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          organization_id?: string;
          postal_code?: string | null;
          region?: string | null;
          status?: string;
          updated_at?: string;
          warehouse_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_fk";
            columns: ["organization_id", "branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "warehouses_business_fk";
            columns: ["organization_id", "business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "warehouses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_branch: {
        Args: { target_branch_id: string; target_organization_id: string };
        Returns: boolean;
      };
      can_assign_role: {
        Args: { target_organization_id: string; target_role_id: string };
        Returns: boolean;
      };
      can_grant_permission: {
        Args: { target_organization_id: string; target_permission_id: string };
        Returns: boolean;
      };
      create_organization: {
        Args: {
          country_code: string;
          currency_code: string;
          organization_name: string;
          organization_slug: string;
          organization_timezone: string;
        };
        Returns: string;
      };
      create_simple_product: {
        Args: {
          product_name: string;
          target_barcode: string;
          target_brand_id: string;
          target_business_id: string;
          target_category_id: string;
          target_idempotency_key: string;
          target_organization_id: string;
          target_price: number;
          target_price_list_id: string;
          target_product_type: string;
          target_reference_cost: number;
          target_reorder_point: number;
          target_sku: string;
          target_tax_profile_id: string;
          target_track_inventory: boolean;
          target_unit_id: string;
        };
        Returns: string;
      };
      create_variant_product: {
        Args: {
          option_definitions: Json;
          product_name: string;
          target_brand_id: string;
          target_business_id: string;
          target_category_id: string;
          target_idempotency_key: string;
          target_organization_id: string;
          target_product_type: string;
          target_reference_cost: number;
          target_tax_profile_id: string;
          target_track_inventory: boolean;
          variant_definitions: Json;
        };
        Returns: string;
      };
      create_warehouse: {
        Args: {
          make_default: boolean;
          target_branch_id: string;
          target_warehouse_type: string;
          warehouse_code: string;
          warehouse_description: string;
          warehouse_name: string;
        };
        Returns: string;
      };
      generate_sku: {
        Args: { target_organization_id: string };
        Returns: string;
      };
      has_permission: {
        Args: { permission_code: string; target_organization_id: string };
        Returns: boolean;
      };
      is_active_organization_member: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
      set_default_price_list: {
        Args: { target_organization_id: string; target_price_list_id: string };
        Returns: undefined;
      };
      set_default_warehouse: {
        Args: { target_branch_id: string; target_warehouse_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      membership_status: "invited" | "active" | "suspended" | "deactivated";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      membership_status: ["invited", "active", "suspended", "deactivated"],
    },
  },
} as const;
