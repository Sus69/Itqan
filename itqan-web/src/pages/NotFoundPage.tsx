import { Link } from 'react-router-dom';
import { Button, Card, EmptyState } from '@/components/ui';
import { Icon } from '@/components/Icon';

/**
 * A wrong URL used to silently redirect to Today, which hid the fact that a
 * bookmark had broken. It now says what happened and offers the three places a
 * learner could reasonably have been heading.
 */
export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-focus space-y-5 anim-fade-up">
      <EmptyState
        icon={<Icon name="search" size={28} />}
        title="That page does not exist"
        body="The link may be out of date. Everything below is one step away."
        action={
          <Link to="/">
            <Button variant="primary">
              <Icon name="home" size={16} /> Go to Today
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Destination to="/learn" icon="learn" title="Learn" body="Qaida and Tajweed courses." />
        <Destination to="/practice" icon="practice" title="Practice" body="Record and review a target." />
        <Destination to="/insights" icon="progress" title="Insights" body="What you have completed." />
      </div>
    </div>
  );
}

function Destination({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: 'learn' | 'practice' | 'progress';
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="block">
      <Card hoverLift className="h-full">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <Icon name={icon} size={19} />
        </span>
        <h2 className="mt-3 text-sm font-bold text-ink">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-faint">{body}</p>
      </Card>
    </Link>
  );
}
