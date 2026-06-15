'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { loadApiKey, saveApiKey, clearApiKey } from '@/lib/apiKeyStorage';
import { testGeminiConnection } from '@/app/actions';
import { Eye, EyeOff, Key, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AiConfiguration() {
  const { toast } = useToast();
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const savedKey = loadApiKey() || '';
    setKeyInput(savedKey);
    setHasKey(!!savedKey);
  }, []);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      toast({
        title: 'Empty API Key',
        description: 'Please input a valid key or clear existing configurations.',
        variant: 'destructive',
      });
      return;
    }
    saveApiKey(trimmed);
    setHasKey(true);
    toast({
      title: 'Gemini API Key Saved',
      description: 'Your Gemini API Key has been saved locally.',
    });
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput('');
    setHasKey(false);
    toast({
      title: 'Gemini API Key Cleared',
      description: 'Your Gemini API Key has been removed from local storage.',
    });
  };

  const handleTest = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      toast({
        title: 'Test Failed',
        description: 'Please enter an API Key to test.',
        variant: 'destructive',
      });
      return;
    }
    setIsTesting(true);
    try {
      const res = await testGeminiConnection(trimmed);
      if (res.success) {
        toast({
          title: 'Connection Successful',
          description: 'Gemini API Key is valid and working.',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: res.error || 'Invalid Gemini API Key or connection timeout.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Connection Error',
        description: err.message || String(err),
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" /> AI Configuration
        </CardTitle>
        <CardDescription>
          Configure your personal Gemini API Key. Keys are stored safely in your browser's local storage and are never uploaded to any cloud storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
          {hasKey ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> API Key Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 px-2.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5" /> No API Key Configured
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gemini-key">Gemini API Key</Label>
          <div className="relative flex items-center">
            <Input
              id="gemini-key"
              type={showKey ? 'text' : 'password'}
              placeholder="Enter your Gemini API Key..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="pr-10 w-full"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0.5 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-secondary/15 p-3 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-foreground">Need a Gemini API Key?</h4>
            <p className="text-[11px] text-muted-foreground">
              Get a free Gemini API Key from Google AI Studio.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 h-8 text-[11px]">
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer">
              Get API Key
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSave} disabled={isTesting}>
            Save API Key
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={isTesting || !keyInput.trim()}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button variant="secondary" onClick={handleClear} disabled={isTesting || !hasKey}>
            Clear API Key
          </Button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/35 text-[11px] text-muted-foreground border border-border/50">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1.5">
            <p>Your Gemini API Key is stored locally on your device.</p>
            <p>DubbiOvi does not collect, store, or transmit API keys to any DubbiOvi server.</p>
            <p>The key is only used when AI features such as transcription, translation suggestions, or sentiment analysis are requested through Google's Gemini services.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
