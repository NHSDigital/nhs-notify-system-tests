import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { CognitoUserHelper } from '../cognito-user-helper';

const argv = yargs(hideBin(process.argv))
  .options({
    environment: {
      type: 'string',
      demandOption: true,
    },
    username: {
      type: 'string',
      demandOption: true,
    },
    'client-id': {
      type: 'string',
      demandOption: true,
    },
  })
  .parseSync();

async function main() {
  const cognitoUserHelper = await CognitoUserHelper.init(argv.environment);
  await cognitoUserHelper.deleteUser(argv.username, argv.clientId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
