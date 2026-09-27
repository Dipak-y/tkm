from django.shortcuts import render, redirect
from .models import Contact_form
from django.contrib import messages
# Create your views here.
def contact_submit(request):
    if request.method == "POST":
        name = request.POST.get("name")
        email = request.POST.get("email")
        contact_number = request.POST.get("contact_number")
        event_type = request.POST.get("event_type")
        event_date = request.POST.get("event_date")
        message = request.POST.get("message")


        Contact_form.objects.create(
            name=name,
            email=email,
            contact_number=contact_number,
            event_type=event_type,
            event_date=event_date,
            message=message,
        )

        messages.success(request,"Your enquiry has been submitted successfully.")

    return redirect("/")

