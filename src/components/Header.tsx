'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  MenubarSeparator,
} from '@/components/ui/menubar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mic, FolderOpen, FileSpreadsheet, FileText, Plus, Save, Info, HelpCircle, Copy, ExternalLink, Mail, Github, BookMarked } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  onNewProject: () => void;
  onOpenProject: (projectData: any) => void;
  onSaveProject: () => void;
  onSaveProjectAs: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportWordSource: () => void;
  onExportWordTarget: () => void;
  onExportWordBoth: () => void;
  onExportGlossaryCSV: () => void;
  onExportGlossaryXLSX: () => void;
  onExportGlossaryJSON: () => void;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  onSave,
  isSaving,
  lastSaved,
  onNewProject,
  onOpenProject,
  onSaveProject,
  onSaveProjectAs,
  onExportExcel,
  onExportCSV,
  onExportWordSource,
  onExportWordTarget,
  onExportWordBoth,
  onExportGlossaryCSV,
  onExportGlossaryXLSX,
  onExportGlossaryJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target?.result as string);
          onOpenProject(projectData);
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyCitation = () => {
    const citationText = `Rodríguez Fernández-Peña, A. C. (2026). DubbiOvi (Version 1.2.3 Academic Edition). Alfonso Digital Lab, University of Oviedo. https://doi.org/10.5281/zenodo.20683887`;
    navigator.clipboard.writeText(citationText)
      .then(() => {
        toast({
          title: 'Citation Copied',
          description: 'Academic citation has been copied to your clipboard.',
        });
      })
      .catch(err => {
        console.error(err);
      });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2 mr-2">
        <Mic className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-semibold md:text-xl shrink-0">DUBBIOVI</h1>
      </div>

      {/* Hidden input for project loading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".dubbiovi"
        className="hidden"
      />

      {/* Top-Level Menubar */}
      <Menubar className="border-none bg-transparent h-auto p-0 gap-1 flex shrink-0">
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer hover:bg-muted text-xs px-2.5 py-1 rounded-sm">Project</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onNewProject} className="cursor-pointer gap-2 text-xs">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" /> New Project
            </MenubarItem>
            <MenubarItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer gap-2 text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /> Open Project
            </MenubarItem>
            <MenubarItem onClick={onSaveProject} className="cursor-pointer gap-2 text-xs">
              <Save className="h-3.5 w-3.5 text-muted-foreground" /> Save Project
            </MenubarItem>
            <MenubarItem onClick={onSaveProjectAs} className="cursor-pointer gap-2 text-xs">
              <Save className="h-3.5 w-3.5 text-muted-foreground" /> Save Project As...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer hover:bg-muted text-xs px-2.5 py-1 rounded-sm">Export</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onExportWordSource} className="cursor-pointer gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-blue-400" /> Word: Source Text
            </MenubarItem>
            <MenubarItem onClick={onExportWordTarget} className="cursor-pointer gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-green-400" /> Word: Target Text
            </MenubarItem>
            <MenubarItem onClick={onExportWordBoth} className="cursor-pointer gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-purple-400" /> Word: Both Texts
            </MenubarItem>
            <MenubarItem onClick={onExportExcel} className="cursor-pointer gap-2 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" /> Excel
            </MenubarItem>
            <MenubarItem onClick={onExportCSV} className="cursor-pointer gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-blue-500" /> CSV
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onExportGlossaryCSV} className="cursor-pointer gap-2 text-xs">
              <BookMarked className="h-3.5 w-3.5 text-orange-400" /> Export Glossary: CSV
            </MenubarItem>
            <MenubarItem onClick={onExportGlossaryXLSX} className="cursor-pointer gap-2 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Export Glossary: Excel
            </MenubarItem>
            <MenubarItem onClick={onExportGlossaryJSON} className="cursor-pointer gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-yellow-400" /> Export Glossary: JSON
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger 
            onClick={() => setIsAboutOpen(true)} 
            className="cursor-pointer hover:bg-muted text-xs px-2.5 py-1 rounded-sm"
          >
            About
          </MenubarTrigger>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer hover:bg-muted text-xs px-2.5 py-1 rounded-sm">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setIsHelpOpen(true)} className="cursor-pointer gap-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /> Help & Contact
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Center metadata for spacing */}
      <div className="flex-grow" />

      {/* Project Name display on the right */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-3 py-1.5 rounded bg-secondary/20 max-w-[280px] truncate border border-border/40 shrink-0">
        <span className="text-[9px] uppercase text-muted-foreground/60 font-bold shrink-0">Project:</span>
        <span className="text-foreground truncate">{projectName}</span>
      </div>

      {/* About Modal */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <Mic className="h-5 w-5 text-primary" /> DubbiOvi
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              v1.2.3 Academic Edition (June 2026)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2 text-xs leading-relaxed">
            <div>
              <span className="font-bold text-muted-foreground text-[10px] uppercase">Description</span>
              <p className="text-foreground mt-0.5">Open-source AI-assisted audiovisual translation environment developed for teaching, research and knowledge transfer.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-muted-foreground text-[10px] uppercase">Software Type</span>
                <p className="text-foreground mt-0.5">Open Source Software</p>
              </div>
              <div>
                <span className="font-bold text-muted-foreground text-[10px] uppercase">License</span>
                <p className="text-foreground mt-0.5">MIT License</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-muted-foreground text-[10px] uppercase">Developed Within</span>
                <p className="text-foreground mt-0.5">Alfonso Digital Lab</p>
              </div>
              <div>
                <span className="font-bold text-muted-foreground text-[10px] uppercase">Developer</span>
                <p className="text-foreground mt-0.5">Alfonso C. Rodríguez Fernández-Peña</p>
              </div>
            </div>
            <div>
              <span className="font-bold text-muted-foreground text-[10px] uppercase">Affiliation</span>
              <p className="text-foreground mt-0.5">Department of English, French and German Philology<br />University of Oviedo</p>
            </div>
            <div>
              <span className="font-bold text-muted-foreground text-[10px] uppercase">Repository</span>
              <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-muted-foreground" />
                <a href="https://github.com/alfonsospain/DubbiOvi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono">
                  https://github.com/alfonsospain/DubbiOvi
                </a>
              </p>
            </div>
            <div>
              <span className="font-bold text-muted-foreground text-[10px] uppercase">DOI (Digital Object Identifier)</span>
              <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <a href="https://doi.org/10.5281/zenodo.20683887" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono">
                  https://doi.org/10.5281/zenodo.20683887
                </a>
              </p>
            </div>
            <div>
              <span className="font-bold text-muted-foreground text-[10px] uppercase">Copyright</span>
              <p className="text-foreground mt-0.5">© Alfonso C. Rodríguez Fernández-Peña 2026</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/60 relative">
              <span className="font-bold text-[9px] text-muted-foreground uppercase tracking-wider block">Suggested Academic Citation</span>
              <pre className="font-mono text-[10.5px] mt-2 text-foreground whitespace-pre-wrap leading-normal font-medium bg-background/50 p-2.5 rounded border border-border/30">
                {`Rodríguez Fernández-Peña, A. C. (2026).\nDubbiOvi (Version 1.2.3 Academic Edition).\nAlfonso Digital Lab, University of Oviedo.\nhttps://doi.org/10.5281/zenodo.20683887`}
              </pre>
              <Button size="sm" variant="secondary" onClick={handleCopyCitation} className="mt-2.5 w-full h-8 gap-1.5 text-xs">
                <Copy className="h-3.5 w-3.5" /> Copy Citation
              </Button>
            </div>
          </div>
          <div className="border-t pt-3 mt-1 flex flex-col items-center text-[10px] text-muted-foreground text-center space-y-0.5">
            <p>Built with Next.js, TypeScript, Firebase and Gemini 2.5 Flash.</p>
            <p className="font-semibold text-foreground/80">University of Oviedo · 2026</p>
          </div>
          <DialogFooter className="mt-2">
            <Button size="sm" onClick={() => setIsAboutOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help & Contact Modal */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
              <HelpCircle className="h-5 w-5 text-primary" /> Help & Contact
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 my-2 text-xs leading-normal">
            <p className="font-semibold text-foreground text-sm">Need help using DubbiOvi?</p>
            <p className="text-muted-foreground">
              For bug reports, feature requests, suggestions, teaching applications, research collaborations or academic partnerships, please contact:
            </p>
            <div className="p-3.5 rounded-lg bg-secondary/35 border border-border/40 space-y-2">
              <p className="font-bold text-foreground">Alfonso C. Rodríguez Fernández-Peña</p>
              <p className="text-muted-foreground">Department of English, French and German Philology</p>
              <p className="text-muted-foreground">University of Oviedo</p>
              <div className="pt-1.5 space-y-1.5 text-foreground font-medium">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email: <a href="mailto:rodriguezalfonso@uniovi.es" className="text-primary hover:underline">rodriguezalfonso@uniovi.es</a>
                </p>
                <p className="flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5 text-muted-foreground" />
                  Repository: <a href="https://github.com/alfonsospain/DubbiOvi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/alfonsospain/DubbiOvi</a>
                </p>
              </div>
            </div>
            <p className="text-muted-foreground italic text-center font-medium mt-1">Thank you for helping improve DubbiOvi.</p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setIsHelpOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
