import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecentActivityFeed({
  items,
}: {
  items: { at: string | Date; label: string; detail: string; actor: string }[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-3">
          <ul className="space-y-4">
            {items.map((ev, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">
                  <span className="text-primary">{ev.actor}</span>{' '}
                  <span className="text-muted-foreground font-normal">{ev.label}</span>
                </p>
                <p className="text-muted-foreground">{ev.detail}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatDistanceToNow(new Date(ev.at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
