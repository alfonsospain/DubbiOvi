'use client';

import React from 'react';
import type { ProjectSettings } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES } from '@/lib/data';

interface ProjectSettingsProps {
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const ProjectSettingsComponent: React.FC<ProjectSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleChange = (field: keyof ProjectSettings, value: string) => {
    if (field === 'projectName') {
      onSettingsChange({ ...settings, projectName: value, title: value });
    } else {
      onSettingsChange({ ...settings, [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Settings</CardTitle>
        <CardDescription>
          Manage your project's metadata and languages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              type="text"
              value={settings.projectName || settings.title || ''}
              onChange={e => handleChange('projectName', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="source-lang">Source Language</Label>
              <Select
                value={settings.sourceLang}
                onValueChange={value => handleChange('sourceLang', value)}
              >
                <SelectTrigger id="source-lang">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="target-lang">Target Language</Label>
              <Select
                value={settings.targetLang}
                onValueChange={value => handleChange('targetLang', value)}
              >
                <SelectTrigger id="target-lang">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="translator">Translator Name</Label>
            <Input
              id="translator"
              type="text"
              value={settings.translator}
              onChange={e => handleChange('translator', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSettingsComponent;
