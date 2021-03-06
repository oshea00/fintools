import sendgrid
import os
from sendgrid.helpers.mail import *

def sendWelcomeEmail(email,confirmationid):
    sg = sendgrid.SendGridAPIClient(apikey=os.environ.get('SENDGRID_API_KEY'))
    from_email = Email("moshea@futurtrends.com")
    subject = "Confirm Future Trends Account"
    to_email = Email(email)
    message = "Hi, To confirm your account, please visit https://futurtrends-fintools.herokuapp.com/confirm/{}".format(confirmationid)
    content = Content("text/plain", message)
    mail = Mail(from_email, subject, to_email, content)
    response = sg.client.mail.send.post(request_body=mail.get())

def sendResetEmail(email,resetid):
    sg = sendgrid.SendGridAPIClient(apikey=os.environ.get('SENDGRID_API_KEY'))
    from_email = Email("moshea@futurtrends.com")
    subject = "Confirm Future Trends Account Reset"
    to_email = Email(email)
    message = "Hi, To reset your password, please visit https://futurtrends-fintools.herokuapp.com/resetrequest/{}".format(resetid)
    content = Content("text/plain", message)
    mail = Mail(from_email, subject, to_email, content)
    response = sg.client.mail.send.post(request_body=mail.get())
