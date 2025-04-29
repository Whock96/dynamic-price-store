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
      bancos: {
        Row: {
          codigo: string | null
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string
          city: string
          created_at: string
          document: string
          email: string
          id: string
          name: string
          phone: string
          state: string
          state_registration: string | null
          updated_at: string
          website: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          document: string
          email: string
          id?: string
          name: string
          phone: string
          state: string
          state_registration?: string | null
          updated_at?: string
          website?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          document?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          state?: string
          state_registration?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          city: string
          company_name: string
          complement: string | null
          created_at: string
          default_discount: number
          document: string
          email: string | null
          id: string
          max_discount: number
          neighborhood: string | null
          no_number: boolean
          number: string | null
          phone: string | null
          register_date: string
          sales_person_id: string
          state: string
          state_registration: string | null
          street: string
          transport_company_id: string | null
          updated_at: string
          whatsapp: string | null
          zip_code: string
        }
        Insert: {
          city: string
          company_name: string
          complement?: string | null
          created_at?: string
          default_discount?: number
          document: string
          email?: string | null
          id?: string
          max_discount?: number
          neighborhood?: string | null
          no_number?: boolean
          number?: string | null
          phone?: string | null
          register_date: string
          sales_person_id: string
          state: string
          state_registration?: string | null
          street: string
          transport_company_id?: string | null
          updated_at?: string
          whatsapp?: string | null
          zip_code: string
        }
        Update: {
          city?: string
          company_name?: string
          complement?: string | null
          created_at?: string
          default_discount?: number
          document?: string
          email?: string | null
          id?: string
          max_discount?: number
          neighborhood?: string | null
          no_number?: boolean
          number?: string | null
          phone?: string | null
          register_date?: string
          sales_person_id?: string
          state?: string
          state_registration?: string | null
          street?: string
          transport_company_id?: string | null
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_transport_company_id_fkey"
            columns: ["transport_company_id"]
            isOneToOne: false
            referencedRelation: "transport_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_options: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      discount_settings: {
        Row: {
          cash_payment: number | null
          created_at: string | null
          delivery_fee_capital: number | null
          delivery_fee_interior: number | null
          half_invoice: number | null
          id: string
          ipi_rate: number | null
          pickup: number | null
          tax_substitution: number | null
          updated_at: string | null
        }
        Insert: {
          cash_payment?: number | null
          created_at?: string | null
          delivery_fee_capital?: number | null
          delivery_fee_interior?: number | null
          half_invoice?: number | null
          id?: string
          ipi_rate?: number | null
          pickup?: number | null
          tax_substitution?: number | null
          updated_at?: string | null
        }
        Update: {
          cash_payment?: number | null
          created_at?: string | null
          delivery_fee_capital?: number | null
          delivery_fee_interior?: number | null
          half_invoice?: number | null
          id?: string
          ipi_rate?: number | null
          pickup?: number | null
          tax_substitution?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      duplicatas: {
        Row: {
          banco_id: string | null
          banco_pagamento_id: string | null
          created_at: string | null
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          modo_pagamento_id: string | null
          numero_duplicata: string
          order_id: string
          payment_status_id: string | null
          pdf_boleto_path: string | null
          portador_id: string | null
          updated_at: string | null
          valor: number
          valor_acrescimo: number
          valor_desconto: number
          valor_final: number | null
          valor_recebido: number | null
        }
        Insert: {
          banco_id?: string | null
          banco_pagamento_id?: string | null
          created_at?: string | null
          data_emissao: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          modo_pagamento_id?: string | null
          numero_duplicata: string
          order_id: string
          payment_status_id?: string | null
          pdf_boleto_path?: string | null
          portador_id?: string | null
          updated_at?: string | null
          valor?: number
          valor_acrescimo?: number
          valor_desconto?: number
          valor_final?: number | null
          valor_recebido?: number | null
        }
        Update: {
          banco_id?: string | null
          banco_pagamento_id?: string | null
          created_at?: string | null
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          modo_pagamento_id?: string | null
          numero_duplicata?: string
          order_id?: string
          payment_status_id?: string | null
          pdf_boleto_path?: string | null
          portador_id?: string | null
          updated_at?: string | null
          valor?: number
          valor_acrescimo?: number
          valor_desconto?: number
          valor_final?: number | null
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicatas_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_banco_pagamento_id_fkey"
            columns: ["banco_pagamento_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_modo_pagamento_id_fkey"
            columns: ["modo_pagamento_id"]
            isOneToOne: false
            referencedRelation: "modo_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_payment_status_id_fkey"
            columns: ["payment_status_id"]
            isOneToOne: false
            referencedRelation: "payment_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_portador_id_fkey"
            columns: ["portador_id"]
            isOneToOne: false
            referencedRelation: "portador"
            referencedColumns: ["id"]
          },
        ]
      }
      modo_pagamento: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_discounts: {
        Row: {
          created_at: string
          discount_id: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string
          discount_id: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string
          discount_id?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_discounts_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discount_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount: number
          final_price: number
          id: string
          ipi_value: number | null
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          tax_substitution_value: number | null
          total_cubic_volume: number | null
          total_discount_percentage: number | null
          total_units: number | null
          total_weight: number | null
          total_with_taxes: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          ipi_value?: number | null
          order_id: string
          product_id: string
          quantity?: number
          subtotal?: number
          tax_substitution_value?: number | null
          total_cubic_volume?: number | null
          total_discount_percentage?: number | null
          total_units?: number | null
          total_weight?: number | null
          total_with_taxes?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          ipi_value?: number | null
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          tax_substitution_value?: number | null
          total_cubic_volume?: number | null
          total_discount_percentage?: number | null
          total_units?: number | null
          total_weight?: number | null
          total_with_taxes?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          applied_discounts: Json | null
          created_at: string
          customer_id: string
          delivery_fee: number | null
          delivery_location: string | null
          full_invoice: boolean
          half_invoice_percentage: number | null
          half_invoice_type: string | null
          id: string
          invoice_number: string | null
          invoice_pdf_path: string | null
          ipi_value: number | null
          notes: string | null
          observations: string | null
          order_number: number
          payment_method: string
          payment_terms: string | null
          products_total: number | null
          shipping: string
          status: string
          subtotal: number
          tax_substitution: boolean
          tax_substitution_total: number | null
          total: number
          total_discount: number
          transport_company_id: string | null
          updated_at: string
          user_id: string
          with_ipi: boolean | null
          with_suframa: boolean | null
        }
        Insert: {
          applied_discounts?: Json | null
          created_at?: string
          customer_id: string
          delivery_fee?: number | null
          delivery_location?: string | null
          full_invoice?: boolean
          half_invoice_percentage?: number | null
          half_invoice_type?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_path?: string | null
          ipi_value?: number | null
          notes?: string | null
          observations?: string | null
          order_number?: number
          payment_method: string
          payment_terms?: string | null
          products_total?: number | null
          shipping: string
          status: string
          subtotal?: number
          tax_substitution?: boolean
          tax_substitution_total?: number | null
          total?: number
          total_discount?: number
          transport_company_id?: string | null
          updated_at?: string
          user_id: string
          with_ipi?: boolean | null
          with_suframa?: boolean | null
        }
        Update: {
          applied_discounts?: Json | null
          created_at?: string
          customer_id?: string
          delivery_fee?: number | null
          delivery_location?: string | null
          full_invoice?: boolean
          half_invoice_percentage?: number | null
          half_invoice_type?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_path?: string | null
          ipi_value?: number | null
          notes?: string | null
          observations?: string | null
          order_number?: number
          payment_method?: string
          payment_terms?: string | null
          products_total?: number | null
          shipping?: string
          status?: string
          subtotal?: number
          tax_substitution?: boolean
          tax_substitution_total?: number | null
          total?: number
          total_discount?: number
          transport_company_id?: string | null
          updated_at?: string
          user_id?: string
          with_ipi?: boolean | null
          with_suframa?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_transport_company_id_fkey"
            columns: ["transport_company_id"]
            isOneToOne: false
            referencedRelation: "transport_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_status: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      portador: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          cubic_volume: number
          description: string | null
          height: number
          id: string
          image_url: string | null
          length: number
          list_price: number
          mva: number
          name: string
          quantity: number
          quantity_per_volume: number
          subcategory_id: string | null
          updated_at: string
          weight: number
          width: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          cubic_volume?: number
          description?: string | null
          height?: number
          id?: string
          image_url?: string | null
          length?: number
          list_price?: number
          mva?: number
          name: string
          quantity?: number
          quantity_per_volume?: number
          subcategory_id?: string | null
          updated_at?: string
          weight?: number
          width?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          cubic_volume?: number
          description?: string | null
          height?: number
          id?: string
          image_url?: string | null
          length?: number
          list_price?: number
          mva?: number
          name?: string
          quantity?: number
          quantity_per_volume?: number
          subcategory_id?: string | null
          updated_at?: string
          weight?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_companies: {
        Row: {
          created_at: string
          document: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          document: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          document?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_type_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          user_type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          user_type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          user_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_type_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_type_permissions_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          commission: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          password: string
          updated_at: string
          user_type_id: string
          username: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          password: string
          updated_at?: string
          user_type_id: string
          username: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          password?: string
          updated_at?: string
          user_type_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_types"
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
