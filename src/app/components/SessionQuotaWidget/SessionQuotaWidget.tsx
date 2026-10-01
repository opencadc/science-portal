import { SessionQuotaWidgetProps } from '@/app/types/SessionQuotaWidgetProps';
import { SessionQuotaWidgetImpl } from '@/app/implementation/sessionQuotaWidget';

export function SessionQuotaWidget(props: SessionQuotaWidgetProps) {
  return <SessionQuotaWidgetImpl {...props} />;
}
