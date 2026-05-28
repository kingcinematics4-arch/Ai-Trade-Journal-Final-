'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Award, AlertOctagon } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import AppLayout from '@/components/AppLayout';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { TradesProvider, useTrades } from '@/contexts/TradesContext';
import GoalCard from '@/components/goals/GoalCard';
import GoalFormModal from '@/components/goals/GoalFormModal';
import { generateAiGoalSuggestions } from '@/lib/goals/engine';
import { toast } from 'sonner';

function GoalsContent() {
  const { trades, isLoading } = useTrades();
  const { goals, addGoal, deleteGoal, syncProgress, getActiveGoals, getCompletedGoals, getFailedGoals } = useGoalsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync progress automatically when trades are loaded or change
  useEffect(() => {
    if (!isLoading && trades.length >= 0) {
      syncProgress(trades);
    }
  }, [trades, isLoading, syncProgress]);

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();
  const failedGoals = getFailedGoals();
  const aiSuggestions = generateAiGoalSuggestions(trades);

  const handleAddGoal = (data: any) => {
    addGoal(data);
    toast.success('Goal created successfully!');
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trading Goals</h1>
          <p className="text-muted-foreground text-sm">Set targets, track progress, and improve your edge.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl"><Target className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Active Goals</p>
            <h2 className="text-2xl font-bold text-foreground">{activeGoals.length}</h2>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Award className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <h2 className="text-2xl font-bold text-foreground">{completedGoals.length}</h2>
          </div>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-loss/10 text-loss rounded-xl"><AlertOctagon className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Failed</p>
            <h2 className="text-2xl font-bold text-foreground">{failedGoals.length}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Goals List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Active Targets</h3>
          {activeGoals.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              No active goals. Set a target to stay disciplined!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onDelete={() => deleteGoal(goal.id)} />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 mt-8">Completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onDelete={() => deleteGoal(goal.id)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">AI Suggestions</h3>
          {aiSuggestions.map((suggestion, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card/50 border border-border rounded-xl p-4 hover:border-primary/30 transition group"
            >
              <h4 className="font-semibold text-foreground text-sm mb-1">{suggestion.title}</h4>
              <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>
              <button 
                onClick={() => handleAddGoal(suggestion)}
                className="w-full py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition"
              >
                Accept Goal
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <GoalFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddGoal} 
      />
    </div>
  );
}

export default function GoalsPage() {
  return (
    <AuthGuard>
      <TradesProvider>
        <AppLayout activePath="/goals">
          <GoalsContent />
        </AppLayout>
      </TradesProvider>
    </AuthGuard>
  );
}
