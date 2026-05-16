export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          email: string | null;
          avatar_url: string | null;
          favorite_teams: string[];
          reputation: number;
          reputation_score: number;
          created_takes_count: number;
          hits_count: number;
          misses_count: number;
          receipts_count: number;
          onboarding_completed: boolean;
          last_active_at: string;
          is_suspended: boolean;
          created_at: string
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          favorite_teams?: string[];
          reputation?: number;
          reputation_score?: number;
          created_takes_count?: number;
          hits_count?: number;
          misses_count?: number;
          receipts_count?: number;
          onboarding_completed?: boolean;
          last_active_at?: string;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          favorite_teams?: string[];
          reputation?: number;
          reputation_score?: number;
          created_takes_count?: number;
          hits_count?: number;
          misses_count?: number;
          receipts_count?: number;
          onboarding_completed?: boolean;
          last_active_at?: string;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          id: string;
          external_game_id: string | null;
          league: string;
          sport: string | null;
          event_slug: string | null;
          event_name: string | null;
          home_team: string;
          away_team: string;
          home_score: number;
          away_score: number;
          period: string | null;
          clock: string | null;
          status: "scheduled" | "live" | "final";
          starts_at: string | null;
          ended_at: string | null;
          watching_count: number;
          ride_count: number;
          fade_count: number;
          heat: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          external_game_id?: string | null;
          league: string;
          sport?: string | null;
          event_slug?: string | null;
          event_name?: string | null;
          home_team: string;
          away_team: string;
          home_score?: number;
          away_score?: number;
          period?: string | null;
          clock?: string | null;
          status?: "scheduled" | "live" | "final";
          starts_at?: string | null;
          ended_at?: string | null;
          watching_count?: number;
          ride_count?: number;
          fade_count?: number;
          heat?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_game_id?: string | null;
          league?: string;
          sport?: string | null;
          event_slug?: string | null;
          event_name?: string | null;
          home_team?: string;
          away_team?: string;
          home_score?: number;
          away_score?: number;
          period?: string | null;
          clock?: string | null;
          status?: "scheduled" | "live" | "final";
          starts_at?: string | null;
          ended_at?: string | null;
          watching_count?: number;
          ride_count?: number;
          fade_count?: number;
          heat?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_picks: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          pick: "ride" | "fade";
          status: "locked" | "settled";
          result: "pending" | "hit" | "miss";
          is_locked: boolean;
          reputation_delta: number;
          created_at: string;
          locked_at: string | null;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          pick: "ride" | "fade";
          status?: "locked" | "settled";
          result?: "pending" | "hit" | "miss";
          is_locked?: boolean;
          reputation_delta?: number;
          created_at?: string;
          locked_at?: string | null;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          pick?: "ride" | "fade";
          status?: "locked" | "settled";
          result?: "pending" | "hit" | "miss";
          is_locked?: boolean;
          reputation_delta?: number;
          created_at?: string;
          locked_at?: string | null;
          settled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_picks_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_picks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quick_picks: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          question_text: string;
          pick_type: "momentum" | "scoring" | "tempo" | "clutch" | "outcome";
          prompt_key: string;
          selected_side: string;
          result: "pending" | "hit" | "miss";
          rep_delta: number;
          created_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          question_text: string;
          pick_type: "momentum" | "scoring" | "tempo" | "clutch" | "outcome";
          prompt_key: string;
          selected_side: string;
          result?: "pending" | "hit" | "miss";
          rep_delta?: number;
          created_at?: string;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          question_text?: string;
          pick_type?: "momentum" | "scoring" | "tempo" | "clutch" | "outcome";
          prompt_key?: string;
          selected_side?: string;
          result?: "pending" | "hit" | "miss";
          rep_delta?: number;
          created_at?: string;
          settled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quick_picks_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quick_picks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      takes: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          take_text: string;
          status: "locked" | "settled";
          result: "pending" | "hit" | "miss";
          ride_count: number;
          fade_count: number;
          reply_count: number;
          heat: number;
          is_hidden: boolean;
          moderation_status: "clear" | "under_review" | "removed";
          created_at: string;
          updated_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          take_text: string;
          status?: "locked" | "settled";
          result?: "pending" | "hit" | "miss";
          ride_count?: number;
          fade_count?: number;
          reply_count?: number;
          heat?: number;
          is_hidden?: boolean;
          moderation_status?: "clear" | "under_review" | "removed";
          created_at?: string;
          updated_at?: string;
          settled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          take_text?: string;
          status?: "locked" | "settled";
          result?: "pending" | "hit" | "miss";
          ride_count?: number;
          fade_count?: number;
          reply_count?: number;
          heat?: number;
          is_hidden?: boolean;
          moderation_status?: "clear" | "under_review" | "removed";
          created_at?: string;
          updated_at?: string;
          settled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "takes_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "takes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      take_reactions: {
        Row: {
          id: string;
          take_id: string;
          user_id: string;
          reaction: "ride" | "fade";
          result: "pending" | "hit" | "miss";
          rep_delta: number;
          created_at: string;
          settled_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          take_id: string;
          user_id: string;
          reaction: "ride" | "fade";
          result?: "pending" | "hit" | "miss";
          rep_delta?: number;
          created_at?: string;
          settled_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          take_id?: string;
          user_id?: string;
          reaction?: "ride" | "fade";
          result?: "pending" | "hit" | "miss";
          rep_delta?: number;
          created_at?: string;
          settled_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "take_reactions_take_id_fkey";
            columns: ["take_id"];
            isOneToOne: false;
            referencedRelation: "takes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "take_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      take_replies: {
        Row: {
          id: string;
          take_id: string;
          user_id: string;
          parent_reply_id: string | null;
          reply_text: string;
          heat: number;
          is_hidden: boolean;
          moderation_status: "clear" | "under_review" | "removed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          take_id: string;
          user_id: string;
          parent_reply_id?: string | null;
          reply_text: string;
          heat?: number;
          is_hidden?: boolean;
          moderation_status?: "clear" | "under_review" | "removed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          take_id?: string;
          user_id?: string;
          parent_reply_id?: string | null;
          reply_text?: string;
          heat?: number;
          is_hidden?: boolean;
          moderation_status?: "clear" | "under_review" | "removed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "take_replies_take_id_fkey";
            columns: ["take_id"];
            isOneToOne: false;
            referencedRelation: "takes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "take_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "take_replies_parent_reply_id_fkey";
            columns: ["parent_reply_id"];
            isOneToOne: false;
            referencedRelation: "take_replies";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_user_id: string;
          target_type: "take" | "reply" | "user";
          target_id: string;
          reason: string;
          details: string | null;
          status: "open" | "reviewed" | "dismissed" | "actioned";
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_user_id: string;
          target_type: "take" | "reply" | "user";
          target_id: string;
          reason: string;
          details?: string | null;
          status?: "open" | "reviewed" | "dismissed" | "actioned";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          reporter_user_id?: string;
          target_type?: "take" | "reply" | "user";
          target_id?: string;
          reason?: string;
          details?: string | null;
          status?: "open" | "reviewed" | "dismissed" | "actioned";
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [];
      };
      user_mutes: {
        Row: {
          id: string;
          user_id: string;
          muted_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          muted_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          muted_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          id: string;
          user_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          blocked_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          blocked_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          take_id: string;
          user_id: string;
          game_id: string;
          result: "hit" | "miss";
          take_text: string;
          game_label: string | null;
          final_score: string | null;
          ride_count: number;
          fade_count: number;
          reply_count: number;
          heat: number;
          reputation_delta: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          take_id: string;
          user_id: string;
          game_id: string;
          result: "hit" | "miss";
          take_text: string;
          game_label?: string | null;
          final_score?: string | null;
          ride_count?: number;
          fade_count?: number;
          reply_count?: number;
          heat?: number;
          reputation_delta?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          take_id?: string;
          user_id?: string;
          game_id?: string;
          result?: "hit" | "miss";
          take_text?: string;
          game_label?: string | null;
          final_score?: string | null;
          ride_count?: number;
          fade_count?: number;
          reply_count?: number;
          heat?: number;
          reputation_delta?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receipts_take_id_fkey";
            columns: ["take_id"];
            isOneToOne: true;
            referencedRelation: "takes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receipts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      profile_cards: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          reputation_score: number;
          created_takes_count: number;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      dev_settle_game: {
        Args: {
          target_game_id?: string;
          settle_result?: "hit" | "miss";
        };
        Returns: {
          settled_take_id: string;
          receipt_id: string | null;
          settled_result: "hit" | "miss";
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GamePick = Database["public"]["Tables"]["game_picks"]["Row"];
export type QuickPick = Database["public"]["Tables"]["quick_picks"]["Row"];
export type Take = Database["public"]["Tables"]["takes"]["Row"];
export type TakeReaction = Database["public"]["Tables"]["take_reactions"]["Row"];
export type TakeReply = Database["public"]["Tables"]["take_replies"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type UserMute = Database["public"]["Tables"]["user_mutes"]["Row"];
export type UserBlock = Database["public"]["Tables"]["user_blocks"]["Row"];
export type Receipt = Database["public"]["Tables"]["receipts"]["Row"];
export type ProfileCard = Database["public"]["Views"]["profile_cards"]["Row"];
