from django.contrib import admin
from .models import Contact_form

# Register your models here.
@admin.register(Contact_form)
class ContactEnquiryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "contact_number",
        "event_type",
        "event_date",
        "status",
        "created_at",
    )
    list_editable = ("status",)
    list_filter = ("event_type", "status", "created_at")
    search_fields = (
        "name",
        "email",
        "contact_number",
        "event_type",
    )
    ordering = ("-created_at",)
