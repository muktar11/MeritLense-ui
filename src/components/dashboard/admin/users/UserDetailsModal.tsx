"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { B2CUser, B2CUserEvaluation, B2CUserActivity, PACKAGE_CONFIGS } from '@/types/b2c-users';
import { UserStatusBadge } from './UserStatusBadge';
import { PackageBadge } from './PackageBadge';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  X,
  Package,
  TrendingUp,
  Activity
} from 'lucide-react';

interface UserDetailsModalProps {
  user: B2CUser | null;
  evaluations: B2CUserEvaluation[];
  activities: B2CUserActivity[];
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ 
  user, 
  evaluations,
  activities,
  isOpen, 
  onClose 
}: UserDetailsModalProps) {
  const t = useTranslations('dashboard.admin.user_management_page.details');

  if (!user) return null;

  const packageDetails = PACKAGE_CONFIGS[user.packageTier];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-500" />
              {t('personalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('fullName')}</p>
                <p className="font-medium">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('email')}</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mobile')}</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {user.mobileNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('country')}</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {user.country}, {user.city}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('language')}</p>
                <p className="font-medium">{user.preferredLanguage.toUpperCase()}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              {t('accountInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('registrationDate')}</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatShortDate(user.registrationDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('lastLogin')}</p>
                <p className="font-medium">{formatShortDate(user.lastLoginDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('contractAccepted')}</p>
                {user.contractAccepted ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {formatShortDate(user.contractAcceptedDate)}
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    <X className="h-3 w-3 mr-1" />
                    Not Accepted
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">{t('currentPackage')}</p>
                <UserStatusBadge status={user.accountStatus} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-500" />
              {t('packageInfo')}
            </h3>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <PackageBadge package={user.packageTier} />
                <p className="text-2xl font-bold text-gray-900">
                  €{packageDetails.price}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('candidateLimit')}</p>
                  <p className="text-xl font-bold text-primary-600">
                    {packageDetails.candidateLimit}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{t('pointsBalance')}</p>
                  <p className="text-xl font-bold text-secondary-600">
                    {user.pointsBalance}
                  </p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">{t('evaluationsUsed')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ 
                        width: `${(user.evaluationsUsed / user.evaluationsTotal) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {user.evaluationsUsed} / {user.evaluationsTotal}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('features')}</p>
                <ul className="space-y-1">
                  {packageDetails.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">
                  {t('upgradePackage')}
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  {t('addPoints')}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Evaluation History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              {t('evaluationHistory')}
            </h3>
            {evaluations.length > 0 ? (
              <div className="space-y-2">
                {evaluations.map((evaluation) => (
                  <div 
                    key={evaluation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div>
                      <p className="font-medium">{evaluation.candidateName}</p>
                      <p className="text-sm text-gray-600">
                        {evaluation.jobRole} • {evaluation.evaluationType}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        evaluation.status === 'completed' ? 'default' : 'secondary'
                      }>
                        {evaluation.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatShortDate(evaluation.createdDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">{t('noEvaluations')}</p>
            )}
          </div>

          <Separator />

          {/* Activity Log */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              {t('activityLog')}
            </h3>
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">{t('noActivity')}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}