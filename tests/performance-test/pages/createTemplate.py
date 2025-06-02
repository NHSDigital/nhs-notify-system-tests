class CreateTemplate:
    def __init__(self,page):
        self.page = page
        page.set_default_timeout(10000)  # timeout in ms (10 seconds)

#https://main.web-gateway.dev.nhsnotify.national.nhs.uk
    async def load_homepage(self):
        await self.page.goto("http://localhost:3000/templates/create-and-submit-templates") #Load Template Management Homepage

    async def click_start_now(self):
        await self.page.get_by_text("Start now").click()

    async def click_signin(self):
        await self.page.get_by_text("Sign in").click()

    async def click_create_template(self):
        await self.page.get_by_text("Create template").click()
