"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import interviewService from "@/app/api/interviews/endpoints";
import type { InterviewConfig, QuestionTemplate } from "@/app/api/interviews/types";
import { CANDIDATE_JOB_ROLES } from "@/app/api/interviews/types";
import { QuestionTemplateModal } from "./components/question-template-modal";
import { InterviewConfigModal } from "./components/interview-config-modal";

type Tab = "questions" | "configs";

function roleName(code: string): string {
  return CANDIDATE_JOB_ROLES.find(r => r.code === code)?.name ?? code;
}

export default function InterviewSetupPage() {
  const [tab, setTab] = useState<Tab>("questions");

  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [configs, setConfigs] = useState<InterviewConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<InterviewConfig | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [templatesData, configsData] = await Promise.all([
        interviewService.getQuestionTemplates(),
        interviewService.getConfigs(),
      ]);
      setTemplates(templatesData);
      setConfigs(configsData);
    } catch (error) {
      console.error("Failed to fetch interview setup data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateModalOpen(true);
  };

  const handleEditTemplate = (template: QuestionTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async (template: QuestionTemplate) => {
    if (!confirm(`Delete question "${template.question_text.slice(0, 60)}..."? This cannot be undone.`)) return;
    try {
      await interviewService.deleteQuestionTemplate(template.id);
      fetchAll();
    } catch (error) {
      console.error("Failed to delete question template:", error);
      alert("Failed to delete question template. Please try again.");
    }
  };

  const handleAddConfig = () => {
    setEditingConfig(null);
    setIsConfigModalOpen(true);
  };

  const handleEditConfig = (config: InterviewConfig) => {
    setEditingConfig(config);
    setIsConfigModalOpen(true);
  };

  const handleDeleteConfig = async (config: InterviewConfig) => {
    if (!confirm(`Delete the ${roleName(config.role_code)} (${config.evaluation_tier}) configuration? This cannot be undone.`)) return;
    try {
      await interviewService.deleteConfig(config.id);
      fetchAll();
    } catch (error) {
      console.error("Failed to delete interview configuration:", error);
      alert("Failed to delete configuration. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Setup</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage the question bank and interview configurations behind each role package.
            </p>
          </div>
          <Button
            onClick={tab === "questions" ? handleAddTemplate : handleAddConfig}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {tab === "questions" ? "New Question" : "New Configuration"}
          </Button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("questions")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "questions" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Question Templates ({templates.length})
          </button>
          <button
            onClick={() => setTab("configs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "configs" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Interview Configurations ({configs.length})
          </button>
        </div>

        <Card className="bg-white shadow-sm border-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : tab === "questions" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Role</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No question templates yet — add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((t) => (
                      <TableRow key={t.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-900">{t.role_name}</p>
                          <p className="text-xs text-gray-400">{t.role_code}</p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-700 truncate">{t.question_text}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{t.skill}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-0">{t.evaluation_tier}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{t.difficulty}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={t.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {t.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(t)} className="text-blue-600 hover:text-blue-700">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Role</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No interview configurations yet — add one to make a role package selectable when starting a session.
                      </TableCell>
                    </TableRow>
                  ) : (
                    configs.map((c) => (
                      <TableRow key={c.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-900">{roleName(c.role_code)}</p>
                          <p className="text-xs text-gray-400">{c.role_code}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{c.language}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-0">{c.evaluation_tier}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{c.total_questions}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{c.duration_minutes} min</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={c.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditConfig(c)} className="text-blue-600 hover:text-blue-700">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteConfig(c)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <QuestionTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={fetchAll}
        templateToEdit={editingTemplate}
      />

      <InterviewConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSuccess={fetchAll}
        configToEdit={editingConfig}
      />
    </div>
  );
}
