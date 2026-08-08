import { HeadlessSessionsWidgetProps } from '@/app/types/HeadlessSessionsWidgetProps';
import { HeadlessSessionsWidgetImpl } from '@/app/implementation/headlessSessionsWidget';

export function HeadlessSessionsWidget(props: HeadlessSessionsWidgetProps) {
  return <HeadlessSessionsWidgetImpl {...props} />;
}
