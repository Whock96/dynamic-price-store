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
          no_number: boolean
          number: string | null
          phone: string | null
          sales_person_id: string
          state: string
          street: string
          updated_at: string
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
          no_number?: boolean
          number?: string | null
          phone?: string | null
          sales_person_id: string
          state: string
          street: string
          updated_at?: string
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
          no_number?: boolean
          number?: string | null
          phone?: string | null
          sales_person_id?: string
          state?: string
          street?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
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
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          subtotal?: number
        }
        Update: {
          created_at?: string
          discount?: number
          final_price?: number
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
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
          created_at: string
          customer_id: string
          delivery_fee: number | null
          delivery_location: string | null
          full_invoice: boolean
          half_invoice_percentage: number | null
          id: string
          notes: string | null
          observations: string | null
          order_number: number
          payment_method: string
          payment_terms: string | null
          shipping: string
          status: string
          subtotal: number
          tax_substitution: boolean
          total: number
          total_discount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_fee?: number | null
          delivery_location?: string | null
          full_invoice?: boolean
          half_invoice_percentage?: number | null
          id?: string
          notes?: string | null
          observations?: string | null
          order_number?: number
          payment_method: string
          payment_terms?: string | null
          shipping: string
          status: string
          subtotal?: number
          tax_substitution?: boolean
          total?: number
          total_discount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_fee?: number | null
          delivery_location?: string | null
          full_invoice?: boolean
          half_invoice_percentage?: number | null
          id?: string
          notes?: string | null
          observations?: string | null
          order_number?: number
          payment_method?: string
          payment_terms?: string | null
          shipping?: string
          status?: string
          subtotal?: number
          tax_substitution?: boolean
          total?: number
          total_discount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
