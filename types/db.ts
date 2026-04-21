export type Database = {
  public: {
    Tables: {
      surveys: {
        Row: {
          id: string;
          owner_id: string;
          workspace_id: string | null;
          title: string | null;
          description: string | null;
          emoji: string | null;
          color: string | null;
          status: string | null;
          sections: unknown;
          settings: unknown;
          notify_email: boolean | null;
          notify_threshold: number | null;
          webhook_url: string | null;
          variants: unknown;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          workspace_id?: string | null;
          title?: string | null;
          description?: string | null;
          emoji?: string | null;
          color?: string | null;
          status?: string | null;
          sections?: unknown;
          settings?: unknown;
          notify_email?: boolean | null;
          notify_threshold?: number | null;
          webhook_url?: string | null;
          variants?: unknown;
        };
        Update: Partial<{
          owner_id: string;
          workspace_id: string | null;
          title: string | null;
          description: string | null;
          emoji: string | null;
          color: string | null;
          status: string | null;
          sections: unknown;
          settings: unknown;
          notify_email: boolean | null;
          notify_threshold: number | null;
          webhook_url: string | null;
          variants: unknown;
          updated_at: string | null;
        }>;
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          slug: string;
        };
        Update: Partial<{ name: string; slug: string }>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: string;
        };
        Update: Partial<{ role: string }>;
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          survey_id: string;
          kind: string;
          sent_at: string | null;
          payload: unknown;
        };
        Insert: {
          id?: string;
          survey_id: string;
          kind: string;
          sent_at?: string | null;
          payload?: unknown;
        };
        Update: Partial<{ payload: unknown }>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          workspace_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string | null;
          current_period_end: string | null;
          updated_at: string | null;
        };
        Insert: {
          workspace_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: string;
          status?: string | null;
          current_period_end?: string | null;
        };
        Update: Partial<{
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: string;
          status: string | null;
          current_period_end: string | null;
          updated_at: string | null;
        }>;
        Relationships: [];
      };
      ai_summaries: {
        Row: {
          survey_id: string;
          question_id: string;
          model: string;
          summary: unknown;
          generated_at: string | null;
          response_count_at_time: number;
        };
        Insert: {
          survey_id: string;
          question_id: string;
          model: string;
          summary: unknown;
          generated_at?: string | null;
          response_count_at_time: number;
        };
        Update: Partial<{
          summary: unknown;
          generated_at: string | null;
          response_count_at_time: number;
        }>;
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          survey_id: string;
          answers: unknown;
          meta: unknown;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          survey_id: string;
          answers: unknown;
          meta?: unknown;
          submitted_at?: string | null;
        };
        Update: Partial<{
          answers: unknown;
          meta: unknown;
          submitted_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      survey_response_count: {
        Args: { p_survey_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
