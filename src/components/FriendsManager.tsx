import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { GroupGameInvite } from "@/components/GroupGameInvite";
import { FriendsStatsComparison } from "@/components/FriendsStatsComparison";
import { FriendsChat } from "@/components/FriendsChat";
import { VoiceChat } from "@/components/VoiceChat";
import { 
  Users, UserPlus, UserCheck, UserX, Search, 
  Clock, Check, X, Crown, Trophy, Star, Gamepad2, Loader2, Circle, 
  MessageCircle, BarChart3, Phone
} from "lucide-react";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friend_profile?: {
    username: string;
    avatar_url: string | null;
    vip_expires_at: string | null;
  };
  user_profile?: {
    username: string;
    avatar_url: string | null;
    vip_expires_at: string | null;
  };
}

interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  vip_expires_at: string | null;
}

interface FriendLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  vip_expires_at: string | null;
  total_score: number;
  rank: number;
}

export const FriendsManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isUserOnline } = usePresence('friends-presence');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friendLeaderboard, setFriendLeaderboard] = useState<FriendLeaderboardEntry[]>([]);
  const [invitingFriend, setInvitingFriend] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [chatFriend, setChatFriend] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [voiceFriend, setVoiceFriend] = useState<UserProfile | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const { getUnreadCount, markAsRead, totalUnread } = useMessageNotifications();

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    try {
      // Load accepted friends (where I sent the request)
      const { data: sentFriends } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      // Load accepted friends (where I received the request)
      const { data: receivedFriends } = await supabase
        .from("friends")
        .select("*")
        .eq("friend_id", user.id)
        .eq("status", "accepted");

      // Load pending requests I received
      const { data: pending } = await supabase
        .from("friends")
        .select("*")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      // Get friend user IDs
      const friendIds = [
        ...(sentFriends?.map((f) => f.friend_id) || []),
        ...(receivedFriends?.map((f) => f.user_id) || []),
      ];
      const pendingUserIds = pending?.map((p) => p.user_id) || [];
      const allUserIds = [...friendIds, ...pendingUserIds];

      // Load profiles for all related users
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, vip_expires_at")
          .in("user_id", allUserIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

        // Attach profiles to friends
        const friendsWithProfiles = [
          ...(sentFriends?.map((f) => ({
            ...f,
            friend_profile: profileMap.get(f.friend_id),
          })) || []),
          ...(receivedFriends?.map((f) => ({
            ...f,
            user_profile: profileMap.get(f.user_id),
          })) || []),
        ];

        const pendingWithProfiles =
          pending?.map((p) => ({
            ...p,
            user_profile: profileMap.get(p.user_id),
          })) || [];

        setFriends(friendsWithProfiles);
        setPendingRequests(pendingWithProfiles);

        // Load friend leaderboard
        await loadFriendLeaderboard(friendIds);
      } else {
        setFriends([]);
        setPendingRequests([]);
        setFriendLeaderboard([]);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendLeaderboard = async (friendIds: string[]) => {
    if (!user || friendIds.length === 0) {
      setFriendLeaderboard([]);
      return;
    }

    try {
      // Get game sessions for friends + current user
      const allUserIds = [...friendIds, user.id];

      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("user_id, score")
        .in("user_id", allUserIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, vip_expires_at")
        .in("user_id", allUserIds);

      if (!sessions || !profiles) return;

      // Aggregate scores
      const userScores = new Map<string, number>();
      sessions.forEach((s) => {
        userScores.set(s.user_id, (userScores.get(s.user_id) || 0) + (s.score || 0));
      });

      // Create leaderboard entries
      const entries: FriendLeaderboardEntry[] = profiles.map((p) => ({
        user_id: p.user_id,
        username: p.username,
        avatar_url: p.avatar_url,
        vip_expires_at: p.vip_expires_at,
        total_score: userScores.get(p.user_id) || 0,
        rank: 0,
      }));

      entries.sort((a, b) => b.total_score - a.total_score);
      entries.forEach((e, i) => (e.rank = i + 1));

      setFriendLeaderboard(entries);
    } catch (error) {
      console.error("Error loading friend leaderboard:", error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, vip_expires_at")
        .ilike("username", `%${searchQuery}%`)
        .neq("user_id", user.id)
        .limit(10);

      // Filter out existing friends
      const friendIds = friends.map((f) => f.friend_profile?.username || f.user_profile?.username);
      const filtered = data?.filter((u) => !friendIds.includes(u.username)) || [];

      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (friendUserId: string) => {
    if (!user) return;

    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from("friends")
        .select("id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${friendUserId},friend_id.eq.${friendUserId}`)
        .maybeSingle();

      if (existing) {
        toast.error("So'rov allaqachon yuborilgan");
        return;
      }

      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: friendUserId,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Do'stlik so'rovi yuborildi!");
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from("friends")
          .update({ status: "accepted" })
          .eq("id", requestId);

        if (error) throw error;
        toast.success("Do'st qo'shildi!");
      } else {
        const { error } = await supabase.from("friends").delete().eq("id", requestId);

        if (error) throw error;
        toast.success("So'rov rad etildi");
      }

      loadFriends();
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase.from("friends").delete().eq("id", friendshipId);

      if (error) throw error;

      toast.success("Do'st o'chirildi");
      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const inviteToGame = async (friendUserId: string, friendUsername: string) => {
    if (!user) return;
    
    setInvitingFriend(friendUserId);
    
    try {
      // Generate a room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create invitation
      const { error } = await supabase.from('game_invitations').insert({
        sender_id: user.id,
        receiver_id: friendUserId,
        room_code: roomCode,
        game_type: 'mental-arithmetic',
      });

      if (error) throw error;

      toast.success(`${friendUsername}ga o'yin taklifnomasi yuborildi!`, {
        icon: '🎮',
      });

      // Navigate to multiplayer with room code
      navigate(`/mental-arithmetic?mode=multiplayer&room=${roomCode}&host=true`);
    } catch (error) {
      console.error('Error inviting friend:', error);
      toast.error("Taklifnoma yuborishda xatolik");
    } finally {
      setInvitingFriend(null);
    }
  };

  const isVip = (vipExpires: string | null) => {
    return vipExpires && new Date(vipExpires) > new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
        </CardContent>
      </Card>
    );
  }

  // Get friend user IDs for stats comparison
  const friendUserIds = friends.map(f => f.friend_profile ? f.friend_id : f.user_id);

  const openChat = (profile: UserProfile) => {
    setChatFriend(profile);
    setShowChat(true);
    // Mark messages as read when opening chat
    markAsRead(profile.user_id);
  };

  const openVoiceChat = (profile: UserProfile) => {
    setVoiceFriend(profile);
    setShowVoice(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Do'stlar
              {totalUnread > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <GroupGameInvite friends={friends} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="gap-1"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Taqqoslash</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="friends">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="friends" className="text-xs sm:text-sm">
                <UserCheck className="h-4 w-4 mr-1" />
                Do'stlar ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-xs sm:text-sm">
                <Clock className="h-4 w-4 mr-1" />
                So'rovlar ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
                <Trophy className="h-4 w-4 mr-1" />
                Reyting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <Input
                  placeholder="Foydalanuvchi qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={searching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm text-muted-foreground">Qidiruv natijalari:</p>
                {searchResults.map((result) => (
                  <div key={result.user_id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar_url || undefined} />
                        <AvatarFallback>{result.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{result.username}</span>
                      {isVip(result.vip_expires_at) && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          VIP
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(result.user_id)}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Qo'shish
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            {friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Hali do'stlar yo'q</p>
                <p className="text-sm">Yuqoridagi qidiruv orqali do'st qo'shing</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const profile = friend.friend_profile || friend.user_profile;
                  const friendUserId = friend.friend_profile ? friend.friend_id : friend.user_id;
                  const isOnline = isUserOnline(friendUserId);
                  return (
                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10">
                              {profile?.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online status indicator */}
                          <div 
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                              isOnline 
                                ? 'bg-green-500' 
                                : 'bg-muted-foreground/50'
                            }`}
                            title={isOnline ? "Online" : "Offline"}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile?.username}</span>
                            {isVip(profile?.vip_expires_at || null) && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5">
                                <Crown className="h-2.5 w-2.5 mr-0.5" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Circle 
                              className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-muted-foreground/50 text-muted-foreground/50'}`} 
                            />
                            <p className="text-xs text-muted-foreground">
                              {isOnline ? "Online" : "Offline"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Chat button with unread badge */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => profile && openChat({
                            user_id: friendUserId,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            vip_expires_at: profile.vip_expires_at || null,
                          })}
                          className="text-muted-foreground hover:text-primary relative"
                          title="Xabar yozish"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {getUnreadCount(friendUserId) > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                              {getUnreadCount(friendUserId) > 9 ? '9+' : getUnreadCount(friendUserId)}
                            </span>
                          )}
                        </Button>
                        {/* Voice chat button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => profile && openVoiceChat({
                            user_id: friendUserId,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            vip_expires_at: profile.vip_expires_at || null,
                          })}
                          disabled={!isOnline}
                          className="text-muted-foreground hover:text-green-500 disabled:opacity-50"
                          title={isOnline ? "Ovozli qo'ng'iroq" : "Foydalanuvchi offline"}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => inviteToGame(
                            friendUserId,
                            profile?.username || ''
                          )}
                          disabled={invitingFriend === friendUserId || !isOnline}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                          title={!isOnline ? "Foydalanuvchi offline" : "O'yinga taklif qilish"}
                        >
                          {invitingFriend === friendUserId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Gamepad2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFriend(friend.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-2">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Kutilayotgan so'rovlar yo'q</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.user_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.user_profile?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{request.user_profile?.username}</span>
                      <p className="text-xs text-muted-foreground">Do'stlik so'rovi</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToRequest(request.id, true)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => respondToRequest(request.id, false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-2">
            {friendLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Do'stlar reytingi bo'sh</p>
                <p className="text-sm">Avval do'stlar qo'shing</p>
              </div>
            ) : (
              friendLeaderboard.map((entry) => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      entry.rank === 1
                        ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30"
                        : entry.rank === 2
                        ? "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30"
                        : entry.rank === 3
                        ? "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30"
                        : ""
                    } ${isCurrentUser ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="w-8 text-center font-bold">
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCurrentUser ? "text-primary" : ""}`}>
                          {entry.username}
                          {isCurrentUser && <span className="text-xs ml-1">(siz)</span>}
                        </span>
                        {isVip(entry.vip_expires_at) && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px] px-1.5">
                            <Crown className="h-2.5 w-2.5 mr-0.5" />
                            VIP
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <Star className="h-4 w-4" />
                        {entry.total_score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

      {/* Stats comparison */}
      {showStats && friendUserIds.length > 0 && (
        <FriendsStatsComparison friendIds={friendUserIds} />
      )}

      {/* Chat dialog */}
      {chatFriend && (
        <FriendsChat
          friend={chatFriend}
          open={showChat}
          onOpenChange={(open) => {
            setShowChat(open);
            if (!open) setChatFriend(null);
          }}
        />
      )}

      {/* Voice chat dialog */}
      {voiceFriend && (
        <VoiceChat
          friend={voiceFriend}
          isOnline={isUserOnline(voiceFriend.user_id)}
          open={showVoice}
          onOpenChange={(open) => {
            setShowVoice(open);
            if (!open) setVoiceFriend(null);
          }}
        />
      )}
    </>
  );
};

export default FriendsManager;
