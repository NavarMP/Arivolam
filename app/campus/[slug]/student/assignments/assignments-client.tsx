"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, AlertCircle, Calendar } from "lucide-react";
import { submitAssignment } from "../student-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Assignment = {
    id: string;
    title: string;
    description: string;
    max_marks: number;
    due_date: string;
    subject: { name: string; code: string };
    creator: { full_name: string };
    my_submission: {
        status: string;
        marks_obtained: number;
        feedback: string;
        submission_date: string;
        content: string;
    } | null;
};

export default function AssignmentsClient({ assignments, slug }: { assignments: Assignment[], slug: string }) {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submissionContent, setSubmissionContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const now = new Date();

    const getStatusInfo = (assignment: Assignment) => {
        const sub = assignment.my_submission;
        const due = new Date(assignment.due_date);
        const isPastDue = now > due;

        if (sub?.status === "graded") {
            return {
                label: `Graded: ${sub.marks_obtained}/${assignment.max_marks}`,
                variant: "default" as const,
                icon: CheckCircle2,
                color: "text-green-500"
            };
        }
        if (sub) {
            return {
                label: "Submitted",
                variant: "secondary" as const,
                icon: CheckCircle2,
                color: "text-blue-500"
            };
        }
        if (isPastDue) {
            return {
                label: "Overdue",
                variant: "destructive" as const,
                icon: AlertCircle,
                color: "text-red-500"
            };
        }
        return {
            label: "Pending",
            variant: "outline" as const,
            icon: Clock,
            color: "text-amber-500"
        };
    };

    const handleOpenSubmit = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionContent(assignment.my_submission?.content || "");
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!selectedAssignment || !submissionContent.trim()) {
            toast.error("Please provide some text for your submission");
            return;
        }

        setIsSubmitting(true);
        const loadId = toast.loading("Submitting assignment...");
        try {
            const result = await submitAssignment(slug, selectedAssignment.id, submissionContent);
            if ((result as any).error) throw new Error((result as any).error);

            toast.success("Assignment submitted successfully!", { id: loadId });
            setIsDialogOpen(false);

            // Hacky reload for now
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message, { id: loadId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (assignments.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No Assignments Yet</h3>
                <p className="text-sm">Enjoy your free time! New assignments will appear here.</p>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map(assignment => {
                const status = getStatusInfo(assignment);
                const StatusIcon = status.icon;

                return (
                    <Card key={assignment.id} className="flex flex-col hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <Badge variant="secondary" className="font-medium">
                                    {assignment.subject.code}
                                </Badge>
                                <Badge variant={status.variant} className="flex items-center gap-1 shrink-0">
                                    <StatusIcon className="h-3 w-3" />
                                    {status.label}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Due: {format(new Date(assignment.due_date), "MMM d, yyyy 'at' h:mm a")}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 text-sm text-muted-foreground">
                            <p className="line-clamp-3 mb-2">{assignment.description || "No description provided."}</p>

                            <div className="mt-4 pt-4 border-t text-xs space-y-1">
                                <p><strong>Teacher:</strong> {assignment.creator.full_name}</p>
                                <p><strong>Max Marks:</strong> {assignment.max_marks}</p>
                                {assignment.my_submission?.feedback && (
                                    <p className="text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                        <strong>Feedback:</strong> {assignment.my_submission.feedback}
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="pt-0">
                            <Button
                                variant={assignment.my_submission ? (assignment.my_submission.status === 'graded' ? "outline" : "secondary") : "default"}
                                className="w-full"
                                onClick={() => handleOpenSubmit(assignment)}
                                disabled={assignment.my_submission?.status === "graded"}
                            >
                                {assignment.my_submission ?
                                    (assignment.my_submission.status === 'graded' ? "View Graded Work" : "Edit Submission") :
                                    "Submit Assignment"
                                }
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Submit Work</DialogTitle>
                        <DialogDescription>
                            {selectedAssignment?.title} ({selectedAssignment?.subject.name})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Submission Text</label>
                            <Textarea
                                placeholder="Type your answer, provide links, or add notes here..."
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                rows={8}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            File attachments are coming in a future update. For now, paste external document links in the text area above.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} type="button">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {assignmentHasSubmission(selectedAssignment) ? 'Update Submission' : 'Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper for the render logic
function assignmentHasSubmission(assignment: Assignment | null) {
    return !!assignment?.my_submission;
}
