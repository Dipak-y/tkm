from django.db import models



# Create your models here.

class Contact_form(models.Model):

    SELECT_CHOICES={
    "Weding Planning":"Wedding Planning",
    "Pre_wedding and Engagement":"Pre_wedding and Engagement",
    "Birthday Celebration":"Birthday Celebration",
    "Corporate Event":"Corporate Event",
    "Galas and Award Ceremonies":"Galas and Award Ceremonies",
    "Destination Celebration":"Destination Celebration"
}

    STATUS_CHOICES = [
            ("Pending", "Pending"),
            ("Confirmed", "Confirmed"),
            ("Completed", "Completed"),
            ("Cancelled", "Cancelled"),
        ]


    name = models.CharField(max_length=100)
    email = models.EmailField()
    contact_number = models.CharField(max_length=20)
    event_type = models.CharField(max_length=100, choices=SELECT_CHOICES)
    event_date = models.DateField(null=True, blank=True)
    status = models. CharField(
        max_length=100, choices=STATUS_CHOICES,default="pending"
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.name} - {self.event_type.title}"

