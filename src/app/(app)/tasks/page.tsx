import { getCurrentProfile } from "@/lib/session";
import { getTaskPicContact, getTasksForProfile } from "@/lib/services/task.service";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS } from "@/lib/constants";
import { FileText, ListChecks, AlertCircle } from "lucide-react";
import { computeTaskProgress } from "@/lib/services/probation.service";
import { TaskChecklistItem } from "@/components/app/task-checklist-item";

export const metadata = { title: "Probation Tasks - Harmoni" };

export default async function TasksPage() {
  const { profile } = await getCurrentProfile();
  const tasks = await getTasksForProfile(profile.id);
  const progress = computeTaskProgress(tasks);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Probation Tasks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your onboarding and probation activities. PIC contact is shown on asset, access, and induction tasks.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium">Overall Completion</p>
              <p className="mt-1 text-3xl font-bold">{progress.progressPercentage}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {progress.completedTasks} completed of {progress.totalTasks} total tasks
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />{progress.totalTasks} Total</Badge>
              <Badge variant="success" className="gap-1.5"><FileText className="h-3.5 w-3.5" />{progress.completedTasks} Done</Badge>
              <Badge variant="warning" className="gap-1.5"><AlertCircle className="h-3.5 w-3.5" />{progress.inProgressTasks + progress.notStartedTasks} Pending</Badge>
            </div>
          </div>
          <Progress value={progress.progressPercentage} className="mt-4 h-3 bg-slate-200" indicatorClassName="bg-green-600" />
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ListChecks className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No probation tasks assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {tasks.map((task) => (
            <TaskChecklistItem
              key={task.id}
              task={{
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                notes: task.notes,
                status: task.status,
                requiresAttachment: task.requiresAttachment,
                attachmentUrl: task.attachmentUrl,
                attachmentName: task.attachmentName,
                pic: getTaskPicContact(task.title, task.description ?? "", task),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
