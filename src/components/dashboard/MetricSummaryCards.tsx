import React from 'react';
import {
  Users,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';

interface MetricSummaryCardsProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  presentToday: number;
  absentToday: number;
  leaveToday: number;
  unmarkedToday: number;
  overallPercentage: number | null;
  lowAttendanceCount: number;
  isAdmin: boolean;
}

export const MetricSummaryCards: React.FC<MetricSummaryCardsProps> = ({
  totalStudents,
  totalTeachers,
  totalClasses,
  presentToday,
  absentToday,
  leaveToday,
  unmarkedToday,
  overallPercentage,
  lowAttendanceCount,
  isAdmin,
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Attendance Metrics Today */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Present Today"
          value={presentToday}
          subtitle="Confirmed in school"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Absent Today"
          value={absentToday}
          subtitle="Unexcused absence"
          icon={XCircle}
          variant="rose"
        />
        <StatCard
          title="On Leave"
          value={leaveToday}
          subtitle="Excused / medical"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          title="Not Yet Marked"
          value={unmarkedToday}
          subtitle={unmarkedToday > 0 ? 'Pending submission' : 'All classes submitted'}
          icon={HelpCircle}
          variant={unmarkedToday > 0 ? 'amber' : 'slate'}
          badgeText={unmarkedToday > 0 ? 'Action Needed' : 'Complete'}
        />
      </div>

      {/* Institutional Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance %"
          value={overallPercentage !== null ? `${overallPercentage}%` : 'Not Started'}
          subtitle="Across school year"
          icon={Percent}
          variant={
            overallPercentage !== null && overallPercentage >= 90
              ? 'emerald'
              : overallPercentage !== null && overallPercentage >= 75
              ? 'amber'
              : 'rose'
          }
        />
        <StatCard
          title="Below Threshold (<75%)"
          value={lowAttendanceCount}
          subtitle="At risk students"
          icon={AlertTriangle}
          variant={lowAttendanceCount > 0 ? 'rose' : 'slate'}
          badgeText={lowAttendanceCount > 0 ? 'Review List' : 'Nominal'}
        />
        <StatCard
          title="Enrolled Students"
          value={totalStudents}
          subtitle="Active roster"
          icon={Users}
          variant="blue"
        />
        {isAdmin ? (
          <StatCard
            title="Faculty & Classes"
            value={`${totalTeachers} / ${totalClasses}`}
            subtitle="Teachers / Classes"
            icon={GraduationCap}
            variant="blue"
          />
        ) : (
          <StatCard
            title="Assigned Classes"
            value={totalClasses}
            subtitle="Your active sections"
            icon={UserCheck}
            variant="blue"
          />
        )}
      </div>
    </div>
  );
};
