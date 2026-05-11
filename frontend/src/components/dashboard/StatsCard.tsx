import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo' | 'cyan' | 'orange';
  subtitle?: string;
  trend?: { value: number; label: string };
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600', light: 'text-blue-400' },
  green: { bg: 'bg-green-50', icon: 'bg-green-500', text: 'text-green-600', light: 'text-green-400' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-600', light: 'text-yellow-400' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600', light: 'text-purple-400' },
  red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600', light: 'text-red-400' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-600', light: 'text-indigo-400' },
  cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-500', text: 'text-cyan-600', light: 'text-cyan-400' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-500', text: 'text-orange-600', light: 'text-orange-400' },
};

export default function StatsCard({ title, value, icon: Icon, color, subtitle, trend }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.text)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
