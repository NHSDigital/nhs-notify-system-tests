import {
  DescribeRuleCommand,
  EventBridgeClient,
  PutRuleCommand,
} from '@aws-sdk/client-eventbridge';

const client = new EventBridgeClient({ region: 'eu-west-2' });

export async function describeRule(name: string) {
  return client.send(new DescribeRuleCommand({ Name: name }));
}

export async function putRule(name: string, scheduleExpression: string) {
  return client.send(
    new PutRuleCommand({ Name: name, ScheduleExpression: scheduleExpression })
  );
}
