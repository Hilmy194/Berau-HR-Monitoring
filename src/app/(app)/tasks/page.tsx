import { getCurrentProfile } from "@/lib/session";
import { getTasksForProfile } from "@/lib/services/task.service";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS } from "@/lib/constants";
import { FileText, ListChecks, AlertCircle } from "lucide-react";
import { computeTaskProgress } from "@/lib/services/probation.service";
import { TaskChecklistItem } from "@/components/app/task-checklist-item";

export const metadata = { title: "Probation Tasks — HR Digital" };

export default async function TasksPage() {
  const { profile } = await getCurrentProfile();
  const tasks = await getTasksForProfile(profile.id);
  const progress = computeTaskProgress(tasks);

  const sections = [
    { key: TASK_STATUS.NOT_STARTED, title: "Not Started" },
    { key: TASK_STATUS.IN_PROGRESS, title: "In Progress" },
    { key: TASK_STATUS.COMPLETED, title: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Probation Tasks</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track your onboarding and probation activities. You can update the status of your own checklist items here.
        </p>
      </div>

      {/* Progress overview */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Overall Completion</p>
              <p className="text-3xl font-bold mt-1">
                {progress.progressPercentage}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.completedTasks} completed of {progress.totalTasks} total tasks
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />{progress.totalTasks} Total</Badge>
              <Badge variant="success" className="gap-1.5"><FileText className="h-3.5 w-3.5" />{progress.completedTasks} Done</Badge>
              <Badge variant="warning" className="gap-1.5"><AlertCircle className="h-3.5 w-3.5" />{progress.inProgressTasks + progress.notStartedTasks} Pending</Badge>
            </div>
          </div>
          <Progress value={progress.progressPercentage} className="mt-4 h-3" indicatorClassName="bg-green-500" />
        </CardContent>
      </Card>

      {/* Task list */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">No probation tasks assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tasks.map((task) => (
            <TaskChecklistItem
              key={task.id}
              task={{
                ...task,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
