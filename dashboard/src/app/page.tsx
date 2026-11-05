'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { RunsDirectory } from '@/components/RunsDirectory';
import { RunInspector } from '@/components/RunInspector';
import { ConfigEditor } from '@/components/ConfigEditor';
import { LiveSimulationRunner } from '@/components/LiveSimulationRunner';
import { SupabaseGuideModal } from '@/components/SupabaseGuideModal';
import { ApiSettingsModal, ApiSettings, PROVIDER_PRESETS } from '@/components/ApiSettingsModal';
import {
  getExperimentRuns,
  deleteExperimentRun,
  getNextExperimentId,
  isSupabaseConfigured,
  saveExperimentRun,
} from '@/lib/supabase';
import { DEFAULT_CONFIG, SAMPLE_EXP000 } from '@/lib/sampleData';
import { ExperimentConfig, ExperimentRun } from '@/types/experiment';

const API_SETTINGS_STORAGE_KEY = 'deliberation_byok_settings';

export default function DashboardPage() {
  const [runs, setRuns] = useState<ExperimentRun[]>([SAMPLE_EXP000]);
  const [selectedRunId, setSelectedRunId] = useState<string>('exp000');
  const [activeTab, setActiveTab] = useState<'directory' | 'inspector' | 'config' | 'setup'>('directory');
  const [config, setConfig] = useState<ExperimentConfig>(DEFAULT_CONFIG);
  const [nextExpId, setNextExpId] = useState<string>('exp001');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isRunnerOpen, setIsRunnerOpen] = useState<boolean>(false);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Client-Side BYOK Settings
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    baseUrl: PROVIDER_PRESETS.together.baseUrl,
    provider: 'together',
    storageType: 'local',
  });

  // Load runs and API settings on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const isConfigured = isSupabaseConfigured();
      setSupabaseConnected(isConfigured);

      // 1. Try loading client-side API settings from localStorage or sessionStorage
      try {
        let savedRaw = localStorage.getItem(API_SETTINGS_STORAGE_KEY);
        if (!savedRaw) {
          savedRaw = sessionStorage.getItem(API_SETTINGS_STORAGE_KEY);
        }
        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          if (parsed && typeof parsed.apiKey === 'string') {
            setApiSettings(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load local API settings:', e);
      }

      // 2. Load experiment runs from Supabase or local cache
      const { runs: loadedRuns } = await getExperimentRuns();
      setRuns(loadedRuns);

      if (loadedRuns.length > 0) {
        setSelectedRunId(loadedRuns[0].id);
      }

      const nextId = await getNextExperimentId();
      setNextExpId(nextId);
      setLoading(false);
    }

    loadData();
  }, []);

  const handleSaveApiSettings = (newSettings: ApiSettings, updateModels: boolean = false) => {
    setApiSettings(newSettings);

    try {
      if (newSettings.storageType === 'local') {
        localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        sessionStorage.removeItem(API_SETTINGS_STORAGE_KEY);
      } else {
        sessionStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        localStorage.removeItem(API_SETTINGS_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist API settings:', e);
    }

    // Auto-update default models for that provider if user requests
    if (updateModels) {
      const preset = PROVIDER_PRESETS[newSettings.provider];
      if (preset) {
        setConfig((prev) => ({
          ...prev,
          model_config: {
            ...prev.model_config,
            model_assignments: {
              'MOE Official': preset.defaultModel,
              Teacher: preset.defaultModel,
              DQI_Judge: preset.defaultModel,
            },
          },
        }));
      }
    }
  };

  const handleSelectRun = (id: string) => {
    setSelectedRunId(id);
    setActiveTab('inspector');
  };

  const handleDeleteRun = async (id: string) => {
    await deleteExperimentRun(id);
    const { runs: refreshed } = await getExperimentRuns();
    setRuns(refreshed);
    if (selectedRunId === id && refreshed.length > 0) {
      setSelectedRunId(refreshed[0].id);
    }
  };

  const handleRunFinished = async (newRun: ExperimentRun) => {
    await saveExperimentRun(newRun);
    const { runs: refreshed } = await getExperimentRuns();
    setRuns(refreshed);
    setSelectedRunId(newRun.id);
    setActiveTab('inspector');
    const nextId = await getNextExperimentId();
    setNextExpId(nextId);
  };

  const selectedRun = runs.find((r) => r.id === selectedRunId) || runs[0] || SAMPLE_EXP000;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/60 text-neutral-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedRunId={selectedRunId}
        supabaseConnected={supabaseConnected}
        onOpenSetup={() => setIsSetupOpen(true)}
        apiSettings={apiSettings}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'directory' && (
          <RunsDirectory
            runs={runs}
            selectedRunId={selectedRunId}
            onSelectRun={handleSelectRun}
            onNewRun={() => setActiveTab('config')}
            onDeleteRun={handleDeleteRun}
          />
        )}

        {activeTab === 'inspector' && (
          <RunInspector
            run={selectedRun}
            onBackToDirectory={() => setActiveTab('directory')}
          />
        )}

        {activeTab === 'config' && (
          <ConfigEditor
            config={config}
            onChangeConfig={setConfig}
            onLaunchExperiment={() => setIsRunnerOpen(true)}
            nextExpId={nextExpId}
            apiSettings={apiSettings}
            onOpenApiSettings={() => setIsApiSettingsOpen(true)}
          />
        )}
      </main>

      {/* Live Simulation Runner Modal */}
      <LiveSimulationRunner
        config={config}
        targetExpId={nextExpId}
        isOpen={isRunnerOpen}
        onClose={() => setIsRunnerOpen(false)}
        onRunFinished={handleRunFinished}
        apiSettings={apiSettings}
      />

      {/* API Key BYOK Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        settings={apiSettings}
        onSaveSettings={handleSaveApiSettings}
      />

      {/* Supabase Guide Modal */}
      <SupabaseGuideModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        supabaseConnected={supabaseConnected}
      />
    </div>
  );
}
