import React, { useState } from 'react';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

export interface DailyTrendPoint {
  dateLabel: string;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

export interface ClassComparisonPoint {
  className: string;
  totalStudents: number;
  attendanceRate: number;
}

interface AttendanceChartsProps {
  trendData: DailyTrendPoint[];
  classData: ClassComparisonPoint[];
}

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  trendData,
  classData,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'classWise'>('weekly');

  const maxDailyStudents = Math.max(
    ...trendData.map((d) => d.present + d.absent + d.leave),
    10
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Analytics & Trends</h3>
            <p className="text-xs text-slate-500">Visual performance patterns across school days</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'weekly'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Recent Days Trend
            </span>
          </button>
          <button
            onClick={() => setActiveTab('classWise')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'classWise'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Class-Wise Comparison
            </span>
          </button>
        </div>
      </div>

      <div className="mt-5">
        {activeTab === 'weekly' ? (
          <div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-4 justify-end">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-600" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-red-600" /> Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500" /> Leave
              </span>
            </div>

            {/* Daily Trend Bars */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 border-b border-slate-200">
              {trendData.map((day, idx) => {
                const total = day.present + day.absent + day.leave;
                const heightPercent = total > 0 ? (total / maxDailyStudents) * 100 : 8;
                const pPct = total > 0 ? (day.present / total) * 100 : 0;
                const aPct = total > 0 ? (day.absent / total) * 100 : 0;
                const lPct = total > 0 ? (day.leave / total) * 100 : 0;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-bold text-slate-700 mb-1 tabular-nums">
                      {day.percentage > 0 ? `${day.percentage}%` : '—'}
                    </span>
                    <div
                      className="w-full max-w-[38px] rounded-t-md overflow-hidden flex flex-col-reverse bg-slate-100 transition-all group-hover:opacity-90"
                      style={{ height: `${Math.max(heightPercent, 12)}%` }}
                    >
                      <div style={{ height: `${pPct}%` }} className="bg-emerald-600 w-full" title={`Present: ${day.present}`} />
                      <div style={{ height: `${aPct}%` }} className="bg-red-600 w-full" title={`Absent: ${day.absent}`} />
                      <div style={{ height: `${lPct}%` }} className="bg-amber-500 w-full" title={`Leave: ${day.leave}`} />
                    </div>
                    <span className="mt-2 text-xs font-semibold text-slate-600 truncate max-w-full">
                      {day.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Class Comparison Bars */
          <div className="space-y-3.5 py-2">
            {classData.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500">No classes registered yet.</p>
            ) : (
              classData.map((cls, idx) => {
                const isGood = cls.attendanceRate >= 90;
                const isWarning = cls.attendanceRate >= 75 && cls.attendanceRate < 90;
                const color = isGood ? 'bg-emerald-600' : isWarning ? 'bg-amber-500' : 'bg-red-600';

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">{cls.className}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 tabular-nums">{cls.totalStudents} students</span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {cls.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${Math.min(cls.attendanceRate, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
