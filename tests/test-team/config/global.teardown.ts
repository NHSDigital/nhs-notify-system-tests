import fs from 'fs';
import { CognitoUserHelper } from '../helpers/cognito-user-helper';

export default async function globalTeardown() {
  try {
    if (!fs.existsSync('createdUsers.json')) {
      console.log('No createdUsers.json file found, skipping teardown.');
      return;
    }

    const data = fs.readFileSync('createdUsers.json', 'utf-8');
    const createdUsers = JSON.parse(data) as { userId: string }[];

    if (!createdUsers.length) {
      console.log('No users to delete.');
      return;
    }

    const cognitoHelper = await CognitoUserHelper.init(`nhs-notify-${process.env.TARGET_ENVIRONMENT}-app`);

    for (const user of createdUsers) {
      if (user?.userId) {
        try {
          await cognitoHelper.deleteUser(user.userId);
          console.log(`Deleted user ${user.userId}`);
        } catch (error) {
          console.error(`Failed to delete user ${user.userId}:`, error);
        }
      }
    }

    // Delete storage state files and createdUsers.json
    const filesToDelete = ['auth.json', 'copy.json', 'delete.json', 'createdUsers.json'];

    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted file ${file}`);
      }
    }

    console.log('Global teardown complete.');
  } catch (error) {
    console.error('Error during globalTeardown:', error);
  }
}
