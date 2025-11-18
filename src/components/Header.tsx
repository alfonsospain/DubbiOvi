'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cloud, Film, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  projectTitle: string;
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

const Header: React.FC<HeaderProps> = ({
  projectTitle,
  onSave,
  isSaving,
  lastSaved,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Film className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold md:text-xl">{projectTitle}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
          ) : (
            <span>Not saved</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            <Cloud className="mr-2 h-4 w-4" />
            Save to Cloud
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
