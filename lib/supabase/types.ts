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
          created_at: string;
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
          league: string;
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
          league: string;
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
          league?: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          take_id: string;
          user_id: string;
          reaction: "ride" | "fade";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          take_id?: string;
          user_id?: string;
          reaction?: "ride" | "fade";
          created_at?: string;
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
export type Take = Database["public"]["Tables"]["takes"]["Row"];
export type TakeReaction = Database["public"]["Tables"]["take_reactions"]["Row"];
export type TakeReply = Database["public"]["Tables"]["take_replies"]["Row"];
export type Receipt = Database["public"]["Tables"]["receipts"]["Row"];
export type ProfileCard = Database["public"]["Views"]["profile_cards"]["Row"];
