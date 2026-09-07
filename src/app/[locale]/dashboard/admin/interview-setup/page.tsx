"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import evaluationService from "@/app/api/evaluations/endpoints";
import type { InterviewConfig, QuestionTemplate } from "@/app/api/interviews/types";
import { CANDIDATE_JOB_ROLES } from "@/app/api/interviews/types";
import type { ScoringRuleSet } from "@/app/api/evaluations/types";
import { QuestionTemplateModal } from "./components/question-template-modal";
import { InterviewConfigModal } from "./components/interview-config-modal";
import { ScoringRuleSetModal } from "./components/scoring-rule-set-modal";

type Tab = "questions" | "configs" | "rulesets";

export default function InterviewSetupPage() {
  const t = useTranslations("dashboard.admin.interviewSetup");
  const [tab, setTab] = useState<Tab>("questions");

  const roleName = (code: string): string => {
    return CANDIDATE_JOB_ROLES.find(r => r.code === code) ? t(`roles.${code}`) : code;
  };

  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [configs, setConfigs] = useState<InterviewConfig[]>([]);
  const [ruleSets, setRuleSets] = useState<ScoringRuleSet[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<InterviewConfig | null>(null);

  const [isRuleSetModalOpen, setIsRuleSetModalOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<ScoringRuleSet | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [templatesData, configsData, ruleSetsData] = await Promise.all([
        interviewService.getQuestionTemplates(),
        interviewService.getConfigs(),
        evaluationService.getRuleSets(),
      ]);
      setTemplates(templatesData);
      setConfigs(configsData);
      setRuleSets(ruleSetsData);
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
    if (!confirm(t("confirm.deleteQuestion", { text: template.question_text.slice(0, 60) }))) return;
    try {
      await interviewService.deleteQuestionTemplate(template.id);
      fetchAll();
    } catch (error) {
      console.error("Failed to delete question template:", error);
      alert(t("errors.deleteQuestionFailed"));
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
    if (!confirm(t("confirm.deleteConfig", { role: roleName(config.role_code), tier: t(`evaluationTiers.${config.evaluation_tier}`) }))) return;
    try {
      await interviewService.deleteConfig(config.id);
      fetchAll();
    } catch (error) {
      console.error("Failed to delete interview configuration:", error);
      alert(t("errors.deleteConfigFailed"));
    }
  };

  const handleAddRuleSet = () => {
    setEditingRuleSet(null);
    setIsRuleSetModalOpen(true);
  };

  const handleEditRuleSet = (ruleSet: ScoringRuleSet) => {
    setEditingRuleSet(ruleSet);
    setIsRuleSetModalOpen(true);
  };

  const handleDeleteRuleSet = async (ruleSet: ScoringRuleSet) => {
    if (!confirm(t("confirm.deleteRuleSet", { name: ruleSet.name, version: ruleSet.version }))) return;
    try {
      await evaluationService.deleteRuleSet(ruleSet.id);
      fetchAll();
    } catch (error) {
      console.error("Failed to delete scoring rule set:", error);
      alert(t("errors.deleteRuleSetFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={tab === "questions" ? handleAddTemplate : tab === "configs" ? handleAddConfig : handleAddRuleSet}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {tab === "questions" ? t("newQuestion") : tab === "configs" ? t("newConfiguration") : t("newRuleSet")}
          </Button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("questions")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "questions" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("tabs.questionTemplates", { count: templates.length })}
          </button>
          <button
            onClick={() => setTab("configs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "configs" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("tabs.interviewConfigurations", { count: configs.length })}
          </button>
          <button
            onClick={() => setTab("rulesets")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "rulesets" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("tabs.scoringRuleSets", { count: ruleSets.length })}
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
                    <TableHead>{t("table.headers.role")}</TableHead>
                    <TableHead>{t("table.headers.question")}</TableHead>
                    <TableHead>{t("table.headers.skill")}</TableHead>
                    <TableHead>{t("table.headers.tier")}</TableHead>
                    <TableHead>{t("table.headers.difficulty")}</TableHead>
                    <TableHead>{t("table.headers.status")}</TableHead>
                    <TableHead>{t("table.headers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("table.noQuestions")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-900">{roleName(template.role_code)}</p>
                          <p className="text-xs text-gray-400">{template.role_code}</p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-700 truncate">{template.question_text}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{template.skill}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-0">{t(`evaluationTiers.${template.evaluation_tier}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{t(`questionDifficulties.${template.difficulty}`)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={template.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {template.is_active ? t("table.active") : t("table.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)} className="text-blue-600 hover:text-blue-700">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template)} className="text-red-600 hover:text-red-700">
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
          ) : tab === "configs" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>{t("table.headers.role")}</TableHead>
                    <TableHead>{t("table.headers.language")}</TableHead>
                    <TableHead>{t("table.headers.tier")}</TableHead>
                    <TableHead>{t("table.headers.questions")}</TableHead>
                    <TableHead>{t("table.headers.duration")}</TableHead>
                    <TableHead>{t("table.headers.status")}</TableHead>
                    <TableHead>{t("table.headers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("table.noConfigs")}
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
                          <span className="text-sm text-gray-600">{t(`languages.${c.language}`)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-0">{t(`evaluationTiers.${c.evaluation_tier}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{c.total_questions}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{c.duration_minutes} min</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={c.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {c.is_active ? t("table.active") : t("table.inactive")}
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>{t("table.headers.role")}</TableHead>
                    <TableHead>{t("table.headers.name")}</TableHead>
                    <TableHead>{t("table.headers.tier")}</TableHead>
                    <TableHead>{t("table.headers.rules")}</TableHead>
                    <TableHead>{t("table.headers.used")}</TableHead>
                    <TableHead>{t("table.headers.status")}</TableHead>
                    <TableHead>{t("table.headers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ruleSets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("table.noRuleSets")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ruleSets.map((rs) => (
                      <TableRow key={rs.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-900">{roleName(rs.role_code)}</p>
                          <p className="text-xs text-gray-400">{rs.role_code}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-700">{rs.name}</p>
                          <p className="text-xs text-gray-400">{rs.version}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-0">{t(`evaluationTiers.${rs.evaluation_tier}`)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{rs.rules.length}</span>
                        </TableCell>
                        <TableCell>
                          {rs.has_usage ? (
                            <Badge className="bg-amber-100 text-amber-800 border-0">{t("table.usedLocked")}</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">{t("table.notYetUsed")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={rs.is_active ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {rs.is_active ? t("table.active") : t("table.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditRuleSet(rs)} className="text-blue-600 hover:text-blue-700">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRuleSet(rs)} className="text-red-600 hover:text-red-700">
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

      <ScoringRuleSetModal
        isOpen={isRuleSetModalOpen}
        onClose={() => setIsRuleSetModalOpen(false)}
        onSuccess={fetchAll}
        ruleSetToEdit={editingRuleSet}
      />
    </div>
  );
}
