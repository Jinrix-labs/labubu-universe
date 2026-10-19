export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      series: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          release_date: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          release_date?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          release_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'series_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      figures: {
        Row: {
          id: string;
          series_id: string;
          name: string;
          image_url: string | null;
          rarity: Rarity;
          est_value_min: number | null;
          est_value_max: number | null;
          original_price: number | null;
          legacy_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          series_id: string;
          name: string;
          image_url?: string | null;
          rarity?: Rarity;
          est_value_min?: number | null;
          est_value_max?: number | null;
          original_price?: number | null;
          legacy_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          series_id?: string;
          name?: string;
          image_url?: string | null;
          rarity?: Rarity;
          est_value_min?: number | null;
          est_value_max?: number | null;
          original_price?: number | null;
          legacy_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'figures_series_id_fkey';
            columns: ['series_id'];
            isOneToOne: false;
            referencedRelation: 'series';
            referencedColumns: ['id'];
          },
        ];
      };
      buy_links: {
        Row: {
          id: string;
          figure_id: string;
          retailer: string;
          url: string;
          is_affiliate: boolean | null;
        };
        Insert: {
          id?: string;
          figure_id: string;
          retailer: string;
          url: string;
          is_affiliate?: boolean | null;
        };
        Update: {
          id?: string;
          figure_id?: string;
          retailer?: string;
          url?: string;
          is_affiliate?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'buy_links_figure_id_fkey';
            columns: ['figure_id'];
            isOneToOne: false;
            referencedRelation: 'figures';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          is_premium: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          is_premium?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          is_premium?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      user_figures: {
        Row: {
          user_id: string;
          figure_id: string;
          status: UserFigureStatus;
          quantity: number;
          added_at: string | null;
        };
        Insert: {
          user_id: string;
          figure_id: string;
          status: UserFigureStatus;
          quantity?: number;
          added_at?: string | null;
        };
        Update: {
          user_id?: string;
          figure_id?: string;
          status?: UserFigureStatus;
          quantity?: number;
          added_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_figures_figure_id_fkey';
            columns: ['figure_id'];
            isOneToOne: false;
            referencedRelation: 'figures';
            referencedColumns: ['id'];
          },
        ];
      };
      collection_photos: {
        Row: {
          id: string;
          user_id: string;
          figure_id: string | null;
          storage_path: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          figure_id?: string | null;
          storage_path: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          figure_id?: string | null;
          storage_path?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_photos_figure_id_fkey';
            columns: ['figure_id'];
            isOneToOne: false;
            referencedRelation: 'figures';
            referencedColumns: ['id'];
          },
        ];
      };
      shelves: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          theme: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          theme?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          theme?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      shelf_slots: {
        Row: {
          id: string;
          shelf_id: string;
          figure_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          shelf_id: string;
          figure_id: string;
          position: number;
        };
        Update: {
          id?: string;
          shelf_id?: string;
          figure_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'shelf_slots_shelf_id_fkey';
            columns: ['shelf_id'];
            isOneToOne: false;
            referencedRelation: 'shelves';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shelf_slots_figure_id_fkey';
            columns: ['figure_id'];
            isOneToOne: false;
            referencedRelation: 'figures';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      series_completion: {
        Row: {
          series_id: string | null;
          series_name: string | null;
          total: number | null;
          owned: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Rarity = 'regular' | 'rare' | 'limited' | 'secret' | 'ultra_rare';
export type UserFigureStatus = 'owned' | 'wishlist';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
