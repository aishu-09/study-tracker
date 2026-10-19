import { archiveCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";

type Course = { id: string; name: string };

export function CourseList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return <p className="text-muted-foreground">No courses yet. Add one above.</p>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {courses.map((course) => (
        <li key={course.id} className="flex items-center justify-between p-3">
          <span>{course.name}</span>
          <form action={archiveCourse.bind(null, course.id)}>
            <Button type="submit" variant="ghost" size="sm">
              Archive
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}