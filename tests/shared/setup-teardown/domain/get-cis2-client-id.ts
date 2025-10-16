import { getParameter } from '../util/ssm';

export async function getCis2ClientId() {
  return getParameter(`/test/cis2-int/notify-client-id`);
}
