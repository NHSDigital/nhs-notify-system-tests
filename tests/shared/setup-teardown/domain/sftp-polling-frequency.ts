import { describeRule, putRule } from '../util/eventbridge';

export async function increaseSftpPollingFrequency(
  environment: string
): Promise<string> {
  const ruleName = `nhs-notify-${environment}-app-api-sftp-poll-wtmmock`;

  const initialState = await describeRule(ruleName);

  const intialScheduleExpression = initialState.ScheduleExpression;

  if (!intialScheduleExpression) {
    throw new Error(
      `Cannot modify SFTP polling rule ${ruleName} because the initial schedule expression is undefined`
    );
  }

  await putRule(ruleName, 'rate(1 minute)');

  return intialScheduleExpression;
}

export async function restoreSftpPollingFrequency(
  environment: string,
  intialScheduleExpression: string
) {
  const ruleName = `nhs-notify-${environment}-app-api-sftp-poll-wtmmock`;

  await putRule(ruleName, intialScheduleExpression);
}
