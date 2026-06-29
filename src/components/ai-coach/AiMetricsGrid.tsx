'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Crosshair, HeartPulse, GitCommit } from 'lucide-react';

interface AiMetricsGridProps {
  scores: {
    disciplineScore: number;
    riskManagementScore: number;
    emotionalControlScore: number;
    consistencyScore: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export default function AiMetricsGrid({ scores }: AiMetricsGridProps) {
  const metrics = [
    {
      id: 'discipline',
      title: 'Discipline',
      value: scores.disciplineScore,
      icon: <Crosshair className="w-5 h-5" />,
      color: 'text-blue-500',
      bgRing: 'text-blue-500/20',
      fillRing: 'text-blue-500',
      desc: 'Rule following & consistency',
    },
    {
      id: 'risk',
      title: 'Risk Mgmt',
      value: scores.riskManagementScore,
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'text-emerald-500',
      bgRing: 'text-emerald-500/20',
      fillRing: 'text-emerald-500',
      desc: 'Drawdown control',
    },
    {
      id: 'emotion',
      title: 'Emotional Control',
      value: scores.emotionalControlScore,
      icon: <HeartPulse className="w-5 h-5" />,
      color: 'text-purple-500',
      bgRing: 'text-purple-500/20',
      fillRing: 'text-purple-500',
      desc: 'Mental stability',
    },
    {
      id: 'consistency',
      title: 'Consistency',
      value: scores.consistencyScore,
      icon: <GitCommit className="w-5 h-5" />,
      color: 'text-orange-500',
      bgRing: 'text-orange-500/20',
      fillRing: 'text-orange-500',
      desc: 'Win-rate stability',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((m) => {
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (m.value / 100) * circumference;

        return (
          <motion.div
            key={m.id}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Hover Glow */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current ${m.color}`}
            />

            <div className="flex justify-between items-start mb-4">
              <div>
                <div
                  className={`p-2 rounded-lg bg-background border border-border inline-flex mb-3 ${m.color}`}
                >
                  {m.icon}
                </div>
                <h3 className="font-semibold text-foreground">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>

              {/* Progress Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    className={`stroke-current ${m.bgRing}`}
                    strokeWidth="6"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                  />
                  <motion.circle
                    className={`stroke-current ${m.fillRing}`}
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ strokeDasharray: circumference }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{m.value}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
