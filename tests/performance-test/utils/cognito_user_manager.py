import boto3
import uuid

COGNITO_CLIENT = boto3.client('cognito-idp', region_name='your-region')

USER_POOL_ID = 'your-user-pool-id'
CLIENT_ID = 'your-app-client-id'

# Store created users
created_users = []

def create_test_users(count=1, password="Test1234!"):
    global created_users
    created_users = []

    for _ in range(count):
        username = f"testuser_{uuid.uuid4().hex[:8]}"
        try:
            COGNITO_CLIENT.admin_create_user(
                UserPoolId=USER_POOL_ID,
                Username=username,
                TemporaryPassword=password,
                MessageAction="SUPPRESS",
                UserAttributes=[
                    {"Name": "email", "Value": f"{username}@example.com"},
                    {"Name": "email_verified", "Value": "true"},
                ]
            )

            # Set permanent password
            COGNITO_CLIENT.admin_set_user_password(
                UserPoolId=USER_POOL_ID,
                Username=username,
                Password=password,
                Permanent=True
            )

            created_users.append({"username": username, "password": password})
        except Exception as e:
            print(f"Error creating user {username}: {e}")

def get_created_users():
    return created_users
