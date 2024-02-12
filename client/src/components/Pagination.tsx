import { useMemo } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

function createRange(start: number, end: number) {
  return new Array(end - start + 1)
    .fill(0)
    .map((_, i) => ({ value: i + start, hidden: false }));
}

type Props = {
  totalPages: number;
  page: number;
  onChange: (page: number) => void;
};

export const Pagination = ({ totalPages, page, onChange }: Props) => {
  const range = useMemo(() => {
    if (totalPages <= 1) return null;

    const count = 7;
    if (count >= totalPages) return createRange(1, totalPages);

    const leftSibling = Math.max(page - 1, 1);
    const rightSibling = Math.min(page + 1, totalPages);

    const haveLeftDots = leftSibling > 2;
    const haveRightDots = rightSibling < totalPages - 2;

    if (!haveLeftDots && haveRightDots) {
      return [
        ...createRange(1, 5),
        { value: 6, hidden: true },
        { value: totalPages, hidden: false },
      ];
    }

    if (!haveRightDots && haveLeftDots) {
      return [
        { value: 1, hidden: false },
        { value: totalPages - 5, hidden: true },
        ...createRange(totalPages - 4, totalPages),
      ];
    }

    return [
      { value: 1, hidden: false },
      { value: leftSibling - 1, hidden: true },
      ...createRange(leftSibling, rightSibling),
      { value: rightSibling + 1, hidden: true },
      { value: totalPages, hidden: false },
    ];
  }, [page, totalPages]);

  if (!range) return null;

  return (
    <nav className="mx-auto flex w-full justify-center">
      <ul className="flex items-center gap-1">
        <li>
          <Button
            onClick={() => onChange(page - 1)}
            size="sm"
            variant="ghost"
            disabled={page === 1}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">next page</span>
          </Button>
        </li>
        {range.map((v) => (
          <li key={v.value}>
            <Button
              onClick={() => onChange(v.value)}
              size="sm"
              variant={page === v.value ? "outline" : "ghost"}
              className="h-9 w-9"
            >
              {v.hidden ? (
                <>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{v.value}</span>
                </>
              ) : (
                v.value
              )}
            </Button>
          </li>
        ))}
        <li>
          <Button
            onClick={() => onChange(page + 1)}
            size="sm"
            variant="ghost"
            disabled={page === totalPages}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">previous page</span>
          </Button>
        </li>
      </ul>
    </nav>
  );
};
