/**
 * Tipos de la base de datos (espejo de supabase/schema.sql).
 * Si cambias el esquema, puedes regenerarlos con:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FrecuenciaPago = "quincenal" | "mensual" | "variable";
export type TipoMovimiento = "gasto" | "ingreso";
export type ClasificacionGasto = "necesidad" | "gusto" | "ahorro";
export type EstadoMeta = "activa" | "cumplida" | "pausada";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          avatar_emoji: string;
          frecuencia_pago: FrecuenciaPago;
          dias_pago: number[];
          ingreso_estimado: number | null;
          onboarding_completo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre?: string;
          avatar_emoji?: string;
          frecuencia_pago?: FrecuenciaPago;
          dias_pago?: number[];
          ingreso_estimado?: number | null;
          onboarding_completo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          avatar_emoji?: string;
          frecuencia_pago?: FrecuenciaPago;
          dias_pago?: number[];
          ingreso_estimado?: number | null;
          onboarding_completo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          emoji: string;
          color: string;
          tipo: TipoMovimiento;
          clasificacion: ClasificacionGasto | null;
          orden: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nombre: string;
          emoji: string;
          color: string;
          tipo: TipoMovimiento;
          clasificacion?: ClasificacionGasto | null;
          orden?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          emoji?: string;
          color?: string;
          tipo?: TipoMovimiento;
          clasificacion?: ClasificacionGasto | null;
          orden?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          tipo: TipoMovimiento;
          monto: number;
          category_id: string | null;
          nota: string | null;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          tipo: TipoMovimiento;
          monto: number;
          category_id?: string | null;
          nota?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tipo?: TipoMovimiento;
          monto?: number;
          category_id?: string | null;
          nota?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_fk";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          monto: number;
          dia_mes: number;
          category_id: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nombre: string;
          monto: number;
          dia_mes: number;
          category_id?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          monto?: number;
          dia_mes?: number;
          category_id?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_category_fk";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          emoji: string;
          color: string;
          monto_objetivo: number;
          fecha_objetivo: string | null;
          estado: EstadoMeta;
          es_fondo_emergencia: boolean;
          cumplida_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nombre: string;
          emoji?: string;
          color?: string;
          monto_objetivo: number;
          fecha_objetivo?: string | null;
          estado?: EstadoMeta;
          es_fondo_emergencia?: boolean;
          cumplida_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          emoji?: string;
          color?: string;
          monto_objetivo?: number;
          fecha_objetivo?: string | null;
          estado?: EstadoMeta;
          es_fondo_emergencia?: boolean;
          cumplida_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          monto: number;
          fecha: string;
          nota: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id?: string;
          monto: number;
          fecha?: string;
          nota?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          user_id?: string;
          monto?: number;
          fecha?: string;
          nota?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_fk";
            columns: ["goal_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "savings_goals";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          mes: string;
          limite: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category_id: string;
          mes: string;
          limite: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          mes?: string;
          limite?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_fk";
            columns: ["category_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          codigo: string;
          desbloqueado_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          codigo: string;
          desbloqueado_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          codigo?: string;
          desbloqueado_at?: string;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_slug: string;
          quiz_score: number | null;
          completado_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          lesson_slug: string;
          quiz_score?: number | null;
          completado_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_slug?: string;
          quiz_score?: number | null;
          completado_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      savings_goals_progress: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          emoji: string;
          color: string;
          monto_objetivo: number;
          fecha_objetivo: string | null;
          estado: EstadoMeta;
          es_fondo_emergencia: boolean;
          cumplida_at: string | null;
          created_at: string;
          monto_actual: number;
          porcentaje: number;
        };
        Relationships: [];
      };
      monthly_summary: {
        Row: {
          user_id: string;
          mes: string;
          ingresos: number;
          gastos: number;
          balance: number;
          movimientos: number;
        };
        Relationships: [];
      };
      monthly_category_summary: {
        Row: {
          user_id: string;
          mes: string;
          tipo: TipoMovimiento;
          category_id: string | null;
          total: number;
          cantidad: number;
          cantidad_pequenos: number;
          total_pequenos: number;
        };
        Relationships: [];
      };
      monthly_savings: {
        Row: {
          user_id: string;
          mes: string;
          ahorrado: number;
          abonos: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      hoy_bogota: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      frecuencia_pago: FrecuenciaPago;
      tipo_movimiento: TipoMovimiento;
      clasificacion_gasto: ClasificacionGasto;
      estado_meta: EstadoMeta;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Transaction = Tables<"transactions">;
