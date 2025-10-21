import { getParameter } from '../util/ssm';

export async function getCis2ClientId() {
  return getParameter(`/nhs-notify-main-acct/test/cis2-int/notify-client-id`);
}
