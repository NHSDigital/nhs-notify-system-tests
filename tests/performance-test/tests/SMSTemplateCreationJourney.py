import logging
import boto3
import nest_asyncio
from locust import task, between, HttpUser
from locust_plugins.users.playwright import pw, PlaywrightUser, PageWithRetry
from utils.cognito_user_manager import get_created_users
from helpers.functions import run_async, log_and_handle_error
from pages.createTemplate import CreateTemplate
from pages.chooseTemplate import ChooseTemplate
from pages.populateTemplate import PopulateTemplate
from pages.previewTemplate import PreviewTemplate
from pages.submitTemplate import SubmitTemplate
from pages.templateConfirmation import TemplateConfirmation

COGNITO_CLIENT = boto3.client('cognito-idp', region_name='your-region')
CLIENT_ID = 'your-app-client-id'

# Configure logging to capture Playwright errors
logging.basicConfig(level=logging.ERROR)
playwright_logger = logging.getLogger(__name__)

nest_asyncio.apply() # this is needed and should not be removed

# class SMSCreate(PlaywrightUser):
class SMSCreate(HttpUser):
    wait_time = between(1, 5)
    #https://main.web-gateway.dev.nhsnotify.national.nhs.uk
    #host = "http://localhost:3000/templates/create-and-submit-templates"  #Web Template Management Homepage
    #multiplier = 10  # run XX concurrent playwright sessions/browsers for each Locust user. This helps improve load generation efficiency.

    def on_start(self):
        # Assign each user a unique Cognito account
        if not hasattr(self.environment, 'user_index'):
            self.environment.user_index = 0
        index = self.environment.user_index
        self.environment.user_index += 1

        users = get_created_users()
        if index >= len(users):
            raise Exception("Not enough test users created")
        self.username = users[index]["username"]
        self.password = users[index]["password"]

        # Login and get token
        response = COGNITO_CLIENT.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": self.username,
                "PASSWORD": self.password
            },
            ClientId=CLIENT_ID
        )

        self.token = response["AuthenticationResult"]["IdToken"]

    @task
    @pw
    async def WebTemplate(self, page: PageWithRetry):
        headers = {"Authorization": self.token}
        create_template = CreateTemplate(page)
        choose_template = ChooseTemplate(page)
        populate_template = PopulateTemplate(page)
        preview_template = PreviewTemplate(page)
        submit_template = SubmitTemplate(page)
        template_confirmation = TemplateConfirmation(page)

        try:
            await run_async(log_and_handle_error(self,"1_Load Homepage", create_template.load_homepage()))
            await run_async(log_and_handle_error(self,"2_Click Start Now", create_template.click_start_now()))
            await run_async(log_and_handle_error(self,"3_Click Sign in", create_template.click_signin()))
            await run_async(log_and_handle_error(self,"4_Click Create Template", create_template.click_create_template()))
            await run_async(log_and_handle_error(self,"3_Select SMS And Continue", choose_template.choose_template_type("SMS-radio")))
            await run_async(log_and_handle_error(self,"4_Populate SMS Template", populate_template.populate_template()))
            await run_async(log_and_handle_error(self,"5_Preview SMS Template", preview_template.preview_template("sms-submit-radio")))
            await run_async(log_and_handle_error(self,"6_Submit SMS Template", submit_template.submit_template()))
            await run_async(log_and_handle_error(self,"7_Confirm SMS Template", template_confirmation.confirm_template()))
        except Exception as e:
            playwright_logger.error(f"Playwright encountered a critical error: {e}")
            raise  # Reraising to allow Locust to capture it as a task failure
