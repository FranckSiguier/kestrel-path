"use client";

import { Button } from "@kestrel-path/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kestrel-path/ui/components/card";
import { Input } from "@kestrel-path/ui/components/input";
import { Label } from "@kestrel-path/ui/components/label";
import { Textarea } from "@kestrel-path/ui/components/textarea";
import { cn } from "@kestrel-path/ui/lib/utils";
import { FileText, KeyRound, LoaderCircle, RefreshCw, Sparkles, Star, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

import {
  formatDateTime,
  formatPricingPerMillion,
  formatUsd,
  type AiCreditsResponse,
  type AiGatewaySettingsResponse,
  type AnalysisRecord,
  type GatewayModelOption,
  type PromptVersionRecord,
  type RankingsResponse,
  type TranscriptRecord,
} from "@/lib/ai/shared";

type DrawerTab = "settings" | "rankings" | "transcripts";

const drawerTabs: Array<{
  id: DrawerTab;
  label: string;
  description: string;
  icon: typeof KeyRound;
}> = [
  {
    id: "settings",
    label: "Gateway Key",
    description: "Save your AI Gateway API key and credits.",
    icon: KeyRound,
  },
  {
    id: "rankings",
    label: "Rankings",
    description: "Review prompt scores, spend, and model usage.",
    icon: Star,
  },
  {
    id: "transcripts",
    label: "Transcripts",
    description: "Browse transcript files saved in Blob + DB.",
    icon: FileText,
  },
];

function DrawerTabButton({
  active,
  description,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: typeof KeyRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border px-3 py-3 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

function ScoreButtons({
  currentScore,
  disabled,
  onSelect,
}: {
  currentScore: number | null;
  disabled?: boolean;
  onSelect: (score: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((score) => (
        <Button
          key={score}
          type="button"
          variant={currentScore === score ? "default" : "outline"}
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(score)}
        >
          {score}
        </Button>
      ))}
    </div>
  );
}

export default function AIWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("transcripts");
  const [gatewayKeyInput, setGatewayKeyInput] = useState("");
  const [settings, setSettings] = useState<AiGatewaySettingsResponse | null>(null);
  const [credits, setCredits] = useState<AiCreditsResponse | null>(null);
  const [models, setModels] = useState<GatewayModelOption[]>([]);
  const [prompts, setPrompts] = useState<PromptVersionRecord[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedRankingPromptId, setSelectedRankingPromptId] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [promptTitle, setPromptTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [temperatureInput, setTemperatureInput] = useState("0.2");
  const [topPInput, setTopPInput] = useState("1");
  const [maxOutputTokensInput, setMaxOutputTokensInput] = useState("");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshingRankings, setIsRefreshingRankings] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [currentAnalysisText, setCurrentAnalysisText] = useState("");
  const [currentAnalysisError, setCurrentAnalysisError] = useState<string | null>(null);

  const selectedTranscript = useMemo(
    () => transcripts.find((transcript) => transcript.id === selectedTranscriptId) ?? null,
    [selectedTranscriptId, transcripts],
  );
  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? null,
    [models, selectedModelId],
  );
  const selectedHistory = useMemo(
    () => analyses.find((analysis) => analysis.id === selectedHistoryId) ?? null,
    [analyses, selectedHistoryId],
  );
  const filteredTranscripts = useMemo(() => {
    const query = transcriptSearch.trim().toLowerCase();
    if (!query) {
      return transcripts;
    }

    return transcripts.filter((transcript) => {
      return (
        transcript.fileName.toLowerCase().includes(query) ||
        transcript.transcriptText.toLowerCase().includes(query)
      );
    });
  }, [transcriptSearch, transcripts]);

  const displayedAnalysisText = isAnalyzing
    ? currentAnalysisText
    : selectedHistory?.resultText ?? currentAnalysisText;
  const displayedAnalysisError = isAnalyzing
    ? currentAnalysisError
    : selectedHistory?.errorMessage ?? currentAnalysisError;
  const displayedAnalysisScore = selectedHistory?.score ?? null;

  const fetchSettings = useCallback(async () => {
    const response = await fetch("/api/ai/settings", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load AI settings.");
    }

    const payload = (await response.json()) as AiGatewaySettingsResponse;
    setSettings(payload);
  }, []);

  const fetchCredits = useCallback(async () => {
    const response = await fetch("/api/ai/credits", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load AI Gateway credits.");
    }

    const payload = (await response.json()) as AiCreditsResponse;
    setCredits(payload);
  }, []);

  const fetchModels = useCallback(async () => {
    const response = await fetch("/api/ai/models", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load models.");
    }

    const payload = (await response.json()) as { models: GatewayModelOption[] };
    setModels(payload.models);
    setSelectedModelId((currentModelId) => {
      if (currentModelId && payload.models.some((model) => model.id === currentModelId)) {
        return currentModelId;
      }

      return payload.models[0]?.id ?? "";
    });
  }, []);

  const fetchPrompts = useCallback(async () => {
    const response = await fetch("/api/ai/system-prompts", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load system prompts.");
    }

    const payload = (await response.json()) as { prompts: PromptVersionRecord[] };
    setPrompts(payload.prompts);

    if (!selectedPromptId && !systemPrompt && payload.prompts[0]) {
      setSelectedPromptId(payload.prompts[0].id);
      setPromptTitle(payload.prompts[0].title);
      setSystemPrompt(payload.prompts[0].content);
    }
  }, [selectedPromptId, systemPrompt]);

  const fetchTranscripts = useCallback(async () => {
    const response = await fetch("/api/ai/transcripts", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load transcripts.");
    }

    const payload = (await response.json()) as { transcripts: TranscriptRecord[] };
    setTranscripts(payload.transcripts);
    setSelectedTranscriptId((currentTranscriptId) => {
      if (
        currentTranscriptId &&
        payload.transcripts.some((transcript) => transcript.id === currentTranscriptId)
      ) {
        return currentTranscriptId;
      }

      return payload.transcripts[0]?.id ?? null;
    });
  }, []);

  const fetchAnalyses = useCallback(async (transcriptId: string | null) => {
    const url = transcriptId ? `/api/ai/analyses?transcriptId=${transcriptId}` : "/api/ai/analyses";
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load analyses.");
    }

    const payload = (await response.json()) as { analyses: AnalysisRecord[] };
    setAnalyses(payload.analyses);
    setSelectedHistoryId((currentHistoryId) => {
      if (currentHistoryId && payload.analyses.some((analysis) => analysis.id === currentHistoryId)) {
        return currentHistoryId;
      }

      return payload.analyses[0]?.id ?? null;
    });
  }, []);

  const fetchRankings = useCallback(async (promptVersionId?: string | null) => {
    setIsRefreshingRankings(true);

    try {
      const query = promptVersionId ? `?promptVersionId=${promptVersionId}` : "";
      const response = await fetch(`/api/ai/rankings${query}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load rankings.");
      }

      const payload = (await response.json()) as RankingsResponse;
      setRankings(payload);
      setSelectedRankingPromptId(payload.selectedPromptVersionId);
    } finally {
      setIsRefreshingRankings(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([
          fetchSettings(),
          fetchCredits(),
          fetchModels(),
          fetchPrompts(),
          fetchTranscripts(),
          fetchRankings(),
        ]);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Failed to load AI workspace.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, [fetchCredits, fetchModels, fetchPrompts, fetchRankings, fetchSettings, fetchTranscripts]);

  useEffect(() => {
    if (!selectedTranscriptId) {
      setAnalyses([]);
      return;
    }

    void fetchAnalyses(selectedTranscriptId).catch((error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to load analyses.");
    });
  }, [fetchAnalyses, selectedTranscriptId]);

  const handlePromptSelection = (promptId: string) => {
    if (!promptId) {
      setSelectedPromptId(null);
      setPromptTitle("");
      setSystemPrompt("");
      return;
    }

    const prompt = prompts.find((item) => item.id === promptId);
    if (!prompt) {
      return;
    }

    setSelectedPromptId(prompt.id);
    setPromptTitle(prompt.title);
    setSystemPrompt(prompt.content);
  };

  const handleSaveGatewayKey = async () => {
    if (!gatewayKeyInput.trim()) {
      toast.error("Enter your Vercel AI Gateway API key first.");
      return;
    }

    setIsSavingKey(true);
    try {
      const response = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: gatewayKeyInput }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to save API key.");
      }

      toast.success("AI Gateway key saved.");
      setGatewayKeyInput("");
      await Promise.all([fetchSettings(), fetchCredits()]);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save API key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveGatewayKey = async () => {
    setIsSavingKey(true);
    try {
      const response = await fetch("/api/ai/settings", { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to remove API key.");
      }

      toast.success("AI Gateway key removed.");
      setGatewayKeyInput("");
      await Promise.all([fetchSettings(), fetchCredits()]);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to remove API key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTranscriptUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/transcripts/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        error?: string;
        transcript?: TranscriptRecord;
      };

      if (!response.ok || !payload.transcript) {
        throw new Error(payload.error ?? "Failed to upload transcript.");
      }

      const uploadedTranscript = payload.transcript;
      setTranscripts((current) => [uploadedTranscript, ...current]);
      setSelectedTranscriptId(uploadedTranscript.id);
      setActiveTab("transcripts");
      toast.success("Transcript saved to Blob and database.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to upload transcript.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedTranscript) {
      toast.error("Upload or select a transcript first.");
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error("Write a system prompt first.");
      return;
    }

    if (!selectedModelId) {
      toast.error("Choose a model first.");
      return;
    }

    const parsedTemperature = temperatureInput.trim() ? Number(temperatureInput) : null;
    const parsedTopP = topPInput.trim() ? Number(topPInput) : null;
    const parsedMaxOutputTokens = maxOutputTokensInput.trim() ? Number(maxOutputTokensInput) : null;

    setIsAnalyzing(true);
    setCurrentAnalysisError(null);
    setCurrentAnalysisText("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptId: selectedTranscript.id,
          promptVersionId: selectedPromptId,
          promptTitle,
          systemPrompt,
          modelId: selectedModelId,
          temperature: Number.isFinite(parsedTemperature) ? parsedTemperature : null,
          topP: Number.isFinite(parsedTopP) ? parsedTopP : null,
          maxOutputTokens: Number.isFinite(parsedMaxOutputTokens) ? parsedMaxOutputTokens : null,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to start analysis.");
      }

      const analysisId = response.headers.get("X-Analysis-Id");
      const promptVersionId = response.headers.get("X-Prompt-Version-Id");
      setCurrentAnalysisId(analysisId);
      setSelectedHistoryId(analysisId);
      if (promptVersionId) {
        setSelectedPromptId(promptVersionId);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        setCurrentAnalysisText((current) => current + decoder.decode(value, { stream: true }));
      }

      setCurrentAnalysisText((current) => current + decoder.decode());
      toast.success("Analysis completed.");
      await Promise.all([
        fetchAnalyses(selectedTranscript.id),
        fetchPrompts(),
        fetchRankings(selectedRankingPromptId ?? promptVersionId),
        fetchCredits(),
      ]);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Analysis failed.";
      setCurrentAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScoreAnalysis = async (analysisId: string, score: number) => {
    try {
      const response = await fetch(`/api/ai/analyses/${analysisId}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ score }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to save analysis score.");
      }

      toast.success("Analysis score saved.");
      await Promise.all([
        fetchAnalyses(selectedTranscriptId),
        fetchRankings(selectedRankingPromptId ?? selectedPromptId),
      ]);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save analysis score.");
    }
  };

  if (isBootstrapping) {
    return (
      <div className="grid h-full place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Loading AI workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[22rem_1fr]">
      <aside className="flex min-h-0 flex-col border-r bg-muted/20">
        <div className="border-b p-4">
          <div className="text-sm font-medium">AI Transcript Analyzer</div>
          <div className="text-xs text-muted-foreground">
            Upload transcripts, version prompts, stream analyses, and score outcomes.
          </div>
        </div>

        <div className="grid gap-2 border-b p-3">
          {drawerTabs.map((tab) => (
            <DrawerTabButton
              key={tab.id}
              active={activeTab === tab.id}
              description={tab.description}
              icon={tab.icon}
              label={tab.label}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "rankings") {
                  void fetchRankings(selectedRankingPromptId ?? selectedPromptId).catch((error) => {
                    console.error(error);
                    toast.error(error instanceof Error ? error.message : "Failed to load rankings.");
                  });
                }
              }}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeTab === "settings" ? (
            <div className="grid gap-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Gateway Key</CardTitle>
                  <CardDescription>
                    The key is stored in plain text in the database for your user account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="gateway-key">Vercel AI Gateway API key</Label>
                    <Input
                      id="gateway-key"
                      type="password"
                      value={gatewayKeyInput}
                      onChange={(event) => setGatewayKeyInput(event.target.value)}
                      placeholder={settings?.hasApiKey ? "A key is already saved. Paste to replace it." : "vercel_ai_gateway_..."}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {settings?.hasApiKey
                      ? `A key is saved${settings.updatedAt ? ` (updated ${formatDateTime(settings.updatedAt)})` : ""}.`
                      : "No AI Gateway key saved yet."}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={isSavingKey} onClick={handleSaveGatewayKey}>
                      {isSavingKey ? <LoaderCircle className="size-4 animate-spin" /> : null}
                      Save key
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSavingKey || !settings?.hasApiKey}
                      onClick={handleRemoveGatewayKey}
                    >
                      Remove key
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Credits</CardTitle>
                  <CardDescription>Live balance from your Vercel AI Gateway account.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-xs">
                  <div>
                    Balance:{" "}
                    <span className="font-medium">
                      {credits?.balance ? formatUsd(Number(credits.balance)) : "n/a"}
                    </span>
                  </div>
                  <div>
                    Total used:{" "}
                    <span className="font-medium">
                      {credits?.totalUsed ? formatUsd(Number(credits.totalUsed)) : "n/a"}
                    </span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void fetchCredits()}>
                    Refresh credits
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === "transcripts" ? (
            <div className="grid gap-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Saved Transcripts</CardTitle>
                  <CardDescription>Search transcripts stored in Vercel Blob and mirrored to the database.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Input
                    value={transcriptSearch}
                    onChange={(event) => setTranscriptSearch(event.target.value)}
                    placeholder="Search transcripts..."
                  />
                  <div className="grid gap-2">
                    {filteredTranscripts.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No saved transcripts yet.</div>
                    ) : (
                      filteredTranscripts.map((transcript) => (
                        <button
                          key={transcript.id}
                          type="button"
                          onClick={() => setSelectedTranscriptId(transcript.id)}
                          className={cn(
                            "grid gap-1 border px-3 py-3 text-left transition-colors",
                            selectedTranscriptId === transcript.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          <div className="text-sm font-medium">{transcript.fileName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(transcript.createdAt)}
                          </div>
                          <div className="line-clamp-3 text-xs text-muted-foreground">
                            {transcript.transcriptText}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === "rankings" ? (
            <div className="grid gap-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>System Prompt Rankings</CardTitle>
                  <CardDescription>Average score and spend by prompt version.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRefreshingRankings}
                    onClick={() => void fetchRankings(selectedRankingPromptId)}
                  >
                    {isRefreshingRankings ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Refresh rankings
                  </Button>
                  <div className="grid gap-2">
                    {rankings?.promptRankings.length ? (
                      rankings.promptRankings.map((prompt) => (
                        <button
                          key={prompt.promptVersionId}
                          type="button"
                          onClick={() => void fetchRankings(prompt.promptVersionId)}
                          className={cn(
                            "grid gap-1 border px-3 py-3 text-left transition-colors",
                            rankings.selectedPromptVersionId === prompt.promptVersionId
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{prompt.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {prompt.averageScore == null ? "Unscored" : `${prompt.averageScore.toFixed(2)}/5`}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {prompt.scoreCount} scored / {prompt.analysisCount} analyses
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Spend: {formatUsd(prompt.totalCostUsd)}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No prompt analytics yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Model Usage</CardTitle>
                  <CardDescription>See how often each model is used and what it costs.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {rankings?.modelUsage.length ? (
                    rankings.modelUsage.map((usage) => (
                      <div key={usage.modelId} className="grid gap-1 border px-3 py-3 text-xs">
                        <div className="font-medium">{usage.modelId}</div>
                        <div className="text-muted-foreground">
                          {usage.analysisCount} analyses / {usage.scoredCount} scored
                        </div>
                        <div className="text-muted-foreground">Spend: {formatUsd(usage.totalCostUsd)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No model usage yet.</div>
                  )}
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Selected Prompt Analyses</CardTitle>
                  <CardDescription>History for the prompt version selected above.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {rankings?.analyses.length ? (
                    rankings.analyses.map((analysis) => (
                      <div key={analysis.id} className="grid gap-2 border px-3 py-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{analysis.modelId}</span>
                          <span className="text-muted-foreground">{formatDateTime(analysis.createdAt)}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {analysis.transcriptFileName} • {formatUsd(analysis.totalCostUsd)}
                        </div>
                        <div className="line-clamp-4 text-muted-foreground">{analysis.resultText}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Select a prompt ranking to see the saved analyses for it.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="min-h-0 overflow-y-auto p-4">
        <div className="mx-auto grid max-w-6xl gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Controls</CardTitle>
              <CardDescription>
                Upload a transcript, choose a model, and run a streaming analysis with versioned prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div
                className={cn(
                  "grid gap-2 border border-dashed p-4 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-border",
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  const file = event.dataTransfer.files[0];
                  if (file) {
                    void handleTranscriptUpload(file);
                  }
                }}
              >
                <div className="mx-auto flex size-10 items-center justify-center rounded-full border">
                  <Upload className="size-4" />
                </div>
                <div className="text-sm font-medium">Drop a transcript here</div>
                <div className="text-xs text-muted-foreground">
                  The file will be stored in Vercel Blob and the extracted text will be saved in the database.
                </div>
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {isUploading ? "Uploading..." : "Choose transcript"}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.md,.markdown,.json,.csv,.srt,.vtt,.log"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleTranscriptUpload(file);
                      event.currentTarget.value = "";
                    }
                  }}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="selected-transcript">Transcript</Label>
                    <select
                      id="selected-transcript"
                      className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none"
                      value={selectedTranscriptId ?? ""}
                      onChange={(event) => setSelectedTranscriptId(event.target.value || null)}
                    >
                      <option value="">Select a transcript</option>
                      {transcripts.map((transcript) => (
                        <option key={transcript.id} value={transcript.id}>
                          {transcript.fileName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="prompt-select">Prompt version</Label>
                    <div className="flex gap-2">
                      <select
                        id="prompt-select"
                        className="h-8 flex-1 border border-input bg-transparent px-2.5 text-xs outline-none"
                        value={selectedPromptId ?? ""}
                        onChange={(event) => handlePromptSelection(event.target.value)}
                      >
                        <option value="">New prompt</option>
                        {prompts.map((prompt) => (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.title}
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" onClick={() => handlePromptSelection("")}>
                        New
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="prompt-title">Prompt title</Label>
                    <Input
                      id="prompt-title"
                      value={promptTitle}
                      onChange={(event) => setPromptTitle(event.target.value)}
                      placeholder="Call summary prompt"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="system-prompt">System prompt</Label>
                    <Textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(event) => setSystemPrompt(event.target.value)}
                      placeholder="Describe how the transcript should be analyzed..."
                      className="min-h-48"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="model-select">Model</Label>
                    <select
                      id="model-select"
                      className="h-8 border border-input bg-transparent px-2.5 text-xs outline-none"
                      value={selectedModelId}
                      onChange={(event) => setSelectedModelId(event.target.value)}
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    {selectedModel ? (
                      <div className="grid gap-1 text-xs text-muted-foreground">
                        <div>{selectedModel.description ?? "No model description provided."}</div>
                        <div>
                          Input: {formatPricingPerMillion(selectedModel.pricing.input)} • Output:{" "}
                          {formatPricingPerMillion(selectedModel.pricing.output)}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        value={temperatureInput}
                        onChange={(event) => setTemperatureInput(event.target.value)}
                        placeholder="0.2"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="top-p">Top P</Label>
                      <Input
                        id="top-p"
                        value={topPInput}
                        onChange={(event) => setTopPInput(event.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max-output-tokens">Max output tokens</Label>
                      <Input
                        id="max-output-tokens"
                        value={maxOutputTokensInput}
                        onChange={(event) => setMaxOutputTokensInput(event.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 border p-3 text-xs text-muted-foreground">
                    <div>
                      Prompt edits are append-only. If you change the prompt text or title, the next analysis creates a new prompt version automatically.
                    </div>
                    <div>
                      Current credits:{" "}
                      <span className="font-medium">
                        {credits?.balance ? formatUsd(Number(credits.balance)) : "n/a"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={isAnalyzing} onClick={handleAnalyze}>
                      {isAnalyzing ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                      {isAnalyzing ? "Analyzing..." : "Analyze transcript"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentAnalysisText("");
                        setCurrentAnalysisError(null);
                        setSelectedHistoryId(analyses[0]?.id ?? null);
                      }}
                    >
                      Reset viewer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Output</CardTitle>
                <CardDescription>
                  {isAnalyzing
                    ? `Streaming analysis${currentAnalysisId ? ` • ${currentAnalysisId}` : ""}`
                    : selectedHistory
                      ? `Showing saved analysis from ${formatDateTime(selectedHistory.createdAt)}`
                      : "Run an analysis or pick a saved result from the history list."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {selectedTranscript ? (
                  <div className="grid gap-1 border p-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{selectedTranscript.fileName}</div>
                    <div>Saved {formatDateTime(selectedTranscript.createdAt)}</div>
                    <a
                      href={selectedTranscript.blobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Open blob file
                    </a>
                  </div>
                ) : null}

                <div className="min-h-80 border p-4">
                  {displayedAnalysisError ? (
                    <div className="text-sm text-destructive">{displayedAnalysisError}</div>
                  ) : displayedAnalysisText ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown isAnimating={isAnalyzing}>{displayedAnalysisText}</Streamdown>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No analysis yet. Upload a transcript and run one from the controls above.
                    </div>
                  )}
                </div>

                {selectedHistory ? (
                  <div className="grid gap-3 border p-3">
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      <div>
                        Model: <span className="font-medium text-foreground">{selectedHistory.modelId}</span>
                      </div>
                      <div>
                        Prompt: <span className="font-medium text-foreground">{selectedHistory.promptTitle}</span>
                      </div>
                      <div>
                        Cost: <span className="font-medium text-foreground">{formatUsd(selectedHistory.totalCostUsd)}</span>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="text-xs font-medium">Score this analysis</div>
                      <ScoreButtons
                        currentScore={displayedAnalysisScore}
                        disabled={isAnalyzing}
                        onSelect={(score) => void handleScoreAnalysis(selectedHistory.id, score)}
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Transcript</CardTitle>
                  <CardDescription>Preview the transcript text saved in the database.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-80 overflow-y-auto border p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                    {selectedTranscript?.transcriptText ?? "Select a transcript to preview it here."}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>Saved analyses for the currently selected transcript.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {analyses.length ? (
                    analyses.map((analysis) => (
                      <button
                        key={analysis.id}
                        type="button"
                        onClick={() => {
                          setSelectedHistoryId(analysis.id);
                          setCurrentAnalysisText(analysis.resultText ?? "");
                          setCurrentAnalysisError(analysis.errorMessage);
                        }}
                        className={cn(
                          "grid gap-2 border px-3 py-3 text-left transition-colors",
                          selectedHistoryId === analysis.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-medium">{analysis.modelId}</div>
                          <div className="text-xs text-muted-foreground">
                            {analysis.score ? `${analysis.score}/5` : "Unscored"}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(analysis.createdAt)} • {formatUsd(analysis.totalCostUsd)}
                        </div>
                        <div className="line-clamp-4 text-xs text-muted-foreground">
                          {analysis.resultText || analysis.errorMessage || "No output saved."}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No analyses saved for this transcript yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
