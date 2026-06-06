"use client";
import React from "react";
import { motion } from "framer-motion";
import type { Task } from "./types";

export default function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      className="bg-cu-bg rounded-lg shadow p-3 w-full"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="font-medium text-sm text-cu-text-primary">{task.title}</div>
      <div className="flex items-center justify-between mt-2 text-xs text-cu-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cu-bg-tertiary" />
          <div>{task.assignees?.[0]}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-cu-bg-secondary rounded text-xs">{task.subtasks}</div>
          <div className="text-xs text-cu-text-muted">{task.due}</div>
        </div>
      </div>
    </motion.div>
  );
}
