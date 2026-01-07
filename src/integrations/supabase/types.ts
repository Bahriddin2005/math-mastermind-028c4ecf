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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          excerpt: string
          gradient: string
          icon: string
          id: string
          is_published: boolean | null
          read_time: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string
          excerpt: string
          gradient?: string
          icon?: string
          id?: string
          is_published?: boolean | null
          read_time: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          gradient?: string
          icon?: string
          id?: string
          is_published?: boolean | null
          read_time?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      bonus_challenges: {
        Row: {
          challenge_type: string
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          is_completed: boolean
          reward_energy: number
          reward_xp: number
          user_id: string
        }
        Insert: {
          challenge_type: string
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_completed?: boolean
          reward_energy?: number
          reward_xp?: number
          user_id: string
        }
        Update: {
          challenge_type?: string
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_completed?: boolean
          reward_energy?: number
          reward_xp?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_published: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_challenge_results: {
        Row: {
          answer: number | null
          avatar_url: string | null
          challenge_id: string
          completion_time: number
          correct_answer: number
          created_at: string
          id: string
          is_correct: boolean
          score: number
          user_id: string
          username: string
        }
        Insert: {
          answer?: number | null
          avatar_url?: string | null
          challenge_id: string
          completion_time: number
          correct_answer: number
          created_at?: string
          id?: string
          is_correct?: boolean
          score?: number
          user_id: string
          username: string
        }
        Update: {
          answer?: number | null
          avatar_url?: string | null
          challenge_id?: string
          completion_time?: number
          correct_answer?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          score?: number
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          digit_count: number
          formula_type: string
          id: string
          problem_count: number
          seed: number
          speed: number
        }
        Insert: {
          challenge_date?: string
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          problem_count?: number
          seed?: number
          speed?: number
        }
        Update: {
          challenge_date?: string
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          problem_count?: number
          seed?: number
          speed?: number
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          icon: string
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      friend_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_invitations: {
        Row: {
          created_at: string
          expires_at: string
          game_type: string
          id: string
          receiver_id: string
          room_code: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          game_type?: string
          id?: string
          receiver_id: string
          room_code?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          game_type?: string
          id?: string
          receiver_id?: string
          room_code?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      game_levels: {
        Row: {
          coin_reward: number
          created_at: string
          description: string | null
          difficulty: string
          icon: string | null
          id: string
          is_active: boolean | null
          level_number: number
          name: string
          problem_count: number
          required_xp: number
          time_limit: number | null
        }
        Insert: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_number: number
          name: string
          problem_count?: number
          required_xp?: number
          time_limit?: number | null
        }
        Update: {
          coin_reward?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          level_number?: number
          name?: string
          problem_count?: number
          required_xp?: number
          time_limit?: number | null
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          best_streak: number | null
          correct: number | null
          created_at: string
          difficulty: string
          formula_type: string | null
          id: string
          incorrect: number | null
          mode: string
          problems_solved: number | null
          score: number | null
          section: string
          target_problems: number | null
          timer_duration: number | null
          total_time: number | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          correct?: number | null
          created_at?: string
          difficulty: string
          formula_type?: string | null
          id?: string
          incorrect?: number | null
          mode: string
          problems_solved?: number | null
          score?: number | null
          section: string
          target_problems?: number | null
          timer_duration?: number | null
          total_time?: number | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          correct?: number | null
          created_at?: string
          difficulty?: string
          formula_type?: string | null
          id?: string
          incorrect?: number | null
          mode?: string
          problems_solved?: number | null
          score?: number | null
          section?: string
          target_problems?: number | null
          timer_duration?: number | null
          total_time?: number | null
          user_id?: string
        }
        Relationships: []
      }
      game_tasks: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          reward_coins: number
          reward_xp: number
          target_value: number
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          reward_coins?: number
          reward_xp?: number
          target_value?: number
          task_type?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          reward_coins?: number
          reward_xp?: number
          target_value?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      ghost_battle_results: {
        Row: {
          created_at: string
          ghost_correct: number
          ghost_score: number
          ghost_time: number
          ghost_user_id: string
          ghost_username: string
          id: string
          is_winner: boolean
          user_correct: number
          user_id: string
          user_score: number
          user_time: number
        }
        Insert: {
          created_at?: string
          ghost_correct?: number
          ghost_score?: number
          ghost_time?: number
          ghost_user_id: string
          ghost_username: string
          id?: string
          is_winner?: boolean
          user_correct?: number
          user_id: string
          user_score?: number
          user_time?: number
        }
        Update: {
          created_at?: string
          ghost_correct?: number
          ghost_score?: number
          ghost_time?: number
          ghost_user_id?: string
          ghost_username?: string
          id?: string
          is_winner?: boolean
          user_correct?: number
          user_id?: string
          user_score?: number
          user_time?: number
        }
        Relationships: []
      }
      lesson_questions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_answered: boolean | null
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_answered?: boolean | null
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_answered?: boolean | null
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          order_index: number | null
          practice_config: Json | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          practice_config?: Json | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          practice_config?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      math_examples: {
        Row: {
          answer: number
          category: string
          created_at: string
          difficulty: string
          explanation: string | null
          hint: string | null
          id: string
          is_active: boolean | null
          lesson_id: string | null
          order_index: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: number
          category?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          order_index?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: number
          category?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          hint?: string | null
          id?: string
          is_active?: boolean | null
          lesson_id?: string | null
          order_index?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "math_examples_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_participants: {
        Row: {
          answer: number | null
          answer_time: number | null
          avatar_url: string | null
          id: string
          is_correct: boolean | null
          is_ready: boolean | null
          joined_at: string
          room_id: string
          score: number | null
          user_id: string
          username: string
        }
        Insert: {
          answer?: number | null
          answer_time?: number | null
          avatar_url?: string | null
          id?: string
          is_correct?: boolean | null
          is_ready?: boolean | null
          joined_at?: string
          room_id: string
          score?: number | null
          user_id: string
          username: string
        }
        Update: {
          answer?: number | null
          answer_time?: number | null
          avatar_url?: string | null
          id?: string
          is_correct?: boolean | null
          is_ready?: boolean | null
          joined_at?: string
          room_id?: string
          score?: number | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplayer_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "multiplayer_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplayer_rooms: {
        Row: {
          created_at: string
          current_problem: number | null
          digit_count: number
          finished_at: string | null
          formula_type: string
          host_id: string
          id: string
          problem_count: number
          room_code: string
          speed: number
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_problem?: number | null
          digit_count?: number
          finished_at?: string | null
          formula_type?: string
          host_id: string
          id?: string
          problem_count?: number
          room_code: string
          speed?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_problem?: number | null
          digit_count?: number
          finished_at?: string | null
          formula_type?: string
          host_id?: string
          id?: string
          problem_count?: number
          room_code?: string
          speed?: number
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      problem_sheets: {
        Row: {
          columns_per_row: number
          created_at: string
          digit_count: number
          formula_type: string
          id: string
          operation_count: number
          problem_count: number
          problems: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          columns_per_row?: number
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          operation_count?: number
          problem_count?: number
          problems: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          columns_per_row?: number
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          operation_count?: number
          problem_count?: number
          problems?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number | null
          created_at: string
          current_streak: number | null
          daily_goal: number | null
          id: string
          last_active_date: string | null
          selected_frame: string | null
          total_problems_solved: number | null
          total_score: number | null
          updated_at: string
          user_id: string
          username: string
          vip_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          daily_goal?: number | null
          id?: string
          last_active_date?: string | null
          selected_frame?: string | null
          total_problems_solved?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
          username: string
          vip_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          daily_goal?: number | null
          id?: string
          last_active_date?: string | null
          selected_frame?: string | null
          total_problems_solved?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
          username?: string
          vip_expires_at?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_available: boolean | null
          item_type: string
          name: string
          price: number
          stock: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_available?: boolean | null
          item_type?: string
          name: string
          price: number
          stock?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_available?: boolean | null
          item_type?: string
          name?: string
          price?: number
          stock?: number | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          rating: number
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          rating?: number
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          rating?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          correct_answer: number | null
          created_at: string
          finished_at: string | null
          id: string
          match_index: number
          player1_answer: number | null
          player1_id: string | null
          player1_time: number | null
          player2_answer: number | null
          player2_id: string | null
          player2_time: number | null
          round: number
          started_at: string | null
          status: string
          tournament_id: string
          winner_id: string | null
        }
        Insert: {
          correct_answer?: number | null
          created_at?: string
          finished_at?: string | null
          id?: string
          match_index: number
          player1_answer?: number | null
          player1_id?: string | null
          player1_time?: number | null
          player2_answer?: number | null
          player2_id?: string | null
          player2_time?: number | null
          round: number
          started_at?: string | null
          status?: string
          tournament_id: string
          winner_id?: string | null
        }
        Update: {
          correct_answer?: number | null
          created_at?: string
          finished_at?: string | null
          id?: string
          match_index?: number
          player1_answer?: number | null
          player1_id?: string | null
          player1_time?: number | null
          player2_answer?: number | null
          player2_id?: string | null
          player2_time?: number | null
          round?: number
          started_at?: string | null
          status?: string
          tournament_id?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          avatar_url: string | null
          id: string
          is_eliminated: boolean
          joined_at: string
          losses: number
          score: number
          tournament_id: string
          user_id: string
          username: string
          wins: number
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          losses?: number
          score?: number
          tournament_id: string
          user_id: string
          username: string
          wins?: number
        }
        Update: {
          avatar_url?: string | null
          id?: string
          is_eliminated?: boolean
          joined_at?: string
          losses?: number
          score?: number
          tournament_id?: string
          user_id?: string
          username?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          current_round: number | null
          digit_count: number
          finished_at: string | null
          formula_type: string
          host_id: string
          id: string
          name: string
          player_count: number
          problem_count: number
          speed: number
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          current_round?: number | null
          digit_count?: number
          finished_at?: string | null
          formula_type?: string
          host_id: string
          id?: string
          name?: string
          player_count?: number
          problem_count?: number
          speed?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          current_round?: number | null
          digit_count?: number
          finished_at?: string | null
          formula_type?: string
          host_id?: string
          id?: string
          name?: string
          player_count?: number
          problem_count?: number
          speed?: number
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          difficulty_level: number | null
          game_type: string
          id: string
          ip_hash: string | null
          is_correct: boolean | null
          metadata: Json | null
          response_time_ms: number | null
          score_earned: number | null
          session_id: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          difficulty_level?: number | null
          game_type: string
          id?: string
          ip_hash?: string | null
          is_correct?: boolean | null
          metadata?: Json | null
          response_time_ms?: number | null
          score_earned?: number | null
          session_id?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          difficulty_level?: number | null
          game_type?: string
          id?: string
          ip_hash?: string | null
          is_correct?: boolean | null
          metadata?: Json | null
          response_time_ms?: number | null
          score_earned?: number | null
          session_id?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_icon: string
          badge_name: string
          badge_type: string
          competition_id: string | null
          competition_type: string | null
          description: string | null
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_icon?: string
          badge_name: string
          badge_type: string
          competition_id?: string | null
          competition_type?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_icon?: string
          badge_name?: string
          badge_type?: string
          competition_id?: string | null
          competition_type?: string | null
          description?: string | null
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_game_currency: {
        Row: {
          coins: number
          created_at: string
          id: string
          last_life_regen: string
          lives: number
          max_lives: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          id?: string
          last_life_regen?: string
          lives?: number
          max_lives?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          last_life_regen?: string
          lives?: number
          max_lives?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          bonus_cooldown_until: string | null
          combo: number
          created_at: string
          current_xp: number
          difficulty_level: number
          energy: number
          flag_reason: string | null
          id: string
          is_flagged: boolean
          last_5_results: boolean[]
          last_energy_update: string
          level: number
          max_combo: number
          max_energy: number
          suspicious_score: number
          total_correct: number
          total_incorrect: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_cooldown_until?: string | null
          combo?: number
          created_at?: string
          current_xp?: number
          difficulty_level?: number
          energy?: number
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          last_5_results?: boolean[]
          last_energy_update?: string
          level?: number
          max_combo?: number
          max_energy?: number
          suspicious_score?: number
          total_correct?: number
          total_incorrect?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_cooldown_until?: string | null
          combo?: number
          created_at?: string
          current_xp?: number
          difficulty_level?: number
          energy?: number
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean
          last_5_results?: boolean[]
          last_energy_update?: string
          level?: number
          max_combo?: number
          max_energy?: number
          suspicious_score?: number
          total_correct?: number
          total_incorrect?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          id: string
          is_active: boolean | null
          item_id: string
          purchased_at: string
          quantity: number
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          item_id: string
          purchased_at?: string
          quantity?: number
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          item_id?: string
          purchased_at?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          practice_completed: boolean | null
          practice_score: number | null
          updated_at: string
          user_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          practice_completed?: boolean | null
          practice_score?: number | null
          updated_at?: string
          user_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          practice_completed?: boolean | null
          practice_score?: number | null
          updated_at?: string
          user_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_level_progress: {
        Row: {
          attempts: number
          best_score: number
          best_time: number | null
          completed_at: string | null
          created_at: string
          id: string
          level_id: string
          stars_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score?: number
          best_time?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          level_id: string
          stars_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number
          best_time?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          level_id?: string
          stars_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_level_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "game_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_task_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          is_completed: boolean | null
          reset_date: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean | null
          reset_date?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean | null
          reset_date?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "game_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenge_results: {
        Row: {
          avatar_url: string | null
          best_time: number | null
          challenge_id: string
          correct_answers: number
          created_at: string
          games_played: number
          id: string
          total_score: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          best_time?: number | null
          challenge_id: string
          correct_answers?: number
          created_at?: string
          games_played?: number
          id?: string
          total_score?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          best_time?: number | null
          challenge_id?: string
          correct_answers?: number
          created_at?: string
          games_played?: number
          id?: string
          total_score?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenge_results_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          created_at: string
          digit_count: number
          formula_type: string
          id: string
          problem_count: number
          seed: number
          speed: number
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          problem_count?: number
          seed?: number
          speed?: number
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          digit_count?: number
          formula_type?: string
          id?: string
          problem_count?: number
          seed?: number
          speed?: number
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_daily_challenge: {
        Args: never
        Returns: {
          challenge_date: string
          created_at: string
          digit_count: number
          formula_type: string
          id: string
          problem_count: number
          seed: number
          speed: number
        }
        SetofOptions: {
          from: "*"
          to: "daily_challenges"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_platform_stats: {
        Args: never
        Returns: {
          total_courses: number
          total_lessons: number
          total_problems_solved: number
          total_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_views: { Args: { post_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
