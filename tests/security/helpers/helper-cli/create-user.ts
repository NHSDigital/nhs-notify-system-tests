import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { CognitoUserHelper } from 'nhs-notify-system-tests-shared';

const argv = yargs(hideBin(process.argv))
  .options({
    environment: {
      type: 'string',
      demandOption: true,
    },
    'email-prefix': {
      type: 'string',
      demandOption: true,
    },
    password: {
      type: 'string',
      demandOption: true,
    },
    'client-id': {
      type: 'string',
      demandOption: true,
    },
    'client-name': {
      type: 'string',
      demandOption: true,
    },
  })
  .parseSync();

async function main() {
  const cognitoUserHelper = await CognitoUserHelper.init(argv.environment);

  const user = await cognitoUserHelper.createUser(
    argv.emailPrefix,
    argv.password,
    {
      id: argv.clientId,
      name: argv.clientName,
      features: { proofing: true },
      campaignId: 'campaign',
    }
  );

  return user.userId;
}

main()
  .then(console.log)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
