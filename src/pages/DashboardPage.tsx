import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/lib/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileText, MessageSquare, Layers, Clock, TrendingUp, Search, Loader2, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalDocuments: number;
  totalChunks: number;
  totalQueries: number;
  totalConversations: number;
  avgResponseTimeMs: number;
}

interface TopicItem { topic: string; count: number; }
interface DocItem { documentName: string; count: number; }
interface VolumeItem { date: string; queries: number; }
interface RecentQuery {
  id: string;
  query: string;
  user: string;
  timestamp: string;
  isGuardrail: boolean;
  documentsReferenced: string[];
}

const DashboardPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topDocs, setTopDocs] = useState<DocItem[]>([]);
  const [volume, setVolume] = useState<VolumeItem[]>([]);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError("");
      const [statsData, topicsData, docsData, volumeData, queriesData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTopTopics(),
        dashboardApi.getTopDocuments(),
        dashboardApi.getQueryVolume(),
        dashboardApi.getRecentQueries(),
      ]);
      setStats(statsData.stats);
      setTopics(topicsData.topics);
      setTopDocs(docsData.documents);
      setVolume(volumeData.volume);
      setRecentQueries(queriesData.queries);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p>{error}</p>
        <button onClick={loadDashboard} className="text-sm text-primary underline">Retry</button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Documents", value: stats?.totalDocuments ?? 0, icon: FileText, color: "text-primary" },
    { label: "Total Chunks", value: (stats?.totalChunks ?? 0).toLocaleString(), icon: Layers, color: "text-secondary" },
    { label: "Total Queries", value: (stats?.totalQueries ?? 0).toLocaleString(), icon: MessageSquare, color: "text-accent" },
    { label: "Avg Response Time", value: `${((stats?.avgResponseTimeMs ?? 0) / 1000).toFixed(1)}s`, icon: Clock, color: "text-info" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Dashboard</h1>
        <p className="text-muted-foreground text-sm">Analytics and insights for your knowledge base</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Query Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Query Volume (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {volume.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No queries yet — start chatting!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Line type="monotone" dataKey="queries" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Most Queried Topics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Most Queried Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No topic data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="topic" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Most Referenced Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Most Referenced Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No document references yet</p>
            ) : (
              <div className="space-y-3">
                {topDocs.map((doc, i) => (
                  <div key={doc.documentName} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.documentName}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{doc.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Recent Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No queries yet</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {recentQueries.map((q) => (
                    <div key={q.id} className="border-b border-border/50 pb-2 last:border-0">
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-foreground flex-1">{q.query}</p>
                        {q.isGuardrail && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300 flex-shrink-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Guardrail
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{q.user}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(new Date(q.timestamp))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default DashboardPage;
